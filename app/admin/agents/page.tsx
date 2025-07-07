"use client"

import { useState, useEffect } from "react"
import { AdminAuthGuard } from "@/components/admin-auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Search, ArrowLeft, Eye, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    const filtered = agents.filter(
      (agent) =>
        agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone_number.includes(searchTerm) ||
        agent.region.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredAgents(filtered)
  }, [agents, searchTerm])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast.error("Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  const toggleAgentApproval = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("agents").update({ isapproved: !currentStatus }).eq("id", agentId)

      if (error) throw error

      setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, isapproved: !currentStatus } : agent)))

      toast.success(`Agent ${!currentStatus ? "approved" : "suspended"} successfully`)
    } catch (error) {
      console.error("Error updating agent:", error)
      toast.error("Failed to update agent status")
    }
  }

  if (loading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading agents...</p>
          </div>
        </div>
      </AdminAuthGuard>
    )
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Agents</h1>
                <p className="text-gray-600">View and manage all registered agents</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Agents</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {agents.filter((agent) => agent.isapproved).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {agents.filter((agent) => !agent.isapproved).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, phone, or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Agents Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Agents</CardTitle>
              <CardDescription>
                Showing {filteredAgents.length} of {agents.length} agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>MoMo Number</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Wallet Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No agents found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAgents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">{agent.full_name}</TableCell>
                          <TableCell>{agent.phone_number}</TableCell>
                          <TableCell>{agent.momo_number}</TableCell>
                          <TableCell>{agent.region}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              GH₵ {(agent.wallet_balance || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={agent.isapproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {agent.isapproved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(agent.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant={agent.isapproved ? "destructive" : "default"}
                                onClick={() => toggleAgentApproval(agent.id, agent.isapproved)}
                              >
                                {agent.isapproved ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/agents/${agent.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminAuthGuard>
  )
}
