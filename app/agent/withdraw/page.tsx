"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase, type Agent, type Referral, type DataOrder } from "@/lib/supabase"
import { ArrowLeft, Banknote, Clock, CheckCircle, Trash2, RefreshCw, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"

export default function WithdrawPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [dataOrders, setDataOrders] = useState<DataOrder[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [amount, setAmount] = useState("")
  const [momoNumber, setMomoNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [monthlyWithdrawals, setMonthlyWithdrawals] = useState(0)
  const router = useRouter()

  const MIN_WITHDRAWAL_AMOUNT = 10
  const MAX_MONTHLY_WITHDRAWALS = 5

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (!agentData) {
      router.push("/agent/login")
      return
    }

    const parsedAgent = JSON.parse(agentData)
    setAgent(parsedAgent)
    setMomoNumber(parsedAgent.momo_number)
    loadEarnings(parsedAgent.id)
  }, [router])

  const loadEarnings = async (agentId: string) => {
    try {
      console.log("Loading earnings for agent:", agentId)

      // Load completed referrals with unpaid commissions
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          *,
          services (title, commission_amount)
        `)
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .eq("commission_paid", false)

      if (referralsError) {
        console.error("Error loading referrals:", referralsError)
      } else {
        console.log("Loaded referrals:", referralsData)
      }

      // Load completed data orders with unpaid commissions
      const { data: dataOrdersData, error: dataOrdersError } = await supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles (name, provider, size_gb, price)
        `)
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .eq("commission_paid", false)

      if (dataOrdersError) {
        console.error("Error loading data orders:", dataOrdersError)
      } else {
        console.log("Loaded data orders:", dataOrdersData)
      }

      // Load withdrawal history
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("requested_at", { ascending: false })

      if (withdrawalsError) {
        console.error("Error loading withdrawals:", withdrawalsError)
      }

      // Calculate monthly withdrawals (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyCount = (withdrawalsData || []).filter((w) => {
        const withdrawalDate = new Date(w.requested_at)
        return withdrawalDate.getMonth() === currentMonth && withdrawalDate.getFullYear() === currentYear
      }).length

      setReferrals(referralsData || [])
      setDataOrders(dataOrdersData || [])
      setWithdrawals(withdrawalsData || [])
      setMonthlyWithdrawals(monthlyCount)
    } catch (error) {
      console.error("Error loading earnings:", error)
    }
  }

  const handleRefreshData = async () => {
    if (!agent) return
    setRefreshing(true)

    try {
      // First, let's check and fix any commission_paid NULL values
      await supabase
        .from("referrals")
        .update({ commission_paid: false })
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .is("commission_paid", null)

      await supabase
        .from("data_orders")
        .update({ commission_paid: false })
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .is("commission_paid", null)

      // Then reload the data
      await loadEarnings(agent.id)

      alert("Data refreshed! Any completed commissions should now be available for withdrawal.")
    } catch (error) {
      console.error("Error refreshing data:", error)
      alert("Failed to refresh data. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  const referralEarnings = referrals.reduce((sum, r) => sum + (r.services?.commission_amount || 0), 0)
  const dataOrderEarnings = dataOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)
  const totalAvailable = referralEarnings + dataOrderEarnings

  const canWithdraw = () => {
    const withdrawAmount = Number.parseFloat(amount)
    return (
      withdrawAmount >= MIN_WITHDRAWAL_AMOUNT &&
      withdrawAmount <= totalAvailable &&
      monthlyWithdrawals < MAX_MONTHLY_WITHDRAWALS
    )
  }

  const getWithdrawalError = () => {
    const withdrawAmount = Number.parseFloat(amount)

    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return `Minimum withdrawal amount is GH₵ ${MIN_WITHDRAWAL_AMOUNT}`
    }

    if (withdrawAmount > totalAvailable) {
      return "Amount exceeds available balance"
    }

    if (monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS) {
      return `You have reached the monthly limit of ${MAX_MONTHLY_WITHDRAWALS} withdrawals`
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return

    const withdrawAmount = Number.parseFloat(amount)

    if (!canWithdraw()) {
      alert(getWithdrawalError() || "Invalid withdrawal request")
      return
    }

    setLoading(true)

    try {
      // Collect IDs of items being withdrawn
      const commissionItems = [
        ...referrals.map((r) => ({ type: "referral", id: r.id, amount: r.services?.commission_amount || 0 })),
        ...dataOrders.map((o) => ({ type: "data_order", id: o.id, amount: o.commission_amount || 0 })),
      ]

      const { error } = await supabase.from("withdrawals").insert([
        {
          agent_id: agent.id,
          amount: withdrawAmount,
          momo_number: momoNumber,
          status: "requested",
          commission_items: commissionItems,
        },
      ])

      if (error) throw error

      alert(
        "Withdrawal request submitted successfully! All completed referrals and data orders have been included. Processing time: approximately 3 hours.",
      )
      router.push("/agent/dashboard")
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      alert("Failed to submit withdrawal request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearWithdrawalHistory = async () => {
    if (!agent) return
    setClearing(true)

    try {
      const { error } = await supabase.from("withdrawals").delete().eq("agent_id", agent.id)

      if (error) throw error

      alert("Withdrawal history cleared successfully!")
      loadEarnings(agent.id)
    } catch (error) {
      console.error("Error clearing withdrawal history:", error)
      alert("Failed to clear withdrawal history. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  const handleClearPaidCommissions = async () => {
    if (!agent) return
    setClearing(true)

    try {
      // Clear paid referral commissions
      const { error: referralError } = await supabase
        .from("referrals")
        .delete()
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .eq("commission_paid", true)

      if (referralError) throw referralError

      // Clear paid data order commissions
      const { error: dataOrderError } = await supabase
        .from("data_orders")
        .delete()
        .eq("agent_id", agent.id)
        .eq("status", "completed")
        .eq("commission_paid", true)

      if (dataOrderError) throw dataOrderError

      alert("Paid commission records cleared successfully!")
      loadEarnings(agent.id)
    } catch (error) {
      console.error("Error clearing paid commissions:", error)
      alert("Failed to clear paid commission records. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getWithdrawalStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "requested":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (totalAvailable <= 0 && withdrawals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:inline ml-1">Back to Dashboard</span>
                  <span className="xs:hidden ml-1">Back</span>
                </Link>
              </Button>
            </div>

            <Card className="w-full">
              <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
                <Banknote className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold mb-2">No Available Balance</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You don't have any unpaid commissions available for withdrawal.
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  If you have completed referrals that should be available for withdrawal, try refreshing your data.
                </p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={handleRefreshData} disabled={refreshing} size="sm" className="w-full sm:w-auto">
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Refreshing..." : "Refresh Data"}
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                      <Link href="/agent/dashboard">Back to Dashboard</Link>
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={clearing}
                          className="w-full sm:w-auto bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Paid Records
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">
                            Clear Paid Commission Records
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This will permanently delete all completed referrals and data orders that have been marked
                            as paid. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearPaidCommissions} className="w-full sm:w-auto">
                            Clear Records
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden xs:inline ml-1">Back to Dashboard</span>
                <span className="xs:hidden ml-1">Back</span>
              </Link>
            </Button>
          </div>

          {/* Stats Cards - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="w-full">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">GH₵ {totalAvailable.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Ready for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Withdrawals</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {monthlyWithdrawals}/{MAX_MONTHLY_WITHDRAWALS}
                </div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="w-full sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-gray-600">Minimum Amount</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">GH₵ {MIN_WITHDRAWAL_AMOUNT}</div>
                <p className="text-xs text-gray-500 mt-1">Per withdrawal</p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Restrictions Notice */}
          <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">💳 Withdrawal Guidelines</p>
                <ul className="text-xs sm:text-sm list-disc list-inside ml-2 space-y-1">
                  <li>
                    Minimum withdrawal amount: <strong>GH₵ {MIN_WITHDRAWAL_AMOUNT}</strong>
                  </li>
                  <li>
                    Maximum <strong>{MAX_MONTHLY_WITHDRAWALS} withdrawals per month</strong>
                  </li>
                  <li>
                    Processing time: <strong>Approximately 3 hours</strong>
                  </li>
                  <li>All completed commissions will be included in your withdrawal</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-red-800">
                <p className="font-semibold text-sm sm:text-base">Monthly Withdrawal Limit Reached</p>
                <p className="text-xs sm:text-sm">
                  You have reached the maximum of {MAX_MONTHLY_WITHDRAWALS} withdrawals for this month. Please wait
                  until next month to make additional withdrawal requests.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content - Mobile First Layout */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Withdrawal Form */}
            <div className="w-full space-y-4 sm:space-y-6">
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl">Request Withdrawal</CardTitle>
                  <CardDescription className="text-sm">
                    Withdraw your available commission earnings to your mobile money account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="w-full">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount (GH₵)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={MIN_WITHDRAWAL_AMOUNT}
                        max={totalAvailable}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min: ${MIN_WITHDRAWAL_AMOUNT}, Max: ${totalAvailable.toFixed(2)}`}
                        disabled={monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS}
                        className="w-full mt-1"
                      />
                      {amount && getWithdrawalError() && (
                        <p className="text-xs sm:text-sm text-red-600 mt-1">{getWithdrawalError()}</p>
                      )}
                    </div>

                    <div className="w-full">
                      <Label htmlFor="momo_number" className="text-sm font-medium">
                        Mobile Money Number
                      </Label>
                      <Input
                        id="momo_number"
                        type="tel"
                        required
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="+233123456789"
                        disabled={monthlyWithdrawals >= MAX_MONTHLY_WITHDRAWALS}
                        className="w-full mt-1"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !canWithdraw()} size="default">
                      {loading ? "Processing..." : "Request Withdrawal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Available Earnings Breakdown */}
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Available Earnings</CardTitle>
                      <CardDescription className="text-sm">Breakdown of your unpaid commissions</CardDescription>
                    </div>
                    <Button
                      onClick={handleRefreshData}
                      size="sm"
                      variant="outline"
                      disabled={refreshing}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-sm sm:text-base">Referral Commissions</span>
                      <span className="font-bold text-green-600 text-sm sm:text-base">
                        GH₵ {referralEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-sm sm:text-base">Data Order Commissions</span>
                      <span className="font-bold text-blue-600 text-sm sm:text-base">
                        GH₵ {dataOrderEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                      <span className="font-bold text-sm sm:text-base">Total Available</span>
                      <span className="font-bold text-base sm:text-lg">GH₵ {totalAvailable.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal History */}
            <div className="w-full space-y-4 sm:space-y-6">
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Withdrawal History</CardTitle>
                      <CardDescription className="text-sm">
                        Your recent withdrawal requests and their status
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={clearing}
                          className="w-full sm:w-auto bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Clear Withdrawal History</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This will permanently delete all your withdrawal records. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearWithdrawalHistory} className="w-full sm:w-auto">
                            Clear History
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm sm:text-base">No withdrawal history yet</p>
                      <p className="text-xs sm:text-sm text-gray-500">Your withdrawal requests will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {getWithdrawalStatusIcon(withdrawal.status)}
                            <div>
                              <p className="font-medium text-sm sm:text-base">GH₵ {withdrawal.amount.toFixed(2)}</p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {formatTimestamp(withdrawal.requested_at)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              withdrawal.status === "paid"
                                ? "default"
                                : withdrawal.status === "requested"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={`text-xs ${
                              withdrawal.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : withdrawal.status === "requested"
                                  ? "bg-orange-100 text-orange-800"
                                  : ""
                            }`}
                          >
                            {withdrawal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clear Paid Records */}
              <Card className="w-full">
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl">Data Management</CardTitle>
                  <CardDescription className="text-sm">Clean up your commission records</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-transparent" disabled={clearing}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Paid Commission Records
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">
                          Clear Paid Commission Records
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          This will permanently delete all completed referrals and data orders that have been marked as
                          paid. This helps keep your dashboard clean but cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearPaidCommissions} className="w-full sm:w-auto">
                          Clear Records
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
