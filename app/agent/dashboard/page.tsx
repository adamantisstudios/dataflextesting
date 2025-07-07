"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  LogOut,
  Plus,
  MessageCircle,
  Banknote,
  ExternalLink,
  Smartphone,
  Settings,
  Search,
  TrendingUp,
  Users,
  Package,
  Filter,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Mail,
} from "lucide-react"
import { BackToTop } from "@/components/back-to-top"
import AgentReminderPopup from "@/components/agent-reminder-popup"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/supabase"

export default function AgentDashboardPage() {
  const [agent, setAgent] = useState(null)
  const { unreadCount, getUnreadCount, markAsRead } = useUnreadMessages(agent?.id || "", "agent")
  const [services, setServices] = useState([])
  const [referrals, setReferrals] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [dataBundles, setDataBundles] = useState([])
  const [dataOrders, setDataOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [servicesSearchTerm, setServicesSearchTerm] = useState("")
  const [filteredServices, setFilteredServices] = useState([])
  const [showNotification, setShowNotification] = useState(true)
  const [servicesFilter, setServicesFilter] = useState("All Services")
  const [dataBundlesFilter, setDataBundlesFilter] = useState("All Networks")
  const [referralsFilter, setReferralsFilter] = useState("All Referrals")
  const [filteredReferrals, setFilteredReferrals] = useState([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobsAgent, setFilteredJobsAgent] = useState<Job[]>([])
  const [jobSearchTerm, setJobSearchTerm] = useState("")
  const [jobsFilterAgent, setJobsFilterAgent] = useState("All Jobs")
  const [currentJobsPage, setCurrentJobsPage] = useState(1)

  // Pagination states
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [currentReferralsPage, setCurrentReferralsPage] = useState(1)
  const [currentWithdrawalsPage, setCurrentWithdrawalsPage] = useState(1)
  const itemsPerPage = 12

  const router = useRouter()

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      router.push("/agent/login")
      return
    }
    const parsedAgent = JSON.parse(agentData)
    setAgent(parsedAgent)
    loadData(parsedAgent.id)
  }, [router])

  useEffect(() => {
    let filtered = services.filter(
      (service) =>
        service.title?.toLowerCase().includes(servicesSearchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(servicesSearchTerm.toLowerCase()),
    )

    if (servicesFilter !== "All Services") {
      filtered = filtered.filter((service) => {
        const commission = service.commission_amount
        switch (servicesFilter) {
          case "GH₵0-1000":
            return commission >= 0 && commission <= 1000
          case "GH₵1001-5000":
            return commission >= 1001 && commission <= 5000
          case "GH₵5001+":
            return commission >= 5001
          default:
            return true
        }
      })
    }
    setFilteredServices(filtered)
    setCurrentServicesPage(1) // Reset to first page when filtering
  }, [servicesSearchTerm, services, servicesFilter])

  useEffect(() => {
    let filtered = referrals
    if (referralsFilter !== "All Referrals") {
      filtered = referrals.filter((referral) => {
        switch (referralsFilter) {
          case "Pending":
            return referral.status === "pending"
          case "Confirmed":
            return referral.status === "confirmed"
          case "In Progress":
            return referral.status === "in_progress"
          case "Completed":
            return referral.status === "completed"
          case "Rejected":
            return referral.status === "rejected"
          default:
            return true
        }
      })
    }
    setFilteredReferrals(filtered)
    setCurrentReferralsPage(1) // Reset to first page when filtering
  }, [referrals, referralsFilter])

  useEffect(() => {
    let filtered = jobs.filter(
      (job) =>
        job.is_active &&
        (job.job_title?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.employer_name?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.location?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
          job.industry?.toLowerCase().includes(jobSearchTerm.toLowerCase())),
    )

    if (jobsFilterAgent !== "All Jobs") {
      filtered = filtered.filter((job) => {
        switch (jobsFilterAgent) {
          case "Featured":
            return job.is_featured === true
          case "Technology":
          case "Finance":
          case "Healthcare":
          case "Education":
          case "Marketing":
          case "Sales":
          case "Customer Service":
            return job.industry === jobsFilterAgent
          default:
            return true
        }
      })
    }
    setFilteredJobsAgent(filtered)
    setCurrentJobsPage(1)
  }, [jobSearchTerm, jobs, jobsFilterAgent])

  // Pagination helper functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage)
  }

  const handlePageChange = (newPage: number, setCurrentPage: (page: number) => void) => {
    setCurrentPage(newPage)
    scrollToTop()
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    // Calculate which pages to show on mobile (max 3 pages + current)
    const getVisiblePages = () => {
      const isMobile = window.innerWidth < 768
      const maxVisible = isMobile ? 3 : 5

      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }

      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(totalPages, start + maxVisible - 1)
      const adjustedStart = Math.max(1, end - maxVisible + 1)

      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
    }

    const visiblePages = getVisiblePages()

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>

            {/* Show first page if not in visible range */}
            {visiblePages[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(1)}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {visiblePages[0] > 2 && (
                  <PaginationItem>
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-sm">
                      ...
                    </span>
                  </PaginationItem>
                )}
              </>
            )}

            {/* Visible page numbers */}
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Show last page if not in visible range */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <PaginationItem>
                    <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-sm">
                      ...
                    </span>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  const loadData = async (agentId) => {
    try {
      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("service_type", "referral")
        .order("created_at", { ascending: false })

      const { data: referralsData } = await supabase
        .from("referrals")
        .select(`
          *,
          services (title, commission_amount)
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("requested_at", { ascending: false })

      const { data: dataBundlesData } = await supabase
        .from("data_bundles")
        .select("*")
        .eq("is_active", true)
        .order("provider", { ascending: true })

      const { data: dataOrdersData } = await supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles (name, provider, size_gb, price)
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      setServices(servicesData || [])
      setReferrals(referralsData || [])
      setWithdrawals(withdrawalsData || [])
      setDataBundles(dataBundlesData || [])
      setDataOrders(dataOrdersData || [])
      setJobs(jobsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("agent")
    router.push("/")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "confirmed":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const totalEarnings = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.services?.commission_amount || 0), 0)

  const dataEarnings = dataOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.commission_amount, 0)

  const pendingEarnings =
    referrals
      .filter((r) => r.status === "completed" && r.commission_paid === false)
      .reduce((sum, r) => sum + (r.services?.commission_amount || 0), 0) +
    dataOrders
      .filter((o) => o.status === "completed" && o.commission_paid === false)
      .reduce((sum, o) => sum + o.commission_amount, 0)

  const getFilteredDataBundles = (provider) => {
    if (dataBundlesFilter === "All Networks") {
      return dataBundles.filter((bundle) => bundle.provider === provider)
    }
    return dataBundles.filter((bundle) => bundle.provider === provider && bundle.provider === dataBundlesFilter)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">DataFlex Agent Portal</h1>
                <p className="text-emerald-100 font-medium">Welcome back, {agent?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Link href="/agent/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {showNotification && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-lg border-l-4 border-l-emerald-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl animate-pulse">💰</div>
                <div className="font-bold text-white">
                  Promote services and refer projects from companies for bigger commissions and cashout bonuses. Promote
                  to friends, family, and people who need these services.
                </div>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white hover:text-emerald-100 ml-4 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{referrals.length}</div>
              <p className="text-xs text-blue-100 mt-1">Active projects</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Data Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dataOrders.length}</div>
              <p className="text-xs text-purple-100 mt-1">Bundles sold</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">GH₵ {(totalEarnings + dataEarnings).toLocaleString()}</div>
              <p className="text-xs text-emerald-100 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Pending Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">GH₵ {pendingEarnings.toLocaleString()}</div>
              <p className="text-xs text-orange-100 mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Available Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{jobs.filter((job) => job.is_active).length}</div>
              <p className="text-xs text-indigo-100 mt-1">{jobs.filter((job) => job.is_featured).length} featured</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-6 min-w-max w-full bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
              <TabsTrigger
                value="services"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Package className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger
                value="data-bundles"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg relative"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Data Bundles ({dataOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg relative"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Referrals
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="withdrawals"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Banknote className="h-4 w-4 mr-2" />
                Withdrawals
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Jobs ({jobs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="services" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Available Services</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex gap-2">
                  <Select value={servicesFilter} onValueChange={setServicesFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Services">All Services</SelectItem>
                      <SelectItem value="GH₵0-1000">GH₵0-1000</SelectItem>
                      <SelectItem value="GH₵1001-5000">GH₵1001-5000</SelectItem>
                      <SelectItem value="GH₵5001+">GH₵5001+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search services..."
                    value={servicesSearchTerm}
                    onChange={(e) => setServicesSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPaginatedData(filteredServices, currentServicesPage).map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm hover:scale-105"
                >
                  <CardHeader>
                    {service.image_url && (
                      <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden">
                        <img
                          src={service.image_url || "/placeholder.svg?height=192&width=400"}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg text-emerald-800">{service.title}</CardTitle>
                    <CardDescription className="text-emerald-600">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-emerald-600">Commission:</span>
                        <span className="text-xl font-bold text-green-600">
                          GH₵ {service.commission_amount.toLocaleString()}
                        </span>
                      </div>
                      {service.product_cost && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-600">Product Cost:</span>
                          <span className="text-sm font-semibold text-emerald-800">
                            GH₵ {service.product_cost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 flex-1"
                        >
                          <Link href={`/agent/refer/${service.id}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Refer
                          </Link>
                        </Button>
                        {service.materials_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-emerald-300 text-emerald-600 bg-transparent"
                          >
                            <Link href={service.materials_link} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              currentPage={currentServicesPage}
              totalPages={getTotalPages(filteredServices.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentServicesPage)}
            />
          </TabsContent>

          <TabsContent value="data-bundles" className="space-y-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-emerald-800">Data Bundles</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button
                  asChild
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  <Link href="/agent/data-order">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Order Data</span>
                    <span className="sm:hidden">Order Data</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Link href="/agent/data-orders">
                    <Smartphone className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">View All Orders</span>
                    <span className="sm:hidden">View All Orders</span>
                  </Link>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="MTN" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
                {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                  const logoMap = {
                    MTN: "/images/mtn-logo.jpg",
                    AirtelTigo: "/images/airteltigo-logo.jpg",
                    Telecel: "/images/telecel-logo.jpg",
                  }
                  const bundleCount = getFilteredDataBundles(provider).length
                  return (
                    <TabsTrigger
                      key={provider}
                      value={provider}
                      className="text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 lg:p-3 flex items-center justify-center gap-2"
                    >
                      <img
                        src={logoMap[provider] || "/placeholder.svg"}
                        alt={`${provider} logo`}
                        className="w-5 h-5 rounded object-cover"
                      />
                      <div className="flex flex-col items-center">
                        <span className="hidden sm:inline">{provider}</span>
                        <span className="text-xs opacity-75">({bundleCount})</span>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                const providerBundles = getFilteredDataBundles(provider)
                return (
                  <TabsContent key={provider} value={provider} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-emerald-700 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200">
                          <img
                            src={
                              provider === "MTN"
                                ? "/images/mtn.jpg"
                                : provider === "AirtelTigo"
                                  ? "/images/airteltigo.jpg"
                                  : "/images/telecel.jpg"
                            }
                            alt={`${provider} logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{provider} Data Bundles</span>
                      </h3>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        {providerBundles.length} bundles
                      </Badge>
                    </div>
                    {providerBundles.length === 0 ? (
                      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                        <CardContent className="pt-6 text-center">
                          <div className="text-gray-500 mb-4">
                            <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No data bundles available for {provider}</p>
                            <p className="text-sm">Check back later for new bundles</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providerBundles.map((bundle) => (
                          <Card
                            key={bundle.id}
                            className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <CardHeader>
                              {bundle.image_url && (
                                <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden">
                                  <img
                                    src={bundle.image_url || "/placeholder.svg"}
                                    alt={bundle.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <CardTitle className="text-lg text-emerald-800">{bundle.name}</CardTitle>
                              <CardDescription className="text-emerald-600 flex items-center gap-2">
                                <img
                                  src={
                                    bundle.provider === "MTN"
                                      ? "/images/mtn.jpg"
                                      : bundle.provider === "AirtelTigo"
                                        ? "/images/airteltigo.jpg"
                                        : "/images/telecel.jpg"
                                  }
                                  alt={`${bundle.provider} logo`}
                                  className="w-5 h-5 rounded object-cover"
                                />
                                {bundle.size_gb}GB - {bundle.provider}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-emerald-600">Price:</span>
                                  <span className="text-lg font-bold text-emerald-800">
                                    GH₵ {bundle.price.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-emerald-600">Commission:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    GH₵ {(bundle.price * bundle.commission_rate).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-emerald-600">Validity:</span>
                                  <span className="text-sm font-semibold text-emerald-800">
                                    {bundle.validity_months} Months
                                  </span>
                                </div>
                              </div>
                              <Button
                                asChild
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                              >
                                <Link href={`/agent/data-order?bundle=${bundle.id}`}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Order Now
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">My Referrals</h2>
              <div className="flex items-center gap-4">
                <Select value={referralsFilter} onValueChange={setReferralsFilter}>
                  <SelectTrigger className="w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Referrals">All Referrals</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {filteredReferrals.length} referrals
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              {getPaginatedData(filteredReferrals, currentReferralsPage).map((referral) => (
                <Card
                  key={referral.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800 text-lg">{referral.services?.title}</h3>
                        <Badge className={getStatusColor(referral.status)}>{referral.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-emerald-600">
                          <span className="font-medium">Client:</span> {referral.client_name} • {referral.client_phone}
                        </p>
                        <p className="text-emerald-600">{referral.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {referral.allow_direct_contact === false ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              🚫 No Direct Client Contact
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              ✅ Direct Client Contact OK
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            GH₵ {referral.services?.commission_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-500">Commission</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-emerald-600">
                            {referral.status === "completed" && referral.commission_paid
                              ? "✅ Paid"
                              : referral.status === "completed"
                                ? "💰 Ready to withdraw"
                                : "⏳ In progress"}
                          </p>
                          <p className="text-xs text-emerald-500">{formatTimestamp(referral.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-emerald-100">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 relative bg-transparent"
                        >
                          <Link href={`/agent/chat/${referral.id}`} onClick={() => markAsRead(referral.id)}>
                            <div className="relative flex items-center">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat with Admin
                              {getUnreadCount(referral.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse font-bold">
                                  {getUnreadCount(referral.id) > 9 ? "9+" : getUnreadCount(referral.id)}
                                </span>
                              )}
                            </div>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getPaginatedData(filteredReferrals, currentReferralsPage).length === 0 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>
                        {referralsFilter === "All Referrals"
                          ? "No referrals yet. Start referring services to earn commissions!"
                          : `No ${referralsFilter.toLowerCase()} referrals found.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <PaginationControls
              currentPage={currentReferralsPage}
              totalPages={getTotalPages(filteredReferrals.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentReferralsPage)}
            />
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Withdrawal History</h2>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {withdrawals.length} withdrawals
                </Badge>
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  <Link href="/agent/withdraw">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {getPaginatedData(withdrawals, currentWithdrawalsPage).map((withdrawal) => (
                <Card
                  key={withdrawal.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800 text-xl">
                          GH₵ {withdrawal.amount.toLocaleString()}
                        </h3>
                        <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-emerald-600">
                          <span className="font-medium">MoMo Number:</span> {withdrawal.momo_number}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Requested:</span> {formatTimestamp(withdrawal.requested_at)}
                        </p>
                        {withdrawal.paid_at && (
                          <p className="text-emerald-600">
                            <span className="font-medium">Paid:</span> {formatTimestamp(withdrawal.paid_at)}
                          </p>
                        )}
                        {withdrawal.commission_items && withdrawal.commission_items.length > 0 && (
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <p className="text-xs font-medium text-emerald-700 mb-1">Commission Sources:</p>
                            <div className="text-xs text-emerald-600">
                              {withdrawal.commission_items.map((item, index) => (
                                <span key={index}>
                                  {item.type === "referral" ? "Referral" : "Data Order"}
                                  {index < withdrawal.commission_items.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getPaginatedData(withdrawals, currentWithdrawalsPage).length === 0 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No withdrawal requests yet.</p>
                      <p className="text-sm">Complete referrals to earn commissions and request withdrawals.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <PaginationControls
              currentPage={currentWithdrawalsPage}
              totalPages={getTotalPages(withdrawals.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentWithdrawalsPage)}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-800">Profile Settings</h2>
            </div>
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-emerald-700">Full Name</Label>
                      <Input value={agent?.full_name || ""} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-emerald-700">Phone Number</Label>
                      <Input value={agent?.phone_number || ""} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-emerald-700">MoMo Number</Label>
                      <Input value={agent?.momo_number || ""} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-emerald-700">Region</Label>
                      <Input value={agent?.region || ""} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-emerald-100">
                    <p className="text-sm text-emerald-600 mb-2">
                      To update your profile information, please contact support.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                    >
                      <Link href="/agent/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Job Board</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={jobsFilterAgent} onValueChange={setJobsFilterAgent}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Jobs">All Jobs</SelectItem>
                    <SelectItem value="Featured">Featured</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={jobSearchTerm}
                    onChange={(e) => setJobSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {filteredJobsAgent.length} jobs
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {getPaginatedData(filteredJobsAgent, currentJobsPage).map((job) => (
                <Card
                  key={job.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-800 text-lg">{job.job_title}</h3>
                          {job.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Featured</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-emerald-600 flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">Company:</span> {job.employer_name}
                          </p>
                          <p className="text-emerald-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Location:</span> {job.location}
                          </p>
                          <p className="text-emerald-600 flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-medium">Industry:</span> {job.industry}
                          </p>
                          <p className="text-emerald-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Deadline:</span>{" "}
                            {new Date(job.application_deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-600">Salary:</span>
                          {job.salary_type === "negotiable" && (
                            <span className="text-sm text-emerald-800">Negotiable</span>
                          )}
                          {job.salary_type === "exact_amount" && (
                            <span className="text-sm text-emerald-800">
                              {job.salary_currency} {job.salary_exact?.toLocaleString()}
                            </span>
                          )}
                          {job.salary_type === "fixed_range" && (
                            <span className="text-sm text-emerald-800">
                              {job.salary_currency} {job.salary_min?.toLocaleString()} -{" "}
                              {job.salary_max?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <div
                            className="text-sm text-emerald-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: job.description
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/• (.*?)(?=\n|$)/g, "<li>$1</li>")
                                .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc list-inside space-y-1">$1</ul>')
                                .replace(/\n/g, "<br>"),
                            }}
                          />
                        </div>
                        <p className="text-emerald-500 text-xs">
                          <span className="font-medium">Posted:</span> {formatTimestamp(job.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-emerald-100">
                        {job.application_method === "email" ? (
                          <Button
                            asChild
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                          >
                            <a href={`mailto:${job.application_contact}?subject=Application for ${job.job_title}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Apply via Email
                            </a>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                          >
                            <a href={job.application_contact} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply Online
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getPaginatedData(filteredJobsAgent, currentJobsPage).length === 0 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>
                        {jobsFilterAgent === "All Jobs"
                          ? "No jobs available at the moment."
                          : `No ${jobsFilterAgent.toLowerCase()} jobs found.`}
                      </p>
                      <p className="text-sm">Check back later for new opportunities!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <PaginationControls
              currentPage={currentJobsPage}
              totalPages={getTotalPages(filteredJobsAgent.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentJobsPage)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AgentReminderPopup />
      <BackToTop />
    </div>
  )
}
