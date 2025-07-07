"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase, type Agent } from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import {
  ArrowLeft,
  Smartphone,
  Filter,
  Clock,
  CheckCircle,
  X,
  Wallet,
  CreditCard,
  MessageCircle,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"
import { format } from "date-fns"

interface DataOrder {
  id: string
  created_at: string
  recipient_phone: string
  payment_reference: string
  commission_amount: number
  payment_method: "manual" | "wallet"
  status: "pending" | "processing" | "completed" | "canceled"
  admin_message?: string
  data_bundles: {
    name: string
    provider: string
    size_gb: number
    price: number
  }
}

const ITEMS_PER_PAGE = 10

export default function DataOrdersPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [orders, setOrders] = useState<DataOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [paginatedOrders, setPaginatedOrders] = useState<DataOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<DataOrder | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    setWalletBalance(currentAgent.wallet_balance || 0)
    loadOrders(currentAgent.id)
    setupRealTimeUpdates(currentAgent.id)
  }, [router])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, providerFilter])

  useEffect(() => {
    paginateOrders()
  }, [filteredOrders, currentPage])

  const setupRealTimeUpdates = (agentId: string) => {
    const orderChannel = supabase
      .channel("data-order-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "data_orders",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadOrders(agentId)
        },
      )
      .subscribe()

    const walletChannel = supabase
      .channel("wallet-balance-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agents",
          filter: `id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.new?.wallet_balance !== undefined) {
            setWalletBalance(payload.new.wallet_balance)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(walletChannel)
    }
  }

  const loadOrders = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from("data_orders")
        .select("*, data_bundles(name, provider, size_gb, price)")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.recipient_phone.includes(searchTerm) ||
          order.payment_reference.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.name.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.provider.toLowerCase().includes(searchTermLower),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }
    if (providerFilter !== "all") {
      filtered = filtered.filter((order) => order.data_bundles?.provider === providerFilter)
    }
    setFilteredOrders(filtered)
    setCurrentPage(1)
  }

  const paginateOrders = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    setPaginatedOrders(paginated)
    setTotalPages(Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))
  }

  const refreshOrders = async () => {
    if (agent) await loadOrders(agent.id)
  }

  const refreshWalletBalance = async () => {
    if (!agent) return
    try {
      const { data, error } = await supabase.from("agents").select("wallet_balance").eq("id", agent.id).single()
      if (error) throw error
      setWalletBalance(data?.wallet_balance || 0)
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("data_orders").delete().eq("id", orderId)
      if (error) throw error
      setOrders(orders.filter((order) => order.id !== orderId))
      setShowDeleteDialog(false)
      setOrderToDelete(null)
      alert("Order deleted successfully")
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("Failed to delete order. Please try again.")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "canceled":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const openMessageDialog = (order: DataOrder) => {
    setSelectedOrder(order)
    setShowMessageDialog(true)
  }

  const openDeleteDialog = (orderId: string) => {
    setOrderToDelete(orderId)
    setShowDeleteDialog(true)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const downloadReport = async () => {
    if (!agent) return
    setIsDownloading(true)
    try {
      // Use filtered orders based on current filters
      const ordersToDownload = [...filteredOrders]

      if (ordersToDownload.length === 0) {
        alert("No orders found matching your current filters.")
        return
      }

      const headers = [
        "Order ID",
        "Date",
        "Time",
        "Bundle Name",
        "Provider",
        "Size (GB)",
        "Recipient Phone",
        "Amount (GH₵)",
        "Commission (GH₵)",
        "Payment Method",
        "Status",
        "Payment Reference",
        "Admin Message",
      ]

      const csvContent = [
        headers.join(","),
        ...ordersToDownload.map((order) => {
          const timestamp = formatTimestamp(order.created_at)
          return [
            order.id,
            `"${timestamp.date}"`,
            `"${timestamp.time}"`,
            `"${order.data_bundles?.name || ""}"`,
            order.data_bundles?.provider || "",
            order.data_bundles?.size_gb || "",
            order.recipient_phone,
            order.data_bundles?.price?.toFixed(2) || "0.00",
            order.commission_amount.toFixed(2),
            order.payment_method,
            order.status,
            `"${order.payment_reference}"`,
            `"${order.admin_message || "No message"}"`,
          ].join(",")
        }),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)

      // Create filename based on filters
      let filterDescription = ""
      if (statusFilter !== "all" || providerFilter !== "all" || searchTerm) {
        const filters = []
        if (statusFilter !== "all") filters.push(statusFilter)
        if (providerFilter !== "all") filters.push(providerFilter)
        if (searchTerm) filters.push("search")
        filterDescription = `-${filters.join("-")}`
      }

      const timestamp = format(new Date(), "yyyy-MM-dd-HHmm")
      link.setAttribute("download", `data-orders-report${filterDescription}-${timestamp}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success message
      const orderCount = ordersToDownload.length
      let filterText = ""
      if (statusFilter !== "all" || providerFilter !== "all" || searchTerm) {
        const activeFilters = []
        if (statusFilter !== "all") activeFilters.push(`Status: ${statusFilter}`)
        if (providerFilter !== "all") activeFilters.push(`Provider: ${providerFilter}`)
        if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`)
        filterText = ` with filters (${activeFilters.join(", ")})`
      }

      alert(`Successfully downloaded ${orderCount} order${orderCount !== 1 ? "s" : ""}${filterText}!`)
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Failed to download report. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading your data orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
                >
                  <Link href="/agent/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    My Data Orders
                  </h1>
                  <p className="text-emerald-100 font-medium text-sm sm:text-base">
                    Track your data bundle orders and commissions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                  <div className="flex items-center gap-2 text-white">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm font-medium">GH₵ {walletBalance.toFixed(2)}</span>
                    <Button
                      onClick={refreshWalletBalance}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {orders.filter((order) => order.status === "completed").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-amber-100 text-xs sm:text-sm font-medium">Pending</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {orders.filter((order) => order.status === "pending").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Commission</p>
                <p className="text-lg sm:text-xl font-bold">
                  GH₵{" "}
                  {orders
                    .filter((order) => order.status === "completed")
                    .reduce((sum, order) => sum + order.commission_amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Data Orders ({filteredOrders.length} total)
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  Showing {paginatedOrders.length} of {filteredOrders.length} orders
                  {(statusFilter !== "all" || providerFilter !== "all" || searchTerm) && (
                    <span className="ml-2 text-blue-600 font-medium">• Filtered results</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={refreshOrders}
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                  >
                    <Link href="/agent/data-order">
                      <Plus className="h-4 w-4 mr-2" />
                      New Order
                    </Link>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadReport}
                    disabled={isDownloading || filteredOrders.length === 0}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white min-w-[140px]"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4"></div>
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  <SelectItem value="Telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {paginatedOrders.length === 0 ? (
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="text-center py-12">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Orders Found</h3>
                <p className="text-emerald-600 mb-6">
                  {searchTerm || statusFilter !== "all" || providerFilter !== "all"
                    ? "No orders match your current filters."
                    : "You haven't placed any data orders yet."}
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  <Link href="/agent/data-order">
                    <Plus className="h-4 w-4 mr-2" />
                    Place Your First Order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedOrders.map((order) => {
                const timestamp = formatTimestamp(order.created_at)
                return (
                  <Card
                    key={order.id}
                    className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-emerald-200 shrink-0">
                              <img
                                src={
                                  order.data_bundles?.provider === "MTN"
                                    ? "/images/mtn.jpg"
                                    : order.data_bundles?.provider === "AirtelTigo"
                                      ? "/images/airteltigo.jpg"
                                      : "/images/telecel.jpg"
                                }
                                alt={`${order.data_bundles?.provider} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-emerald-800 text-xl mb-1">{order.data_bundles?.name}</h3>
                              <p className="text-emerald-600 font-medium mb-2">
                                {order.data_bundles?.size_gb}GB • {order.data_bundles?.provider}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 text-emerald-500"></div>
                                <span className="text-sm text-emerald-600">
                                  {timestamp.date} at {timestamp.time}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start lg:items-end gap-3">
                            <Badge
                              className={`${getStatusColor(order.status)} flex items-center gap-1 text-sm px-3 py-1`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-sm px-3 py-1 ${
                                order.payment_method === "wallet"
                                  ? "border-purple-300 text-purple-700 bg-purple-50"
                                  : "border-blue-300 text-blue-700 bg-blue-50"
                              }`}
                            >
                              {order.payment_method === "wallet" ? (
                                <Wallet className="h-4 w-4 mr-1" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-1" />
                              )}
                              {order.payment_method === "wallet" ? "Wallet Payment" : "Manual Payment"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div>
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">
                              Recipient
                            </p>
                            <p className="text-sm text-emerald-800 font-bold">{order.recipient_phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">
                              Amount
                            </p>
                            <p className="text-sm text-emerald-800 font-bold">
                              GH₵ {order.data_bundles?.price.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">
                              Commission
                            </p>
                            <p className="text-sm text-green-600 font-bold">
                              +GH₵ {order.commission_amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">
                              Reference
                            </p>
                            <p className="text-xs text-emerald-800 font-mono bg-white px-2 py-1 rounded border">
                              {order.payment_reference}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Admin Message:</span>
                            {order.admin_message ? (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                Message Available
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500">No message</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() => openMessageDialog(order)}
                            variant="outline"
                            size="sm"
                            className={`flex-1 ${
                              order.admin_message
                                ? "border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/50"
                                : "border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            View Message
                            {order.admin_message && (
                              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                !
                              </span>
                            )}
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(order.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {totalPages > 1 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-emerald-600">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}{" "}
                        orders
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              onClick={() => goToPage(page)}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className={
                                currentPage === page
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Admin Message
            </DialogTitle>
            <DialogDescription className="text-emerald-600">Message from admin regarding your order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Order Details:</p>
                <p className="text-sm text-emerald-700">
                  {selectedOrder.data_bundles?.name} - {selectedOrder.recipient_phone}
                </p>
                <p className="text-xs text-emerald-600">
                  {formatTimestamp(selectedOrder.created_at).date} at {formatTimestamp(selectedOrder.created_at).time}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Admin Message:</p>
                <p className="text-sm text-blue-700">
                  {selectedOrder.admin_message || "No message from admin for this order."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-600">
              Are you sure you want to delete this data order? This action cannot be undone and will not affect the
              admin records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteOrder(orderToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
