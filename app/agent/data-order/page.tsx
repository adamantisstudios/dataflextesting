"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  supabase,
  generatePaymentReference,
  calculateDataBundleCommission,
  type Agent,
  type DataBundle,
} from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import {
  ArrowLeft,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Phone,
  Wallet,
  CreditCard,
  Plus,
  ArrowDown,
  ShoppingCart,
  RefreshCw,
} from "lucide-react"

export default function DataOrderPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "wallet">("manual")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [generatedReference, setGeneratedReference] = useState("")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // Ref for payment section
  const paymentSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    loadData(currentAgent.id)

    // Set up real-time wallet balance updates
    setupWalletBalanceListener(currentAgent.id)
  }, [router])

  const setupWalletBalanceListener = (agentId: string) => {
    // Listen for changes to the agent's wallet balance
    const channel = supabase
      .channel("wallet-balance-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agents",
          filter: `id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Wallet balance updated:", payload)
          if (payload.new && payload.new.wallet_balance !== undefined) {
            setWalletBalance(payload.new.wallet_balance)
          }
        },
      )
      .subscribe()

    // Listen for wallet transactions that might affect balance
    const transactionChannel = supabase
      .channel("wallet-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("Wallet transaction updated:", payload)
          // Refresh wallet balance when transactions are updated
          refreshWalletBalance(agentId)
        },
      )
      .subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(transactionChannel)
    }
  }

  const refreshWalletBalance = async (agentId: string) => {
    try {
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("wallet_balance")
        .eq("id", agentId)
        .single()

      if (agentError) throw agentError
      setWalletBalance(agentData?.wallet_balance || 0)
    } catch (error) {
      console.error("Error refreshing wallet balance:", error)
    }
  }

  const loadData = async (agentId: string) => {
    try {
      setLoading(true)

      // Load data bundles
      const { data: bundlesData, error: bundlesError } = await supabase
        .from("data_bundles")
        .select("*")
        .eq("is_active", true)
        .order("provider", { ascending: true })
        .order("size_gb", { ascending: true })

      if (bundlesError) throw bundlesError

      // Load agent's wallet balance
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("wallet_balance")
        .eq("id", agentId)
        .single()

      if (agentError) throw agentError

      setDataBundles(bundlesData || [])
      setWalletBalance(agentData?.wallet_balance || 0)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load data bundles")
    } finally {
      setLoading(false)
    }
  }

  const handleBundleSelect = (bundleId: string) => {
    const bundle = dataBundles.find((b) => b.id === bundleId)
    setSelectedBundle(bundle || null)
    setError("")

    // Smooth scroll to payment section with a slight delay
    setTimeout(() => {
      if (paymentSectionRef.current) {
        paymentSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Add a subtle highlight effect
        paymentSectionRef.current.classList.add("animate-pulse")
        setTimeout(() => {
          paymentSectionRef.current?.classList.remove("animate-pulse")
        }, 2000)
      }
    }, 100)
  }

  const validateOrder = () => {
    if (!selectedBundle) {
      setError("Please select a data bundle")
      return false
    }

    if (!recipientPhone.trim()) {
      setError("Please enter recipient phone number")
      return false
    }

    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(recipientPhone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit phone number")
      return false
    }

    if (paymentMethod === "wallet" && walletBalance < selectedBundle.price) {
      setError(
        `Insufficient wallet balance. You need GH₵ ${selectedBundle.price.toFixed(2)} but have GH₵ ${walletBalance.toFixed(2)}`,
      )
      return false
    }

    return true
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent || !selectedBundle) return

    if (!validateOrder()) return

    setError("")
    setSuccess("")

    const commission = calculateDataBundleCommission(selectedBundle.price, selectedBundle.commission_rate)
    const reference = generatePaymentReference()

    const orderData = {
      agent_id: agent.id,
      bundle_id: selectedBundle.id,
      recipient_phone: recipientPhone.trim(),
      payment_reference: reference,
      commission_amount: commission,
      payment_method: paymentMethod,
      status: paymentMethod === "wallet" ? "processing" : "pending",
    }

    setOrderDetails(orderData)
    setGeneratedReference(reference)
    setShowConfirmDialog(true)
  }

  const confirmOrder = async () => {
    if (!orderDetails || !agent || !selectedBundle) return

    setSubmitting(true)
    try {
      // If paying with wallet, check balance again and deduct
      if (paymentMethod === "wallet") {
        // Check current wallet balance
        const { data: currentAgent, error: balanceError } = await supabase
          .from("agents")
          .select("wallet_balance")
          .eq("id", agent.id)
          .single()

        if (balanceError) throw balanceError

        if ((currentAgent?.wallet_balance || 0) < selectedBundle.price) {
          throw new Error("Insufficient wallet balance. Please top up your wallet.")
        }

        // Deduct from wallet balance
        const newBalance = (currentAgent?.wallet_balance || 0) - selectedBundle.price
        const { error: updateError } = await supabase
          .from("agents")
          .update({ wallet_balance: newBalance })
          .eq("id", agent.id)

        if (updateError) throw updateError

        // Create wallet transaction record
        await supabase.from("wallet_transactions").insert([
          {
            agent_id: agent.id,
            transaction_type: "deduction",
            amount: selectedBundle.price,
            reference_code: generatedReference,
            description: `Data bundle purchase: ${selectedBundle.name} for ${orderDetails.recipient_phone}`,
            status: "approved",
            payment_method: "auto",
          },
        ])

        setWalletBalance(newBalance)
      }

      // Create the data order
      const { error: orderError } = await supabase.from("data_orders").insert([orderDetails])

      if (orderError) throw orderError

      setSuccess(
        paymentMethod === "wallet"
          ? `Order placed successfully! GH₵ ${selectedBundle.price.toFixed(2)} has been deducted from your wallet. Your order is being processed.`
          : `Order placed successfully! Please send GH₵ ${selectedBundle.price.toFixed(2)} to 0551999901 using reference: ${generatedReference}`,
      )

      // Reset form
      setSelectedBundle(null)
      setRecipientPhone("")
      setPaymentMethod("manual")
      setShowConfirmDialog(false)
    } catch (error: any) {
      console.error("Error placing order:", error)
      setError(error.message || "Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefreshBalance = async () => {
    if (!agent) return
    setRefreshing(true)
    await refreshWalletBalance(agent.id)
    setRefreshing(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const groupedBundles = dataBundles.reduce(
    (acc, bundle) => {
      if (!acc[bundle.provider]) {
        acc[bundle.provider] = []
      }
      acc[bundle.provider].push(bundle)
      return acc
    },
    {} as Record<string, DataBundle[]>,
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data bundles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header - Mobile Responsive */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/agent/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Order Data Bundle</h1>
                <p className="text-sm sm:text-base text-gray-600">Purchase data bundles for your clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card - Mobile Responsive */}
        <Card className="mb-6 border-emerald-100 shadow-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Wallet Balance</p>
                  <p className="text-2xl font-bold">GH₵ {walletBalance.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefreshBalance}
                  variant="secondary"
                  size="sm"
                  disabled={refreshing}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Link href="/agent/wallet">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up Wallet
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Main Content - Full Width Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Bundle Selection with Network Tabs */}
          <Card className="border-emerald-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Select Data Bundle
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Choose from available data bundles by network
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="MTN" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
                  {["MTN", "AirtelTigo", "Telecel"].map((provider) => {
                    const bundleCount = dataBundles.filter((bundle) => bundle.provider === provider).length
                    return (
                      <TabsTrigger
                        key={provider}
                        value={provider}
                        className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-2 sm:p-3 flex items-center justify-center gap-2"
                      >
                        <img
                          src={
                            provider === "MTN"
                              ? "/images/mtn.jpg"
                              : provider === "AirtelTigo"
                                ? "/images/airteltigo.jpg"
                                : "/images/telecel.jpg"
                          }
                          alt={`${provider} logo`}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded object-cover"
                        />
                        <div className="flex flex-col items-center">
                          <span className="hidden sm:inline">{provider}</span>
                          <span className="sm:hidden text-xs">{provider.slice(0, 3)}</span>
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
                        <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200">
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
                          <span className="hidden sm:inline">{provider} Data Bundles</span>
                          <span className="sm:hidden">{provider}</span>
                        </h3>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {providerBundles.length} bundles
                        </Badge>
                      </div>

                      {providerBundles.length === 0 ? (
                        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                          <CardContent className="pt-6 text-center">
                            <div className="text-gray-500 mb-4">
                              <Smartphone className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 opacity-50" />
                              <p>No data bundles available for {provider}</p>
                              <p className="text-sm">Please check back later</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {providerBundles.map((bundle) => (
                            <div
                              key={bundle.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                                selectedBundle?.id === bundle.id
                                  ? "border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]"
                                  : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
                              }`}
                              onClick={() => handleBundleSelect(bundle.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{bundle.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {bundle.size_gb}GB • {bundle.validity_months} months
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600">GH₵ {bundle.price.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">
                                    Commission: GH₵{" "}
                                    {calculateDataBundleCommission(bundle.price, bundle.commission_rate).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {selectedBundle?.id === bundle.id && (
                                <div className="mt-3 flex items-center justify-center text-emerald-600">
                                  <ArrowDown className="h-4 w-4 animate-bounce" />
                                  <span className="text-sm ml-2">Scroll down to complete your order</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Order Form - Full Width Mobile Responsive */}
          <Card
            ref={paymentSectionRef}
            className={`border-emerald-100 shadow-lg transition-all duration-500 ${
              selectedBundle ? "ring-2 ring-emerald-200 ring-opacity-50" : ""
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Details
              </CardTitle>
              <CardDescription className="text-emerald-600">Enter recipient details and payment method</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="recipientPhone" className="text-gray-700 font-medium">
                    Recipient Phone Number *
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g., 0241234567"
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the phone number to receive the data bundle</p>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-3 block">Payment Method *</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: "manual" | "wallet") => setPaymentMethod(value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="manual" id="manual" />
                        <div className="flex items-center gap-2 flex-1">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                          <Label htmlFor="manual" className="font-medium cursor-pointer">
                            Manual Payment
                          </Label>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Pay after order
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <div className="flex items-center gap-2 flex-1">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          <Label htmlFor="wallet" className="font-medium cursor-pointer">
                            Pay with Wallet
                          </Label>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${walletBalance >= (selectedBundle?.price || 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          GH₵ {walletBalance.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "wallet" && selectedBundle && walletBalance < selectedBundle.price && (
                    <Alert className="mt-3 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        Insufficient wallet balance. You need GH₵ {selectedBundle.price.toFixed(2)} but have GH₵{" "}
                        {walletBalance.toFixed(2)}.{" "}
                        <Link href="/agent/wallet" className="underline font-medium">
                          Top up your wallet
                        </Link>{" "}
                        or choose manual payment.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {selectedBundle && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 animate-in slide-in-from-top duration-300">
                    <h4 className="font-semibold text-emerald-800 mb-2">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Bundle:</span>
                        <span className="font-medium text-emerald-900">{selectedBundle.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Size:</span>
                        <span className="font-medium text-emerald-900">{selectedBundle.size_gb}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Price:</span>
                        <span className="font-bold text-emerald-900">GH₵ {selectedBundle.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Your Commission:</span>
                        <span className="font-bold text-green-600">
                          GH₵{" "}
                          {calculateDataBundleCommission(selectedBundle.price, selectedBundle.commission_rate).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200">
                        <span className="text-emerald-700">Payment Method:</span>
                        <span className="font-medium text-emerald-900 capitalize">
                          {paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment"}
                        </span>
                      </div>
                      {paymentMethod === "wallet" && (
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Remaining Balance:</span>
                          <span className="font-medium text-emerald-900">
                            GH₵ {Math.max(0, walletBalance - selectedBundle.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !selectedBundle ||
                    !recipientPhone.trim() ||
                    (paymentMethod === "wallet" && walletBalance < (selectedBundle?.price || 0))
                  }
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg py-3 text-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  Place Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile Responsive */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/agent/data-orders">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent w-full sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
          </Link>
          <Link href="/agent/wallet">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Manage Wallet
            </Button>
          </Link>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-emerald-800">Confirm Your Order</AlertDialogTitle>
              <AlertDialogDescription>Please review your order details before confirming.</AlertDialogDescription>
            </AlertDialogHeader>
            {selectedBundle && (
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Bundle:</span>
                      <span className="font-medium text-emerald-900">{selectedBundle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Recipient:</span>
                      <span className="font-medium text-emerald-900">{recipientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Amount:</span>
                      <span className="font-bold text-emerald-900">GH₵ {selectedBundle.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Payment:</span>
                      <span className="font-medium text-emerald-900">
                        {paymentMethod === "wallet" ? "Wallet Balance" : "Manual Payment"}
                      </span>
                    </div>
                    {paymentMethod === "wallet" && (
                      <div className="flex justify-between">
                        <span className="text-emerald-700">New Balance:</span>
                        <span className="font-medium text-emerald-900">
                          GH₵ {Math.max(0, walletBalance - selectedBundle.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {paymentMethod === "manual" && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Payment Instructions:</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Send GH₵ {selectedBundle.price.toFixed(2)} to <strong>0551999901</strong> (Adamantis Solutions)
                      </p>
                      <p className="text-sm text-blue-700">
                        Reference: <strong>{generatedReference}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      GH₵ {selectedBundle.price.toFixed(2)} will be deducted from your wallet balance immediately.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmOrder}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
