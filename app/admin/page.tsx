"use client"
import Link from "next/link"
import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription as UIDialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  supabase,
  hashPassword,
  type Agent,
  type Service,
  type Referral,
  type Withdrawal,
  type DataBundle,
  type DataOrder,
  type Job,
  JOB_INDUSTRIES,
} from "@/lib/supabase"
import { getCurrentAdmin, logoutAdmin, getAdminToken, clearAdminSession } from "@/lib/auth"
import { BackToTop } from "@/components/back-to-top"
import { UnreadNotification } from "@/components/unread-notification"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import {
  Users,
  Package,
  Banknote,
  Plus,
  Check,
  Trash2,
  LogOut,
  Edit,
  Smartphone,
  Ban,
  RotateCcw,
  Search,
  AlertTriangle,
  Settings,
  MessageCircle,
  Database,
  Filter,
  Wallet,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Download,
  Send,
  Briefcase,
  Eye,
  Star,
  Calendar,
  MapPin,
  DollarSign,
  Mail,
  LinkIcon,
} from "lucide-react"
import { AdminAuthGuard } from "@/components/admin-auth-guard"

interface BundleGridProps {
  provider: string
  bundles: DataBundle[]
  editBundle: (bundle: DataBundle) => void
  loadData: () => void
}

const BundleGrid: React.FC<BundleGridProps> = ({ provider, bundles, editBundle, loadData }) => {
  const filteredBundles = bundles.filter((bundle) => bundle.provider === provider)

  const deleteBundle = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this data bundle? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("data_bundles").delete().eq("id", bundleId)
      if (error) throw error
      alert("Data bundle deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting data bundle:", error)
      alert("Failed to delete data bundle.")
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {filteredBundles.map((bundle) => (
        <Card
          key={bundle.id}
          className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
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
                <span className="text-sm font-semibold text-emerald-800">GH₵ {bundle.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Commission Rate:</span>
                <span className="text-sm font-semibold text-emerald-800">{bundle.commission_rate * 100}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Validity:</span>
                <span className="text-sm font-semibold text-emerald-800">{bundle.validity_months} Months</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => editBundle(bundle)}
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteBundle(bundle.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AdminDashboardContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [dataOrders, setDataOrders] = useState<DataOrder[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([])
  const [filteredServicesAdmin, setFilteredServicesAdmin] = useState<Service[]>([])
  const [filteredWalletTransactions, setFilteredWalletTransactions] = useState<any[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showBundleDialog, setShowBundleDialog] = useState(false)
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showAgentDialog, setShowAgentDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DataOrder | null>(null)
  const [adminMessage, setAdminMessage] = useState("")
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingBundle, setEditingBundle] = useState<DataBundle | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [referralSearchTerm, setReferralSearchTerm] = useState("")
  const [servicesSearchTerm, setServicesSearchTerm] = useState("")
  const [walletSearchTerm, setWalletSearchTerm] = useState("")
  const [jobSearchTerm, setJobSearchTerm] = useState("")
  const [clearDataType, setClearDataType] = useState<"day" | "month">("day")
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    commission_amount: "",
    product_cost: "",
    materials_link: "",
    image_url: "",
  })
  const [bundleForm, setBundleForm] = useState({
    name: "",
    provider: "",
    size_gb: "",
    price: "",
    validity_months: "3",
    image_url: "",
    commission_rate: "0.05",
  })
  const [jobForm, setJobForm] = useState({
    job_title: "",
    industry: "",
    description: "",
    application_deadline: "",
    location: "",
    salary_type: "negotiable" as "negotiable" | "fixed_range" | "exact_amount",
    salary_min: "",
    salary_max: "",
    salary_exact: "",
    salary_currency: "GHS",
    employer_name: "",
    application_method: "email" as "email" | "hyperlink",
    application_contact: "",
    is_featured: false,
  })
  const [agentPasswordReset, setAgentPasswordReset] = useState("")
  const router = useRouter()
  const admin = getCurrentAdmin()
  const [showAdminPasswordDialog, setShowAdminPasswordDialog] = useState(false)
  const [adminPasswordForm, setAdminPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [clearDataOptions, setClearDataOptions] = useState({
    dataOrders: true,
    referrals: false,
    withdrawals: false,
  })
  const [showNotification, setShowNotification] = useState(true)
  const [servicesFilterAdmin, setServicesFilterAdmin] = useState("All Services")
  const [referralsFilterAdmin, setReferralsFilterAdmin] = useState("All Referrals")
  const [ordersFilterAdmin, setOrdersFilterAdmin] = useState("All Orders")
  const [agentsFilterAdmin, setAgentsFilterAdmin] = useState("All Agents")
  const [payoutsFilterAdmin, setPayoutsFilterAdmin] = useState("All Payouts")
  const [walletFilterAdmin, setWalletFilterAdmin] = useState("All Transactions")
  const [jobsFilterAdmin, setJobsFilterAdmin] = useState("All Jobs")
  const [walletTransactions, setWalletTransactions] = useState<any[]>([])
  const [currentWalletsPage, setCurrentWalletsPage] = useState(1)

  // Pagination states
  const [currentAgentsPage, setCurrentAgentsPage] = useState(1)
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1)
  const [currentReferralsPage, setCurrentReferralsPage] = useState(1)
  const [currentPayoutsPage, setCurrentPayoutsPage] = useState(1)
  const [currentJobsPage, setCurrentJobsPage] = useState(1)
  const itemsPerPage = 12

  const {
    unreadCount: adminUnreadCount,
    getUnreadCount: adminGetUnreadCount,
    markAsRead: adminMarkAsRead,
  } = useUnreadMessages(admin?.id || "", "admin")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = dataOrders.filter(
      (order) =>
        order.agents?.full_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.recipient_phone?.includes(orderSearchTerm) ||
        order.payment_reference?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.data_bundles?.name?.toLowerCase().includes(orderSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (ordersFilterAdmin !== "All Orders") {
      filteredByStatus = filtered.filter((order) => {
        switch (ordersFilterAdmin) {
          case "Pending":
            return order.status === "pending"
          case "Processing":
            return order.status === "processing"
          case "Completed":
            return order.status === "completed"
          case "Canceled":
            return order.status === "canceled"
          default:
            return true
        }
      })
    }
    setFilteredOrders(filteredByStatus)
    setCurrentOrdersPage(1)
  }, [orderSearchTerm, dataOrders, ordersFilterAdmin])

  useEffect(() => {
    const filtered = agents.filter(
      (agent) =>
        agent.full_name?.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.phone_number?.includes(agentSearchTerm) ||
        agent.momo_number?.includes(agentSearchTerm) ||
        agent.region?.toLowerCase().includes(agentSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (agentsFilterAdmin !== "All Agents") {
      filteredByStatus = filtered.filter((agent) => {
        switch (agentsFilterAdmin) {
          case "Approved":
            return agent.isapproved === true
          case "Pending":
            return agent.isapproved === false
          case "Banned":
            return agent.isbanned === true
          default:
            return true
        }
      })
    }
    setFilteredAgents(filteredByStatus)
    setCurrentAgentsPage(1)
  }, [agentSearchTerm, agents, agentsFilterAdmin])

  useEffect(() => {
    const filtered = referrals.filter(
      (referral) =>
        referral.client_name?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.agents?.full_name?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.client_phone?.includes(referralSearchTerm) ||
        referral.services?.title?.toLowerCase().includes(referralSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (referralsFilterAdmin !== "All Referrals") {
      filteredByStatus = filtered.filter((referral) => {
        switch (referralsFilterAdmin) {
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
    setFilteredReferrals(filteredByStatus)
    setCurrentReferralsPage(1)
  }, [referralSearchTerm, referrals, referralsFilterAdmin])

  useEffect(() => {
    const filtered = services.filter(
      (service) =>
        service.title?.toLowerCase().includes(servicesSearchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(servicesSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (servicesFilterAdmin !== "All Services") {
      filteredByStatus = filtered.filter((service) => {
        const commission = service.commission_amount
        switch (servicesFilterAdmin) {
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
    setFilteredServicesAdmin(filteredByStatus)
    setCurrentServicesPage(1)
  }, [servicesSearchTerm, services, servicesFilterAdmin])

  useEffect(() => {
    const filtered = walletTransactions.filter(
      (transaction) =>
        transaction.agents?.full_name?.toLowerCase().includes(walletSearchTerm.toLowerCase()) ||
        transaction.reference_code?.toLowerCase().includes(walletSearchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(walletSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (walletFilterAdmin !== "All Transactions") {
      filteredByStatus = filtered.filter((transaction) => {
        switch (walletFilterAdmin) {
          case "Pending":
            return transaction.status === "pending"
          case "Approved":
            return transaction.status === "approved"
          case "Rejected":
            return transaction.status === "rejected"
          case "Top-ups":
            return transaction.transaction_type === "topup"
          case "Deductions":
            return transaction.transaction_type === "deduction"
          default:
            return true
        }
      })
    }
    setFilteredWalletTransactions(filteredByStatus)
    setCurrentWalletsPage(1)
  }, [walletSearchTerm, walletTransactions, walletFilterAdmin])

  useEffect(() => {
    const filtered = jobs.filter(
      (job) =>
        job.job_title?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.employer_name?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.industry?.toLowerCase().includes(jobSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (jobsFilterAdmin !== "All Jobs") {
      filteredByStatus = filtered.filter((job) => {
        switch (jobsFilterAdmin) {
          case "Active":
            return job.is_active === true
          case "Inactive":
            return job.is_active === false
          case "Featured":
            return job.is_featured === true
          default:
            return true
        }
      })
    }
    setFilteredJobs(filteredByStatus)
    setCurrentJobsPage(1)
  }, [jobSearchTerm, jobs, jobsFilterAdmin])

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

    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768
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

  const handleLogout = async () => {
    const token = getAdminToken()
    if (token) {
      await logoutAdmin(token)
    }
    clearAdminSession()
    router.push("/admin/login")
  }

  const loadData = async () => {
    try {
      console.log("Loading admin data...")
      const [agentsData, servicesData, referralsData, withdrawalsData, bundlesData, ordersData, walletData, jobsData] =
        await Promise.all([
          supabase.from("agents").select("*").order("created_at", { ascending: false }),
          supabase.from("services").select("*").order("created_at", { ascending: false }),
          supabase
            .from("referrals")
            .select(`*, agents (full_name, phone_number), services (title, commission_amount)`)
            .order("created_at", { ascending: false }),
          supabase
            .from("withdrawals")
            .select(`*, agents (full_name, phone_number)`)
            .order("requested_at", { ascending: false }),
          supabase.from("data_bundles").select("*").order("provider", { ascending: true }),
          supabase
            .from("data_orders")
            .select(
              `*, agents (full_name, phone_number), data_bundles (name, provider, size_gb, price, commission_rate)`,
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("wallet_transactions")
            .select(`*, agents (full_name, phone_number, wallet_balance)`)
            .order("created_at", { ascending: false }),
          supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        ])
      setAgents(agentsData.data || [])
      setServices(servicesData.data || [])
      setReferrals(referralsData.data || [])
      setWithdrawals(withdrawalsData.data || [])
      setDataBundles(bundlesData.data || [])
      setDataOrders(ordersData.data || [])
      setWalletTransactions(walletData.data || [])
      setJobs(jobsData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Failed to load admin data. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const updateReferralStatus = async (referralId: string, status: string) => {
    try {
      const updatePayload: { status: string; commission_paid?: boolean } = { status }
      if (status === "completed") {
        updatePayload.commission_paid = false
      } else {
        updatePayload.commission_paid = false
      }
      const { error } = await supabase.from("referrals").update(updatePayload).eq("id", referralId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error updating referral status:", error)
      alert("Failed to update referral status")
    }
  }

  const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
    try {
      console.log(`Updating withdrawal ${withdrawalId} to status: ${status}`)

      const updateData: any = { status }
      const currentTimestamp = new Date().toISOString()

      switch (status) {
        case "paid":
          updateData.paid_at = currentTimestamp
          break
        case "processing":
          updateData.processing_at = currentTimestamp
          break
        case "rejected":
          updateData.rejected_at = currentTimestamp
          break
        case "requested":
          updateData.paid_at = null
          updateData.processing_at = null
          updateData.rejected_at = null
          break
      }

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("commission_items, agent_id")
        .eq("id", withdrawalId)
        .single()

      if (withdrawalError) {
        console.error("Error fetching withdrawal data:", withdrawalError)
        throw withdrawalError
      }

      const { error: updateError } = await supabase.from("withdrawals").update(updateData).eq("id", withdrawalId)

      if (updateError) {
        console.error("Error updating withdrawal:", updateError)
        throw updateError
      }

      if (withdrawalData?.commission_items && Array.isArray(withdrawalData.commission_items)) {
        const updatePromises = []

        for (const item of withdrawalData.commission_items as Array<{ type: string; id: string }>) {
          if (status === "paid") {
            if (item.type === "referral") {
              updatePromises.push(supabase.from("referrals").update({ commission_paid: true }).eq("id", item.id))
            } else if (item.type === "data_order") {
              updatePromises.push(supabase.from("data_orders").update({ commission_paid: true }).eq("id", item.id))
            }
          } else if (status === "rejected" || status === "requested") {
            if (item.type === "referral") {
              updatePromises.push(supabase.from("referrals").update({ commission_paid: false }).eq("id", item.id))
            } else if (item.type === "data_order") {
              updatePromises.push(supabase.from("data_orders").update({ commission_paid: false }).eq("id", item.id))
            }
          }
        }

        if (updatePromises.length > 0) {
          const results = await Promise.all(updatePromises)
          const commissionErrors = results.filter((result) => result.error)

          if (commissionErrors.length > 0) {
            console.error("Errors updating commission status:", commissionErrors)
            alert("Withdrawal status updated but some commission statuses may not have updated properly")
            loadData()
            return
          }
        }
      }

      const statusMessages = {
        requested: "marked as requested",
        processing: "moved to processing",
        paid: "marked as paid and commission statuses updated",
        rejected: "rejected and commission statuses reset",
      }

      alert(`Withdrawal ${statusMessages[status as keyof typeof statusMessages] || "updated"} successfully`)
      loadData()
    } catch (error) {
      console.error("Error updating withdrawal status:", error)
      alert("Failed to update withdrawal status. Please try again.")
    }
  }

  const approveAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: true }).eq("id", agentId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error approving agent:", error)
      alert("Failed to approve agent")
    }
  }

  const banAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: false }).eq("id", agentId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error banning agent:", error)
      alert("Failed to ban agent")
    }
  }

  const deleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("agents").delete().eq("id", agentId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error deleting agent:", error)
      alert("Failed to delete agent")
    }
  }

  const resetAgentPassword = async () => {
    if (!selectedAgent || !agentPasswordReset) return
    try {
      const passwordHash = await hashPassword(agentPasswordReset)
      const { error } = await supabase.from("agents").update({ password_hash: passwordHash }).eq("id", selectedAgent.id)
      if (error) throw error
      alert(`Password reset successfully for ${selectedAgent.full_name}`)
      setShowAgentDialog(false)
      setAgentPasswordReset("")
      setSelectedAgent(null)
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Failed to reset password")
    }
  }

  const createOrUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const serviceData = {
        ...serviceForm,
        commission_amount: Number.parseFloat(serviceForm.commission_amount),
        product_cost: serviceForm.product_cost ? Number.parseFloat(serviceForm.product_cost) : 0,
        service_type: "referral" as const,
      }
      if (editingService) {
        const { error } = await supabase.from("services").update(serviceData).eq("id", editingService.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("services").insert([serviceData])
        if (error) throw error
      }
      setShowServiceDialog(false)
      setEditingService(null)
      setServiceForm({
        title: "",
        description: "",
        commission_amount: "",
        product_cost: "",
        materials_link: "",
        image_url: "",
      })
      loadData()
    } catch (error) {
      console.error("Error saving service:", error)
      alert("Failed to save service")
    }
  }

  const createOrUpdateBundle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const bundleData = {
        ...bundleForm,
        size_gb: Number.parseInt(bundleForm.size_gb),
        price: Number.parseFloat(bundleForm.price),
        validity_months: Number.parseInt(bundleForm.validity_months),
        commission_rate: Number.parseFloat(bundleForm.commission_rate),
      }
      if (editingBundle) {
        const { error } = await supabase.from("data_bundles").update(bundleData).eq("id", editingBundle.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("data_bundles").insert([bundleData])
        if (error) throw error
      }
      setShowBundleDialog(false)
      setEditingBundle(null)
      setBundleForm({
        name: "",
        provider: "",
        size_gb: "",
        price: "",
        validity_months: "3",
        image_url: "",
        commission_rate: "0.05",
      })
      loadData()
    } catch (error) {
      console.error("Error saving bundle:", error)
      alert("Failed to save bundle")
    }
  }

  const createOrUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const jobData = {
        ...jobForm,
        salary_min: jobForm.salary_min ? Number.parseFloat(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? Number.parseFloat(jobForm.salary_max) : null,
        salary_exact: jobForm.salary_exact ? Number.parseFloat(jobForm.salary_exact) : null,
        is_active: true,
      }

      if (editingJob) {
        const { error } = await supabase.from("jobs").update(jobData).eq("id", editingJob.id)
        if (error) throw error
        alert("Job updated successfully!")
      } else {
        const { error } = await supabase.from("jobs").insert([jobData])
        if (error) throw error
        alert("Job created successfully!")
      }

      setShowJobDialog(false)
      setEditingJob(null)
      setJobForm({
        job_title: "",
        industry: "",
        description: "",
        application_deadline: "",
        location: "",
        salary_type: "negotiable",
        salary_min: "",
        salary_max: "",
        salary_exact: "",
        salary_currency: "GHS",
        employer_name: "",
        application_method: "email",
        application_contact: "",
        is_featured: false,
      })
      loadData()
    } catch (error) {
      console.error("Error saving job:", error)
      alert("Failed to save job")
    }
  }

  const updateDataOrderStatus = async (orderId: string, status: string) => {
    try {
      const updatePayload: { status: string; commission_paid?: boolean } = { status }
      if (status === "completed") {
        updatePayload.commission_paid = false
      } else {
        updatePayload.commission_paid = false
      }
      const { error } = await supabase.from("data_orders").update(updatePayload).eq("id", orderId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Failed to update order status")
    }
  }

  const editService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      title: service.title,
      description: service.description,
      commission_amount: service.commission_amount.toString(),
      product_cost: service.product_cost?.toString() || "",
      materials_link: service.materials_link || "",
      image_url: service.image_url || "",
    })
    setShowServiceDialog(true)
  }

  const editBundle = (bundle: DataBundle) => {
    setEditingBundle(bundle)
    setBundleForm({
      name: bundle.name || "",
      provider: bundle.provider || "",
      size_gb: bundle.size_gb?.toString() || "",
      price: bundle.price?.toString() || "",
      validity_months: bundle.validity_months?.toString() || "3",
      image_url: bundle.image_url || "",
      commission_rate: bundle.commission_rate?.toString() || "0.05",
    })
    setShowBundleDialog(true)
  }

  const editJob = (job: Job) => {
    setEditingJob(job)
    setJobForm({
      job_title: job.job_title,
      industry: job.industry,
      description: job.description,
      application_deadline: job.application_deadline.split("T")[0], // Format for date input
      location: job.location,
      salary_type: job.salary_type,
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      salary_exact: job.salary_exact?.toString() || "",
      salary_currency: job.salary_currency,
      employer_name: job.employer_name,
      application_method: job.application_method,
      application_contact: job.application_contact,
      is_featured: job.is_featured,
    })
    setShowJobDialog(true)
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId)
      if (error) throw error
      alert("Job deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Failed to delete job.")
    }
  }

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("jobs").update({ is_active: !isActive }).eq("id", jobId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error updating job status:", error)
      alert("Failed to update job status")
    }
  }

  const toggleJobFeatured = async (jobId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase.from("jobs").update({ is_featured: !isFeatured }).eq("id", jobId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error updating job featured status:", error)
      alert("Failed to update job featured status")
    }
  }

  const openAgentDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentDialog(true)
  }

  const getStatusColor = (status: string) => {
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
      case "requested":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const changeAdminPassword = async () => {
    if (!admin) return
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      alert("New passwords do not match")
      return
    }
    if (adminPasswordForm.newPassword.length < 6) {
      alert("New password must be at least 6 characters long")
      return
    }
    try {
      const { data: currentAdmin } = await supabase
        .from("admin_users")
        .select("password_hash")
        .eq("id", admin.id)
        .single()
      if (!currentAdmin || currentAdmin.password_hash !== adminPasswordForm.currentPassword) {
        alert("Current password is incorrect")
        return
      }
      const { error } = await supabase
        .from("admin_users")
        .update({ password_hash: adminPasswordForm.newPassword })
        .eq("id", admin.id)
      if (error) throw error
      alert("Password changed successfully")
      setShowAdminPasswordDialog(false)
      setAdminPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      alert("Failed to change password")
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("services").delete().eq("id", serviceId)
      if (error) throw error
      alert("Service deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting service:", error)
      alert("Failed to delete service.")
    }
  }

  const deleteBundle = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this data bundle? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("data_bundles").delete().eq("id", bundleId)
      if (error) throw error
      alert("Data bundle deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting data bundle:", error)
      alert("Failed to delete data bundle.")
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this data order? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("data_orders").delete().eq("id", orderId)
      if (error) throw error
      alert("Data order deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting data order:", error)
      alert("Failed to delete data order.")
    }
  }

  const deleteReferral = async (referralId: string) => {
    if (!confirm("Are you sure you want to delete this referral? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("referrals").delete().eq("id", referralId)
      if (error) throw error
      alert("Referral deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting referral:", error)
      alert("Failed to delete referral.")
    }
  }

  const deleteWithdrawal = async (withdrawalId: string) => {
    if (!confirm("Are you sure you want to delete this withdrawal? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("withdrawals").delete().eq("id", withdrawalId)
      if (error) throw error
      alert("Withdrawal deleted successfully!")
      loadData()
    } catch (error) {
      console.error("Error deleting withdrawal:", error)
      alert("Failed to delete withdrawal.")
    }
  }

  const clearData = async () => {
    if (
      !confirm(
        `Are you sure you want to clear selected data from ${clearDataType === "day" ? "today" : "this month"}? This action cannot be undone.`,
      )
    ) {
      return
    }
    try {
      const now = new Date()
      let cutoffDate: Date
      if (clearDataType === "day") {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      const promises = []
      const clearedTypes = []
      if (clearDataOptions.dataOrders) {
        promises.push(
          supabase.from("data_orders").delete().neq("status", "pending").lt("created_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("data orders")
      }
      if (clearDataOptions.referrals) {
        promises.push(
          supabase.from("referrals").delete().neq("status", "pending").lt("created_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("referrals")
      }
      if (clearDataOptions.withdrawals) {
        promises.push(
          supabase
            .from("withdrawals")
            .delete()
            .in("status", ["paid", "rejected"])
            .lt("requested_at", cutoffDate.toISOString()),
        )
        clearedTypes.push("withdrawals")
      }
      if (promises.length === 0) {
        alert("Please select at least one data type to clear.")
        return
      }
      const results = await Promise.all(promises)
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        console.error("Errors during clear data:", errors)
        throw new Error("Some data could not be cleared")
      }
      const totalCleared = results.reduce((sum, result) => sum + (result.count || 0), 0)
      alert(
        `Successfully cleared ${totalCleared} records (${clearedTypes.join(", ")}) from ${
          clearDataType === "day" ? "today" : "this month"
        }`,
      )
      setShowClearDialog(false)
      loadData()
    } catch (error) {
      console.error("Error clearing data:", error)
      alert("Failed to clear data. Please check your selection and try again.")
    }
  }

  const updateWalletTransactionStatus = async (transactionId: string, status: string, adminNotes?: string) => {
    try {
      console.log(`Updating wallet transaction ${transactionId} to status: ${status}`)

      const { data: transactionData, error: transactionError } = await supabase
        .from("wallet_transactions")
        .select("*, agents (wallet_balance)")
        .eq("id", transactionId)
        .single()

      if (transactionError) throw transactionError

      const updateData: any = {
        status,
        admin_id: admin?.id,
        admin_notes: adminNotes || null,
      }

      const currentTimestamp = new Date().toISOString()

      if (status === "approved") {
        updateData.approved_at = currentTimestamp

        if (transactionData.transaction_type === "topup") {
          const currentBalance = transactionData.agents?.wallet_balance || 0
          const newBalance = currentBalance + transactionData.amount

          const { error: balanceError } = await supabase
            .from("agents")
            .update({ wallet_balance: newBalance })
            .eq("id", transactionData.agent_id)

          if (balanceError) throw balanceError
        }
      } else if (status === "rejected") {
        updateData.rejected_at = currentTimestamp
      }

      const { error: updateError } = await supabase
        .from("wallet_transactions")
        .update(updateData)
        .eq("id", transactionId)

      if (updateError) throw updateError

      const statusMessages = {
        approved: "approved and wallet balance updated",
        rejected: "rejected",
        pending: "marked as pending",
      }

      alert(`Wallet transaction ${statusMessages[status as keyof typeof statusMessages] || "updated"} successfully`)
      loadData()
    } catch (error) {
      console.error("Error updating wallet transaction:", error)
      alert("Failed to update wallet transaction. Please try again.")
    }
  }

  const handleSendMessage = async () => {
    if (!selectedOrder || !adminMessage.trim()) return

    try {
      const { error } = await supabase
        .from("data_orders")
        .update({ admin_message: adminMessage.trim() })
        .eq("id", selectedOrder.id)

      if (error) throw error

      alert("Message sent successfully!")
      setShowMessageDialog(false)
      setAdminMessage("")
      setSelectedOrder(null)
      loadData()
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const openMessageDialog = (order: DataOrder) => {
    setSelectedOrder(order)
    setAdminMessage(order.admin_message || "")
    setShowMessageDialog(true)
  }

  const totalAgents = agents.length
  const approvedAgents = agents.filter((a) => a.isapproved).length
  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter((r) => r.status === "completed").length
  const totalDataOrders = dataOrders.length
  const completedDataOrders = dataOrders.filter((o) => o.status === "completed").length
  const totalWithdrawals = withdrawals.length
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "requested").length
  const totalJobs = jobs.length
  const activeJobs = jobs.filter((j) => j.is_active).length

  const downloadDataOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No data to download")
      return
    }

    const headers = [
      "Date",
      "Agent",
      "Bundle Name",
      "Provider",
      "Size (GB)",
      "Price (GH₵)",
      "Recipient Phone",
      "Payment Method",
      "Payment Reference",
      "Commission (GH₵)",
      "Status",
      "Commission Paid",
    ]

    const csvData = filteredOrders.map((order) => [
      new Date(order.created_at).toLocaleDateString(),
      order.agents?.full_name || "",
      order.data_bundles?.name || "",
      order.data_bundles?.provider || "",
      order.data_bundles?.size_gb || "",
      order.data_bundles?.price?.toFixed(2) || "",
      order.recipient_phone || "",
      order.payment_method === "wallet" ? "Wallet" : "Manual",
      order.payment_reference || "",
      order.commission_amount?.toFixed(2) || "",
      order.status || "",
      order.commission_paid ? "Yes" : "No",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `admin-data-orders-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading admin dashboard...</p>
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
                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">DataFlex Admin Portal</h1>
                <p className="text-emerald-100 font-medium">Welcome back, {admin?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAdminPasswordDialog(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
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
          <UnreadNotification
            unreadCount={adminUnreadCount}
            userType="admin"
            onDismiss={() => setShowNotification(false)}
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAgents}</div>
              <p className="text-xs text-blue-100 mt-1">{approvedAgents} approved</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalReferrals}</div>
              <p className="text-xs text-purple-100 mt-1">{completedReferrals} completed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Data Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDataOrders}</div>
              <p className="text-xs text-emerald-100 mt-1">{completedDataOrders} completed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalWithdrawals}</div>
              <p className="text-xs text-orange-100 mt-1">{pendingWithdrawals} pending</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Jobs Posted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalJobs}</div>
              <p className="text-xs text-indigo-100 mt-1">{activeJobs} active</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="agents" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-full justify-between bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
              <TabsTrigger
                value="agents"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Database className="h-4 w-4 mr-2" />
                Data
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap relative flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Referrals
                {adminUnreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 rounded-full flex items-center justify-center p-0 animate-pulse">
                    {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="payouts"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Banknote className="h-4 w-4 mr-2" />
                Payouts
              </TabsTrigger>
              <TabsTrigger
                value="wallets"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Wallets
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg whitespace-nowrap flex-1"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Jobs
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="agents" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-emerald-800">Agent Management</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                      className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <Select value={agentsFilterAdmin} onValueChange={setAgentsFilterAdmin}>
                    <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Agents">All Agents</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowClearDialog(true)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Clear Data
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {getPaginatedData(filteredAgents, currentAgentsPage).map((agent) => (
                <Card
                  key={agent.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-800 text-lg">{agent.full_name}</h3>
                          <Badge
                            className={
                              agent.isapproved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {agent.isapproved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-emerald-600">
                            <span className="font-medium">Phone:</span> {agent.phone_number}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">MoMo:</span> {agent.momo_number}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">Region:</span> {agent.region}
                          </p>
                          <p className="text-emerald-500 text-xs">
                            <span className="font-medium">Joined:</span> {formatTimestamp(agent.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-emerald-100">
                        {!agent.isapproved && (
                          <Button
                            size="sm"
                            onClick={() => approveAgent(agent.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        {agent.isapproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => banAgent(agent.id)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 flex-1 sm:flex-none"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAgentDialog(agent)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAgent(agent.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              currentPage={currentAgentsPage}
              totalPages={getTotalPages(filteredAgents.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentAgentsPage)}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Service Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex gap-2">
                  <Select value={servicesFilterAdmin} onValueChange={setServicesFilterAdmin}>
                    <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Services" />
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
                    className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <Button
                  onClick={() => setShowServiceDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPaginatedData(filteredServicesAdmin, currentServicesPage).map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm"
                >
                  <CardHeader>
                    {service.image_url && (
                      <div className="w-full h-56 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden">
                        <img
                          src={service.image_url || "/placeholder.svg?height=224&width=400"}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg text-emerald-800">{service.title}</CardTitle>
                    <CardDescription className="text-emerald-600">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {service.product_cost && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-600">Product Cost:</span>
                          <span className="text-sm font-semibold text-emerald-800">
                            GH₵ {service.product_cost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-emerald-600">Commission:</span>
                        <span className="text-lg font-bold text-green-600">
                          GH₵ {service.commission_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editService(service)}
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteService(service.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              currentPage={currentServicesPage}
              totalPages={getTotalPages(filteredServicesAdmin.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentServicesPage)}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Data Bundle Management</h2>
              <Button
                onClick={() => setShowBundleDialog(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bundle
              </Button>
            </div>
            <Tabs defaultValue="MTN" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
                {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                  const logoMap = {
                    MTN: "/images/mtn-logo.jpg",
                    AirtelTigo: "/images/airteltigo-logo.jpg",
                    Telecel: "/images/telecel-logo.jpg",
                  }
                  const bundleCount = dataBundles.filter((bundle) => bundle.provider === provider).length
                  return (
                    <TabsTrigger
                      key={provider}
                      value={provider}
                      className="text-xs lg:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 lg:p-3 flex items-center justify-center gap-2"
                    >
                      <img
                        src={logoMap[provider as keyof typeof logoMap] || "/placeholder.svg"}
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
                const providerBundles = dataBundles.filter((bundle) => bundle.provider === provider)
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
                            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No data bundles available for {provider}</p>
                            <p className="text-sm">Click "Add Bundle" to create one</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <BundleGrid
                        provider={provider}
                        bundles={providerBundles}
                        editBundle={editBundle}
                        loadData={loadData}
                      />
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Data Order Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <Select value={ordersFilterAdmin} onValueChange={setOrdersFilterAdmin}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Orders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Orders">All Orders</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={downloadDataOrdersCSV}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {getPaginatedData(filteredOrders, currentOrdersPage).map((order) => (
                <Card
                  key={order.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-800">{order.data_bundles?.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <Badge
                              variant="outline"
                              className={
                                order.payment_method === "wallet"
                                  ? "border-purple-200 text-purple-700 bg-purple-50"
                                  : "border-blue-200 text-blue-700 bg-blue-50"
                              }
                            >
                              {order.payment_method === "wallet" ? (
                                <Wallet className="h-3 w-3 mr-1" />
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              {order.payment_method === "wallet" ? "Wallet" : "Manual"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-emerald-600">
                            <span className="font-medium">Agent:</span> {order.agents?.full_name}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">To:</span> {order.recipient_phone}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">Payment:</span> {order.payment_reference}
                          </p>
                          <p className="text-emerald-500 text-xs">
                            <span className="font-medium">Ordered:</span> {formatTimestamp(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-sm font-semibold text-emerald-700">
                              GH₵ {order.data_bundles?.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-emerald-600">
                              Commission: GH₵ {order.commission_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                        <Select value={order.status} onValueChange={(value) => updateDataOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMessageDialog(order)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {order.admin_message ? "Edit Message" : "Send Message"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteOrder(order.id)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              currentPage={currentOrdersPage}
              totalPages={getTotalPages(filteredOrders.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentOrdersPage)}
            />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4" id="referrals">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Referral Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={referralsFilterAdmin} onValueChange={setReferralsFilterAdmin}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Referrals" />
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
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search referrals..."
                    value={referralSearchTerm}
                    onChange={(e) => setReferralSearchTerm(e.target.value)}
                    className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-800">{referral.services?.title}</h3>
                          <Badge className={getStatusColor(referral.status)}>{referral.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-emerald-600">
                            <span className="font-medium">Agent:</span> {referral.agents?.full_name}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">Client:</span> {referral.client_name} •{" "}
                            {referral.client_phone}
                          </p>
                          <p className="text-emerald-600">{referral.description}</p>
                        </div>
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
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-sm font-semibold text-emerald-700">
                            Commission: GH₵ {referral.services?.commission_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-500">Submitted: {formatTimestamp(referral.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 relative w-full sm:w-auto bg-transparent"
                        >
                          <Link href={`/admin/chat/${referral.id}`} onClick={() => adminMarkAsRead(referral.id)}>
                            <div className="relative flex items-center">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                              {adminGetUnreadCount(referral.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse font-bold">
                                  {adminGetUnreadCount(referral.id) > 9 ? "9+" : adminGetUnreadCount(referral.id)}
                                </span>
                              )}
                            </div>
                          </Link>
                        </Button>
                        <Select
                          value={referral.status}
                          onValueChange={(value) => updateReferralStatus(referral.id, value)}
                        >
                          <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReferral(referral.id)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getPaginatedData(filteredReferrals, currentReferralsPage).length === 0 && (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <p className="text-emerald-600">
                      {referralsFilterAdmin === "All Referrals"
                        ? "No referrals found."
                        : `No ${referralsFilterAdmin.toLowerCase()} referrals found.`}
                    </p>
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

          <TabsContent value="payouts" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Withdrawal Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={payoutsFilterAdmin} onValueChange={setPayoutsFilterAdmin}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Payouts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Payouts">All Payouts</SelectItem>
                    <SelectItem value="Requested">Requested</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {withdrawals.length} total
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {pendingWithdrawals} pending
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-gray-500 mb-4">
                      <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No withdrawal requests found</p>
                      <p className="text-sm">Withdrawal requests will appear here when agents submit them</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                getPaginatedData(
                  withdrawals.filter(
                    (withdrawal) =>
                      payoutsFilterAdmin === "All Payouts" || withdrawal.status === payoutsFilterAdmin.toLowerCase(),
                  ),
                  currentPayoutsPage,
                ).map((withdrawal) => (
                  <Card
                    key={withdrawal.id}
                    className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-emerald-800 text-lg">
                              GH₵ {withdrawal.amount.toLocaleString()}
                            </h3>
                            <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <p className="text-emerald-600">
                              <span className="font-medium">Agent:</span> {withdrawal.agents?.full_name}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Phone:</span> {withdrawal.agents?.phone_number}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">MoMo:</span> {withdrawal.momo_number}
                            </p>
                            <p className="text-emerald-500 text-xs">
                              <span className="font-medium">Requested:</span> {formatTimestamp(withdrawal.requested_at)}
                            </p>
                          </div>
                          {withdrawal.paid_at && (
                            <p className="text-emerald-500 text-xs">
                              <span className="font-medium">Paid:</span> {formatTimestamp(withdrawal.paid_at)}
                            </p>
                          )}
                          {withdrawal.commission_items && withdrawal.commission_items.length > 0 && (
                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                              <p className="text-xs font-medium text-emerald-700 mb-1">Commission Sources:</p>
                              <div className="text-xs text-emerald-600">
                                {withdrawal.commission_items.map((item: any, index: number) => (
                                  <span key={index}>
                                    {item.type === "referral" ? "Referral" : "Data Order"}
                                    {index < withdrawal.commission_items.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                          <Select
                            value={withdrawal.status}
                            onValueChange={(value) => updateWithdrawalStatus(withdrawal.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="requested">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  Requested
                                </div>
                              </SelectItem>
                              <SelectItem value="processing">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  Processing
                                </div>
                              </SelectItem>
                              <SelectItem value="paid">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Paid
                                </div>
                              </SelectItem>
                              <SelectItem value="rejected">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Rejected
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteWithdrawal(withdrawal.id)}
                            className="w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={currentPayoutsPage}
              totalPages={getTotalPages(
                withdrawals.filter(
                  (withdrawal) =>
                    payoutsFilterAdmin === "All Payouts" || withdrawal.status === payoutsFilterAdmin.toLowerCase(),
                ).length,
              )}
              onPageChange={(page) => handlePageChange(page, setCurrentPayoutsPage)}
            />
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Wallet Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={walletFilterAdmin} onValueChange={setWalletFilterAdmin}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Transactions">All Transactions</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Top-ups">Top-ups Only</SelectItem>
                    <SelectItem value="Deductions">Deductions Only</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={walletSearchTerm}
                    onChange={(e) => setWalletSearchTerm(e.target.value)}
                    className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {walletTransactions.length} total
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {walletTransactions.filter((t) => t.status === "pending").length} pending
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {filteredWalletTransactions.length === 0 ? (
                <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-gray-500 mb-4">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No wallet transactions found</p>
                      <p className="text-sm">
                        Wallet transactions will appear here when agents make top-ups or purchases
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                getPaginatedData(filteredWalletTransactions, currentWalletsPage).map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-emerald-800 text-lg flex items-center gap-2">
                              {transaction.transaction_type === "topup" ? (
                                <Plus className="h-5 w-5 text-green-600" />
                              ) : transaction.transaction_type === "deduction" ? (
                                <TrendingUp className="h-5 w-5 text-blue-600 rotate-180" />
                              ) : (
                                <RefreshCw className="h-5 w-5 text-purple-600" />
                              )}
                              {transaction.transaction_type === "topup"
                                ? "Wallet Top-up"
                                : transaction.transaction_type === "deduction"
                                  ? "Bundle Purchase"
                                  : "Refund"}
                            </h3>
                            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <p className="text-emerald-600">
                              <span className="font-medium">Agent:</span> {transaction.agents?.full_name}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Phone:</span> {transaction.agents?.phone_number}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Amount:</span>
                              <span
                                className={`font-bold ml-1 ${
                                  transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.transaction_type === "topup" || transaction.transaction_type === "refund"
                                  ? "+"
                                  : "-"}
                                GH₵ {transaction.amount.toFixed(2)}
                              </span>
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Current Balance:</span> GH₵{" "}
                              {(transaction.agents?.wallet_balance || 0).toFixed(2)}
                            </p>
                            <p className="text-emerald-600">
                              <span className="font-medium">Reference:</span> {transaction.reference_code}
                            </p>
                            <p className="text-emerald-500 text-xs">
                              <span className="font-medium">Created:</span> {formatTimestamp(transaction.created_at)}
                            </p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <p className="text-sm text-emerald-700">{transaction.description}</p>
                            {transaction.admin_notes && (
                              <p className="text-xs text-emerald-600 mt-1">
                                <span className="font-medium">Admin Notes:</span> {transaction.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>
                        {transaction.status === "pending" && transaction.transaction_type === "topup" && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                            <Button
                              size="sm"
                              onClick={() => updateWalletTransactionStatus(transaction.id, "approved")}
                              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve Top-up
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const notes = prompt("Reason for rejection (optional):")
                                updateWalletTransactionStatus(transaction.id, "rejected", notes || undefined)
                              }}
                              className="w-full sm:w-auto"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <PaginationControls
              currentPage={currentWalletsPage}
              totalPages={getTotalPages(filteredWalletTransactions.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentWalletsPage)}
            />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-emerald-800">Job Board Management</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Select value={jobsFilterAdmin} onValueChange={setJobsFilterAdmin}>
                  <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Jobs">All Jobs</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={jobSearchTerm}
                    onChange={(e) => setJobSearchTerm(e.target.value)}
                    className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <Button
                  onClick={() => setShowJobDialog(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {getPaginatedData(filteredJobs, currentJobsPage).map((job) => (
                <Card
                  key={job.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-800 text-lg">{job.job_title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={job.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                              {job.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {job.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-emerald-600">
                            <span className="font-medium">Employer:</span> {job.employer_name}
                          </p>
                          <p className="text-emerald-600">
                            <span className="font-medium">Industry:</span> {job.industry}
                          </p>
                          <p className="text-emerald-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </p>
                          <p className="text-emerald-600 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-sm text-emerald-700 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">
                              {job.salary_type === "negotiable"
                                ? "Negotiable"
                                : job.salary_type === "exact_amount"
                                  ? `${job.salary_currency} ${job.salary_exact?.toLocaleString()}`
                                  : `${job.salary_currency} ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.application_method === "email" ? (
                              <Mail className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <LinkIcon className="h-4 w-4 text-emerald-600" />
                            )}
                            <span className="text-xs text-emerald-600">{job.application_contact}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editJob(job)}
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleJobStatus(job.id, job.is_active)}
                          className={`w-full sm:w-auto ${
                            job.is_active
                              ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {job.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleJobFeatured(job.id, job.is_featured)}
                          className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 w-full sm:w-auto"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {job.is_featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteJob(job.id)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              currentPage={currentJobsPage}
              totalPages={getTotalPages(filteredJobs.length)}
              onPageChange={(page) => handlePageChange(page, setCurrentJobsPage)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Dialog for Data Orders */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedOrder?.admin_message ? "Edit Message" : "Send Message to Agent"}
            </DialogTitle>
            <UIDialogDescription className="text-emerald-600">
              {selectedOrder?.admin_message
                ? "Update the message for this data order."
                : "Send a message to the agent about this data order."}
            </UIDialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Order Details:</p>
                <p className="text-sm text-emerald-700">
                  {selectedOrder.data_bundles?.name} - {selectedOrder.agents?.full_name}
                </p>
                <p className="text-xs text-emerald-600">To: {selectedOrder.recipient_phone}</p>
              </div>
            )}
            <div>
              <Label htmlFor="adminMessage" className="text-emerald-700">
                Message
              </Label>
              <Textarea
                id="adminMessage"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Type your message to the agent..."
                className="border-emerald-200 focus:border-emerald-500 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSendMessage}
              disabled={!adminMessage.trim()}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <Send className="h-4 w-4 mr-2" />
              {selectedOrder?.admin_message ? "Update Message" : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <UIDialogDescription className="text-emerald-600">
              {editingService ? "Update the service details below." : "Fill in the details for the new service."}
            </UIDialogDescription>
          </DialogHeader>
          <form onSubmit={createOrUpdateService} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-emerald-700">
                Title
              </Label>
              <Input
                id="title"
                value={serviceForm.title}
                onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-emerald-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500 min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="commission_amount" className="text-emerald-700">
                Commission Amount (GH₵)
              </Label>
              <Input
                id="commission_amount"
                type="number"
                step="0.01"
                value={serviceForm.commission_amount}
                onChange={(e) => setServiceForm({ ...serviceForm, commission_amount: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="product_cost" className="text-emerald-700">
                Product Cost (GH₵) - Optional
              </Label>
              <Input
                id="product_cost"
                type="number"
                step="0.01"
                value={serviceForm.product_cost}
                onChange={(e) => setServiceForm({ ...serviceForm, product_cost: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="materials_link" className="text-emerald-700">
                Materials Link - Optional
              </Label>
              <Input
                id="materials_link"
                type="url"
                value={serviceForm.materials_link}
                onChange={(e) => setServiceForm({ ...serviceForm, materials_link: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="image_url" className="text-emerald-700">
                Image URL - Optional
              </Label>
              <Input
                id="image_url"
                type="url"
                value={serviceForm.image_url}
                onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bundle Dialog */}
      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">
              {editingBundle ? "Edit Data Bundle" : "Add New Data Bundle"}
            </DialogTitle>
            <UIDialogDescription className="text-emerald-600">
              {editingBundle ? "Update the data bundle details below." : "Fill in the details for the new data bundle."}
            </UIDialogDescription>
          </DialogHeader>
          <form onSubmit={createOrUpdateBundle} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-emerald-700">
                Bundle Name
              </Label>
              <Input
                id="name"
                value={bundleForm.name}
                onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="provider" className="text-emerald-700">
                Provider
              </Label>
              <Select
                value={bundleForm.provider}
                onValueChange={(value) => setBundleForm({ ...bundleForm, provider: value })}
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  <SelectItem value="Telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size_gb" className="text-emerald-700">
                Size (GB)
              </Label>
              <Input
                id="size_gb"
                type="number"
                value={bundleForm.size_gb}
                onChange={(e) => setBundleForm({ ...bundleForm, size_gb: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-emerald-700">
                Price (GH₵)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={bundleForm.price}
                onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="commission_rate" className="text-emerald-700">
                Commission Rate (0.01 = 1%)
              </Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.001"
                value={bundleForm.commission_rate}
                onChange={(e) => setBundleForm({ ...bundleForm, commission_rate: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="validity_months" className="text-emerald-700">
                Validity (Months)
              </Label>
              <Input
                id="validity_months"
                type="number"
                value={bundleForm.validity_months}
                onChange={(e) => setBundleForm({ ...bundleForm, validity_months: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="image_url" className="text-emerald-700">
                Image URL - Optional
              </Label>
              <Input
                id="image_url"
                type="url"
                value={bundleForm.image_url}
                onChange={(e) => setBundleForm({ ...bundleForm, image_url: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {editingBundle ? "Update Bundle" : "Create Bundle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
            <UIDialogDescription className="text-emerald-600">
              {editingJob ? "Update the job details below." : "Fill in the details for the new job posting."}
            </UIDialogDescription>
          </DialogHeader>
          <form onSubmit={createOrUpdateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title" className="text-emerald-700">
                  Job Title
                </Label>
                <Input
                  id="job_title"
                  value={jobForm.job_title}
                  onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="employer_name" className="text-emerald-700">
                  Employer Name
                </Label>
                <Input
                  id="employer_name"
                  value={jobForm.employer_name}
                  onChange={(e) => setJobForm({ ...jobForm, employer_name: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry" className="text-emerald-700">
                  Industry
                </Label>
                <Select value={jobForm.industry} onValueChange={(value) => setJobForm({ ...jobForm, industry: value })}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location" className="text-emerald-700">
                  Location
                </Label>
                <Input
                  id="location"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-emerald-700">
                Job Description
              </Label>
              <Textarea
                id="description"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                required
                className="border-emerald-200 focus:border-emerald-500 min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="application_deadline" className="text-emerald-700">
                  Application Deadline
                </Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={jobForm.application_deadline}
                  onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="salary_type" className="text-emerald-700">
                  Salary Type
                </Label>
                <Select
                  value={jobForm.salary_type}
                  onValueChange={(value: any) => setJobForm({ ...jobForm, salary_type: value })}
                >
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                    <SelectItem value="fixed_range">Fixed Range</SelectItem>
                    <SelectItem value="exact_amount">Exact Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {jobForm.salary_type === "fixed_range" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_min" className="text-emerald-700">
                    Minimum Salary
                  </Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={jobForm.salary_min}
                    onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max" className="text-emerald-700">
                    Maximum Salary
                  </Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={jobForm.salary_max}
                    onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
            {jobForm.salary_type === "exact_amount" && (
              <div>
                <Label htmlFor="salary_exact" className="text-emerald-700">
                  Salary Amount
                </Label>
                <Input
                  id="salary_exact"
                  type="number"
                  value={jobForm.salary_exact}
                  onChange={(e) => setJobForm({ ...jobForm, salary_exact: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="application_method" className="text-emerald-700">
                  Application Method
                </Label>
                <Select
                  value={jobForm.application_method}
                  onValueChange={(value: any) => setJobForm({ ...jobForm, application_method: value })}
                >
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="hyperlink">Website/Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="application_contact" className="text-emerald-700">
                  {jobForm.application_method === "email" ? "Email Address" : "Application Link"}
                </Label>
                <Input
                  id="application_contact"
                  type={jobForm.application_method === "email" ? "email" : "url"}
                  value={jobForm.application_contact}
                  onChange={(e) => setJobForm({ ...jobForm, application_contact: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={jobForm.is_featured}
                onChange={(e) => setJobForm({ ...jobForm, is_featured: e.target.checked })}
                className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="is_featured" className="text-emerald-700">
                Feature this job (appears at top of listings)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {editingJob ? "Update Job" : "Create Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Reset Agent Password</DialogTitle>
            <UIDialogDescription className="text-emerald-600">
              Enter a new password for {selectedAgent?.full_name}
            </UIDialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-emerald-700">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={agentPasswordReset}
                onChange={(e) => setAgentPasswordReset(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={resetAgentPassword}
              disabled={!agentPasswordReset}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Password Dialog */}
      <Dialog open={showAdminPasswordDialog} onOpenChange={setShowAdminPasswordDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Change Admin Password</DialogTitle>
            <UIDialogDescription className="text-emerald-600">Update your admin account password</UIDialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-emerald-700">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={adminPasswordForm.currentPassword}
                onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-emerald-700">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={adminPasswordForm.newPassword}
                onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-emerald-700">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={adminPasswordForm.confirmPassword}
                onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={changeAdminPassword}
              disabled={
                !adminPasswordForm.currentPassword ||
                !adminPasswordForm.newPassword ||
                !adminPasswordForm.confirmPassword
              }
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clear Data
            </DialogTitle>
            <UIDialogDescription className="text-red-600">
              This action will permanently delete selected data. This cannot be undone.
            </UIDialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-red-700 font-medium">Time Period</Label>
              <Select value={clearDataType} onValueChange={(value: "day" | "month") => setClearDataType(value)}>
                <SelectTrigger className="border-red-200 focus:border-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today Only</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-red-700 font-medium">Data Types to Clear</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="clearDataOrders"
                    checked={clearDataOptions.dataOrders}
                    onChange={(e) => setClearDataOptions({ ...clearDataOptions, dataOrders: e.target.checked })}
                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <Label htmlFor="clearDataOrders" className="text-red-700">
                    Data Orders (non-pending)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="clearReferrals"
                    checked={clearDataOptions.referrals}
                    onChange={(e) => setClearDataOptions({ ...clearDataOptions, referrals: e.target.checked })}
                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <Label htmlFor="clearReferrals" className="text-red-700">
                    Referrals (non-pending)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="clearWithdrawals"
                    checked={clearDataOptions.withdrawals}
                    onChange={(e) => setClearDataOptions({ ...clearDataOptions, withdrawals: e.target.checked })}
                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <Label htmlFor="clearWithdrawals" className="text-red-700">
                    Withdrawals (paid/rejected)
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={clearData}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={!clearDataOptions.dataOrders && !clearDataOptions.referrals && !clearDataOptions.withdrawals}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Clear Selected Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BackToTop />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  )
}
