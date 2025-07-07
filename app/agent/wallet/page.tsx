"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase, type Agent } from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import {
  ArrowLeft,
  Wallet,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
  Info,
  Calendar,
  Search,
  Download,
} from "lucide-react"

interface WalletTransaction {
  id: string
  created_at: string
  transaction_type: "topup" | "deduction" | "refund"
  amount: number
  description: string
  reference_code: string
  status: "pending" | "approved" | "rejected"
  admin_notes?: string
}

export default function WalletPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    setWalletBalance(currentAgent.wallet_balance || 0)
    loadTransactions(currentAgent.id)
  }, [router])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter])

  const loadTransactions = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.transaction_type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }

  const refreshWalletBalance = async () => {
    if (!agent) return

    try {
      const { data, error } = await supabase.from("agents").select("wallet_balance").eq("id", agent.id).single()

      if (error) throw error
      setWalletBalance(data.wallet_balance || 0)
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  const submitTopUp = async () => {
    if (!agent || !topUpAmount || !paymentReference) return

    const amount = Number.parseFloat(topUpAmount)
    if (amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!paymentReference.trim()) {
      alert("Please enter your transaction reference ID")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("wallet_transactions").insert([
        {
          agent_id: agent.id,
          transaction_type: "topup",
          amount: amount,
          description: `Wallet top-up of GH₵ ${amount.toFixed(2)}`,
          reference_code: paymentReference.trim(),
          status: "pending",
        },
      ])

      if (error) throw error

      alert("Top-up request submitted successfully! It will be processed by admin.")
      setShowTopUpDialog(false)
      setTopUpAmount("")
      setPaymentReference("")
      loadTransactions(agent.id)
    } catch (error) {
      console.error("Error submitting top-up:", error)
      alert("Failed to submit top-up request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to download")
      return
    }

    const headers = ["Date", "Time", "Type", "Description", "Amount (GH₵)", "Status", "Reference Code", "Admin Notes"]

    const csvData = filteredTransactions.map((transaction) => [
      new Date(transaction.created_at).toLocaleDateString(),
      new Date(transaction.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      transaction.transaction_type === "topup"
        ? "Top-up"
        : transaction.transaction_type === "deduction"
          ? "Purchase"
          : "Refund",
      transaction.description,
      transaction.amount.toFixed(2),
      transaction.status,
      transaction.reference_code,
      transaction.admin_notes || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-amber-600" />
    if (status === "rejected") return <X className="h-4 w-4 text-red-600" />

    switch (type) {
      case "topup":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "deduction":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "refund":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAmountColor = (type: string, status: string) => {
    if (status === "rejected") return "text-gray-500"

    switch (type) {
      case "topup":
      case "refund":
        return "text-green-600"
      case "deduction":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading wallet information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
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
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">My Wallet</h1>
                  <p className="text-emerald-100 font-medium text-sm sm:text-base">
                    Manage your wallet balance and transactions
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Balance Section */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Wallet Balance</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-white">GH₵ {walletBalance.toFixed(2)}</span>
                    <Button
                      onClick={refreshWalletBalance}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1">Available for data bundle purchases</p>
                </div>
                <Button
                  onClick={() => setShowTopUpDialog(true)}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Top-ups</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵{" "}
                    {transactions
                      .filter((t) => t.transaction_type === "topup" && t.status === "approved")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    GH₵{" "}
                    {transactions
                      .filter((t) => t.transaction_type === "deduction")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {transactions.filter((t) => t.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  View all your wallet transactions and their status
                </CardDescription>
              </div>
              <Button
                onClick={downloadCSV}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="topup">Top-ups</SelectItem>
                  <SelectItem value="deduction">Deductions</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Transactions Found</h3>
                <p className="text-emerald-600 mb-6">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "No transactions match your current filters."
                    : "Your wallet transactions will appear here."}
                </p>
                <Button
                  onClick={() => setShowTopUpDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Make Your First Top-up
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                        <TableHead className="text-emerald-800 font-semibold">Date</TableHead>
                        <TableHead className="text-emerald-800 font-semibold">Type</TableHead>
                        <TableHead className="text-emerald-800 font-semibold">Description</TableHead>
                        <TableHead className="text-emerald-800 font-semibold">Amount</TableHead>
                        <TableHead className="text-emerald-800 font-semibold">Status</TableHead>
                        <TableHead className="text-emerald-800 font-semibold">Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-emerald-50/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-emerald-500" />
                              <div>
                                <div className="font-medium text-emerald-800">
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-emerald-600">
                                  {new Date(transaction.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.transaction_type, transaction.status)}
                              <span className="capitalize font-medium text-emerald-800">
                                {transaction.transaction_type === "topup"
                                  ? "Top-up"
                                  : transaction.transaction_type === "deduction"
                                    ? "Purchase"
                                    : "Refund"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-emerald-800 text-sm">{transaction.description}</p>
                              {transaction.admin_notes && (
                                <p className="text-xs text-emerald-600 mt-1">Admin: {transaction.admin_notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${getAmountColor(transaction.transaction_type, transaction.status)}`}
                            >
                              {transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                                ? "+"
                                : "-"}
                              GH₵ {transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {transaction.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                              {transaction.status === "rejected" && <X className="h-3 w-3 mr-1" />}
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                              {transaction.reference_code}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <Card key={transaction.id} className="border-emerald-200 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.transaction_type, transaction.status)}
                              <div>
                                <p className="font-medium text-emerald-800 capitalize">
                                  {transaction.transaction_type === "topup"
                                    ? "Top-up"
                                    : transaction.transaction_type === "deduction"
                                      ? "Purchase"
                                      : "Refund"}
                                </p>
                                <p className="text-xs text-emerald-600">
                                  {new Date(transaction.created_at).toLocaleDateString()} •{" "}
                                  {new Date(transaction.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${getAmountColor(transaction.transaction_type, transaction.status)}`}
                              >
                                {transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                                  ? "+"
                                  : "-"}
                                GH₵ {transaction.amount.toFixed(2)}
                              </p>
                              <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-emerald-800">{transaction.description}</p>
                            {transaction.admin_notes && (
                              <p className="text-xs text-emerald-600 mt-1">Admin: {transaction.admin_notes}</p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-emerald-100">
                            <p className="text-xs text-emerald-600">
                              Reference:{" "}
                              <code className="bg-emerald-50 px-1 py-0.5 rounded text-emerald-700">
                                {transaction.reference_code}
                              </code>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-emerald-800 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Top Up Wallet
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTopUpDialog(false)}
                className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-emerald-600">
              Add funds to your wallet for faster data bundle purchases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p>
                    Send the amount via MoMo to <strong>0551999901</strong> (Adamantis Solutions)
                  </p>
                  <p className="text-sm">
                    <strong>Important:</strong> Create your own unique transaction reference ID when sending the money
                    and enter the same reference below.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="amount" className="text-emerald-700">
                Amount (GH₵)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g., 50.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="reference" className="text-emerald-700">
                Your Transaction Reference ID
              </Label>
              <Input
                id="reference"
                placeholder="e.g., TOPUP-2024-001 or your custom reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
              <p className="text-xs text-emerald-600 mt-1">
                Enter the same reference ID you used when sending the MoMo payment
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTopUpDialog(false)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
            <Button
              onClick={submitTopUp}
              disabled={submitting || !topUpAmount || !paymentReference}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {submitting ? "Submitting..." : "Submit Top-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
