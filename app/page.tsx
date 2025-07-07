"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase, type Service, type DataBundle, type Job } from "@/lib/supabase"
import {
  PLATFORM_CONFIG,
  getJoiningFeeFormatted,
  getPlatformName,
  getSupportPhone,
  getSupportEmail,
} from "@/lib/config"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { BackToTop } from "@/components/back-to-top"
import {
  Users,
  TrendingUp,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Smartphone,
  Banknote,
  Globe,
  Award,
  MessageCircle,
  Phone,
  Mail,
  Menu,
  X,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [servicesData, bundlesData, jobsData] = await Promise.all([
        supabase.from("services").select("*").order("created_at", { ascending: false }),
        supabase.from("data_bundles").select("*").order("provider", { ascending: true }),
        supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
      ])

      setServices(servicesData.data || [])
      setDataBundles(bundlesData.data || [])
      setJobs(jobsData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const testimonials = [
    {
      name: "Ama Mensah",
      role: "Senior Agent - Accra",
      image: "/images/user1-placeholder.jpg",
      content:
        "DataFlex has transformed my business! I earn consistent income selling data bundles and the commission structure is very fair. The platform is easy to use and payments are always on time.",
      rating: 5,
      earnings: "GH₵ 2,500/month",
    },
    {
      name: "Kwame Asante",
      role: "Regional Agent - Kumasi",
      image: "/images/user2-placeholder.jpg",
      content:
        "Being a DataFlex agent has given me financial independence. The support team is excellent and I love how I can track all my sales and commissions in real-time.",
      rating: 5,
      earnings: "GH₵ 3,200/month",
    },
    {
      name: "John Osei",
      role: "Community Agent - Tamale",
      image: "/images/user4-placeholder.jpg",
      content:
        "I started as a part-time agent and now this is my main source of income. The referral system works great and my customers are always satisfied with the service quality.",
      rating: 5,
      earnings: "GH₵ 1,800/month",
    },
  ]

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-emerald-600" />,
      title: "All Networks Supported",
      description:
        "Sell data bundles for MTN, AirtelTigo, and Telecel networks with competitive rates and instant delivery.",
    },
    {
      icon: <Banknote className="h-8 w-8 text-emerald-600" />,
      title: "Attractive Commissions",
      description: "Earn up to 15% commission on every data bundle sale with transparent pricing and instant payouts.",
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-600" />,
      title: "Secure Platform",
      description: "Your transactions and earnings are protected with bank-level security and encrypted data storage.",
    },
    {
      icon: <Clock className="h-8 w-8 text-emerald-600" />,
      title: "24/7 Support",
      description: "Get help anytime with our dedicated support team available round the clock via WhatsApp and phone.",
    },
    {
      icon: <Globe className="h-8 w-8 text-emerald-600" />,
      title: "Nationwide Coverage",
      description: "Serve customers across all regions of Ghana with reliable network coverage and fast data delivery.",
    },
    {
      icon: <Award className="h-8 w-8 text-emerald-600" />,
      title: "Agent Recognition",
      description:
        "Top performing agents receive bonuses, recognition awards, and exclusive promotional opportunities.",
    },
  ]

  const stats = [
    { label: "Active Agents", value: "2,500+", icon: <Users className="h-6 w-6" /> },
    { label: "Data Bundles Sold", value: "50,000+", icon: <Smartphone className="h-6 w-6" /> },
    { label: "Total Commissions Paid", value: "GH₵ 500K+", icon: <Banknote className="h-6 w-6" /> },
    { label: "Customer Satisfaction", value: "98%", icon: <Star className="h-6 w-6" /> },
  ]

  const providers = [
    {
      name: "MTN",
      logo: "/images/mtn.jpg",
      description: "Ghana's largest network with nationwide coverage",
      bundles: dataBundles.filter((bundle) => bundle.provider === "MTN").slice(0, 3),
    },
    {
      name: "AirtelTigo",
      logo: "/images/airteltigo.jpg",
      description: "Reliable network with competitive data rates",
      bundles: dataBundles.filter((bundle) => bundle.provider === "AirtelTigo").slice(0, 3),
    },
    {
      name: "Telecel",
      logo: "/images/telecel.jpg",
      description: "Growing network with excellent customer service",
      bundles: dataBundles.filter((bundle) => bundle.provider === "Telecel").slice(0, 3),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 border-2 border-emerald-200">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {getPlatformName()}
                </h1>
                <p className="text-xs text-gray-600">{PLATFORM_CONFIG.platform.tagline}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Features
              </a>
              <a href="#services" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Services
              </a>
              <a href="#bundles" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Data Bundles
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Testimonials
              </a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Contact
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                asChild
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                <Link href="/agent/login">Agent Login</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
              >
                <Link href="/agent/register">Join as Agent</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-emerald-100 bg-white">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Features
                </a>
                <a
                  href="#services"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Services
                </a>
                <a
                  href="#bundles"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Data Bundles
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Testimonials
                </a>
                <a
                  href="#contact"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Contact
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-emerald-100">
                  <Button
                    variant="outline"
                    asChild
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                  >
                    <Link href="/agent/login">Agent Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <Link href="/agent/register">Join as Agent</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-green-600/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2">
                  🇬🇭 Ghana's #1 Data Reselling Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Earn Money
                  </span>
                  <br />
                  Selling Data Bundles
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Join Ghana's most trusted data reselling network. Sell MTN, AirtelTigo, and Telecel data bundles with
                  attractive commissions and instant payouts.
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-800 font-semibold">
                    🎯 One-time joining fee: <span className="text-2xl font-bold">{getJoiningFeeFormatted()}</span>
                  </p>
                  <p className="text-emerald-600 text-sm mt-1">Start earning immediately after approval!</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="/agent/register">
                    Start Earning Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6 bg-transparent"
                >
                  <Link href="/agent/login">Agent Dashboard</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2 text-emerald-600">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-100">
                <img
                  src="/images/hero-main.jpg"
                  alt="DataFlex Agents - Empowering Ghanaians"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Monthly Earnings</div>
                    <div className="text-lg font-bold text-emerald-600">Up to GH₵ 5,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Why Choose DataFlex</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-emerald-600">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide all the tools, support, and opportunities you need to build a successful data reselling
              business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Our Services</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Expand Your <span className="text-emerald-600">Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Beyond data bundles, offer additional services to your customers and earn even more commissions
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-emerald-100">
                  <CardHeader>
                    <div className="w-full h-56 bg-gray-200 rounded-lg animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services
                .filter((s) => s.service_type !== "data_bundle")
                .slice(0, 7)
                .map((service) => (
                  <Card
                    key={service.id}
                    className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  >
                    {service.image_url && (
                      <div className="w-full h-56 overflow-hidden">
                        <img
                          src={service.image_url || "/placeholder.svg?height=224&width=400"}
                          alt={service.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription className="text-gray-600">{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Commission</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            GH₵ {service.commission_amount.toLocaleString()}
                          </p>
                        </div>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                          <Link href="/agent/register">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Data Bundles Section */}
      <section id="bundles" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Data Bundles</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              All Networks <span className="text-emerald-600">Available</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sell data bundles for all major networks in Ghana with competitive rates and instant delivery
            </p>
          </div>

          <Tabs defaultValue="MTN" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-emerald-50 border border-emerald-200">
              <TabsTrigger
                value="MTN"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
              >
                <img src="/images/mtn.jpg" alt="MTN logo" className="w-5 h-5 rounded object-cover" />
                <span className="hidden sm:inline">MTN</span>
              </TabsTrigger>
              <TabsTrigger
                value="AirtelTigo"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
              >
                <img src="/images/airteltigo.jpg" alt="AirtelTigo logo" className="w-5 h-5 rounded object-cover" />
                <span className="hidden sm:inline">AirtelTigo</span>
              </TabsTrigger>
              <TabsTrigger
                value="Telecel"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
              >
                <img src="/images/telecel.jpg" alt="Telecel logo" className="w-5 h-5 rounded object-cover" />
                <span className="hidden sm:inline">Telecel</span>
              </TabsTrigger>
            </TabsList>

            {providers.map((provider) => (
              <TabsContent key={provider.name} value={provider.name} className="space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden border border-emerald-200">
                    <img
                      src={provider.logo || "/placeholder.svg"}
                      alt={`${provider.name} Logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{provider.name}</h3>
                  <p className="text-gray-600">{provider.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {provider.bundles.map((bundle) => (
                    <Card
                      key={bundle.id}
                      className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg"
                    >
                      <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Smartphone className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">{bundle.size_gb}GB</CardTitle>
                        <CardDescription>{provider.name} Data Bundle</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div>
                          <p className="text-3xl font-bold text-emerald-600">GH₵ {bundle.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Valid for {bundle.validity_months} months</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <p className="text-sm text-gray-600">Your Commission</p>
                          <p className="text-lg font-bold text-emerald-600">
                            GH₵ {(bundle.price * bundle.commission_rate).toFixed(2)}
                          </p>
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                          <Link href="/agent/register">Start Selling</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {provider.bundles.length === 0 && (
                  <div className="text-center py-12">
                    <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">More {provider.name} bundles coming soon!</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Latest Opportunities</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Find Your Next <span className="text-emerald-600">Career</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover authentic, verified job opportunities from trusted companies, homeowners, and businesses across
              Ghana
            </p>
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg max-w-4xl mx-auto">
              <p className="text-sm text-emerald-700">
                <strong>Disclaimer:</strong> All job postings are screened for authenticity. We prioritize verified,
                credible jobs from trusted companies, homeowners, and businesses that comply with Ghana's labor laws and
                employee rights.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-emerald-100">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.slice(0, 5).map((job) => (
                  <Card
                    key={job.id}
                    className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-emerald-800 mb-2">{job.job_title}</CardTitle>
                          <CardDescription className="text-emerald-600 flex items-center gap-1 mb-1">
                            <Building2 className="h-4 w-4" />
                            {job.employer_name}
                          </CardDescription>
                          <CardDescription className="text-emerald-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </CardDescription>
                        </div>
                        {job.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-600">{job.industry}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-600">
                            Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-600">
                            {job.salary_type === "negotiable" && "Negotiable"}
                            {job.salary_type === "exact_amount" &&
                              `${job.salary_currency} ${job.salary_exact?.toLocaleString()}`}
                            {job.salary_type === "fixed_range" &&
                              `${job.salary_currency} ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <div
                          className="text-sm text-emerald-700 line-clamp-3"
                          dangerouslySetInnerHTML={{
                            __html: job.description
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/• (.*?)(?=\n|$)/g, "• $1")
                              .split("\n")
                              .slice(0, 3)
                              .join("<br>"),
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No job opportunities are available at the moment. Please check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">What Our Agents Say</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Success <span className="text-emerald-600">Stories</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our successful agents who are earning consistent income through our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-emerald-200">
                      <AvatarImage src={testimonial.image || "/placeholder.svg"} alt={testimonial.name} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Earnings</span>
                      <span className="font-bold text-emerald-600">{testimonial.earnings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-xl opacity-90">
              Join thousands of successful agents earning consistent income through our platform. Start your data
              reselling business today!
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-lg mb-2">💰 One-time joining fee</p>
              <p className="text-4xl font-bold mb-2">{getJoiningFeeFormatted()}</p>
              <p className="text-emerald-100">Start earning immediately after approval!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <Link href="/agent/register">
                  Become an Agent
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-6 bg-transparent"
              >
                <Link href="/agent/login">Agent Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Get in Touch</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Need Help? <span className="text-emerald-600">We're Here</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our support team is available 24/7 to help you succeed. Reach out anytime!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Phone Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Call us anytime for immediate assistance</p>
                <p className="font-semibold text-emerald-600">{getSupportPhone()}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Quick support via WhatsApp</p>
                <p className="font-semibold text-emerald-600">{getSupportPhone()}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Send us your questions anytime</p>
                <p className="font-semibold text-emerald-600">{getSupportEmail()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
      <BackToTop />
    </div>
  )
}
