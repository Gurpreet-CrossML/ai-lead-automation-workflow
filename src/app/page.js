"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// --- New Imports ---
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RefreshCcw, Mail, Eye, Reply, Calendar, Clock, AlertCircle, Users, 
  BarChart3, Send, MessageSquare, CheckCircle, XCircle, Search 
} from "lucide-react"
import { useState, useEffect, useMemo } from "react" // Added useMemo
import Link from "next/link"

// --- Constants (Moved Outside Component) ---
// Defines all status types, their labels, icons, and colors
const STATUS_CONFIG = {
  'new': { 
    label: 'New Lead', 
    icon: Users, 
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' 
  },
  'email_sent': { 
    label: 'Initial Email Sent', 
    icon: Send, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
  },
  'pending_reply': { 
    label: 'Awaiting Reply (24h)', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
  },
  'replied': { 
    label: 'Client Replied', 
    icon: MessageSquare, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
  },
  'follow_up_sent': { 
    label: 'Follow-up Sent', // Label is simplified; count is added in the component
    icon: Reply, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
  },
  'no_response': { 
    label: 'No Response (Closed)', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
  },
  'meeting_scheduled': { 
    label: 'Meeting Scheduled', 
    icon: Calendar, 
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
  }
}

// --- Helper Component (Moved Outside Component) ---
// A reusable component for displaying the status badge
function LeadStatusBadge({ status = 'new', followUpCount = 0 }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['new']
  const Icon = config.icon
  
  // Dynamically create the label for follow-ups
  let label = config.label
  if (status === 'follow_up_sent' && followUpCount > 0) {
    label = `Follow-up ${followUpCount} Sent`
  }
  
  return (
    <Badge className={`${config.color} inline-flex items-center gap-1.5 font-semibold px-3 py-1.5 border-0 whitespace-nowrap`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  )
}

// --- Utility Function (Moved Outside Component) ---
// Formats an ISO date string into a readable format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// --- Main Dashboard Component ---

export default function LeadDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // --- New State for Filtering ---
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchLeads = async () => {
    try {
      setLoading(true) // Set loading true at the start of fetch
      setError(null)
      const response = await fetch('/api/leads')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads')
      }
      
      // Normalize incoming lead data
      const normalized = data.map((lead) => ({
        ...lead,
        zoominfo_contact_id: lead.zoominfo_contact_id ? String(lead.zoominfo_contact_id) : null,
        follow_up_count: lead.follow_up_count != null ? Number(lead.follow_up_count) : 0,
        status: lead.status || 'new',
        last_email_sent_at: lead.last_email_sent_at || null,
        last_replied_at: lead.last_replied_at || null,
        next_follow_up_at: lead.next_follow_up_at || null,
        meeting_scheduled_at: lead.meeting_scheduled_at || null,
        created_at: lead.created_at || null,
        updated_at: lead.updated_at || null
      }))

      setLeads(normalized)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setError(error.message)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLeads()
    setIsRefreshing(false)
  }

  // --- Performance Improvement: Memoized Stats ---
  // This costly calculation now only runs when `leads` data changes.
  const stats = useMemo(() => {
    // Use `reduce` for a single-pass calculation (more efficient than N filters)
    const statusCounts = leads.reduce((acc, lead) => {
      const status = lead.status || 'new'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return [
      { label: "Total Leads", value: leads.length, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50", darkBg: "dark:bg-blue-950" },
      { label: "New Leads", value: statusCounts['new'] || 0, icon: Users, color: "text-slate-600", bgColor: "bg-slate-50", darkBg: "dark:bg-slate-950" },
      { label: "Emails Sent", value: statusCounts['email_sent'] || 0, icon: Send, color: "text-blue-600", bgColor: "bg-blue-50", darkBg: "dark:bg-blue-950" },
      { label: "Pending Reply", value: statusCounts['pending_reply'] || 0, icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50", darkBg: "dark:bg-yellow-950" },
      { label: "Replied", value: statusCounts['replied'] || 0, icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-50", darkBg: "dark:bg-green-950" },
      { label: "Follow-ups", value: statusCounts['follow_up_sent'] || 0, icon: Reply, color: "text-purple-600", bgColor: "bg-purple-50", darkBg: "dark:bg-purple-950" },
      { label: "Meetings", value: statusCounts['meeting_scheduled'] || 0, icon: Calendar, color: "text-emerald-600", bgColor: "bg-emerald-50", darkBg: "dark:bg-emerald-950" },
      { label: "No Response", value: statusCounts['no_response'] || 0, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50", darkBg: "dark:bg-red-950" },
    ]
  }, [leads])

  // --- Performance Improvement: Memoized Filtering ---
  // This filters the list for the table, only re-running when dependencies change.
  const filteredLeads = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase()
    
    return leads.filter((lead) => {
      // Status Filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false
      }
      
      // Search Term Filter
      if (searchTerm) {
        const fullName = [lead.first_name, lead.middle_name, lead.last_name].filter(Boolean).join(' ').toLowerCase()
        const email = (lead.email || '').toLowerCase()
        const company = (lead.company_name || '').toLowerCase()

        if (
          !fullName.includes(lowerCaseSearch) &&
          !email.includes(lowerCaseSearch) &&
          !company.includes(lowerCaseSearch)
        ) {
          return false
        }
      }
      
      return true
    })
  }, [leads, searchTerm, statusFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 p-6 md:p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Lead Management Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              Automated email workflow with intelligent follow-up system
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {stats.map((item) => (
            <Card 
              key={item.label} 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-neutral-800"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${item.bgColor} ${item.darkBg} opacity-40 rounded-bl-full`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </CardTitle>
                <div className={`${item.bgColor} ${item.darkBg} p-2 rounded-lg shadow-sm`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Details Table */}
        <Card className="border-0 shadow-xl bg-white dark:bg-neutral-800 mt-8">
          <CardHeader className="border-b border-gray-200 dark:border-neutral-700 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Left Side: Title */}
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Lead Activity Tracker</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Search, filter, and track all leads in the pipeline.
                </p>
              </div>
              {/* Right Side: Filters */}
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search name, email, company..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, { label, icon: Icon }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Lead Info</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Company</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Follow-ups</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Last Activity</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">Loading leads...</p>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7">
                          <div className="p-16 text-center">
                            <AlertCircle className="h-20 w-20 mx-auto text-red-500 mb-6" />
                            <p className="text-red-500 text-lg font-semibold mb-2">
                              Error Loading Leads
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                              {error}
                            </p>
                            <Button 
                              onClick={handleRefresh}
                              className="bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-base"
                            >
                              Try Again
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      // Case 1: No leads in the database at all
                      <tr>
                        <td colSpan="7">
                          <div className="p-16 text-center">
                            <BarChart3 className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">
                              No leads in your pipeline yet
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                              Upload your first batch of leads to start the automated workflow
                            </p>
                            <Link href="/lead-upload">
                              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all px-8 py-6 text-base">
                                Upload Leads Now
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLeads.length === 0 ? (
                      // Case 2: Leads exist, but none match the filter
                      <tr>
                        <td colSpan="7">
                           <div className="p-16 text-center">
                            <Search className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">
                              No Leads Found
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                              No leads match your current search and filter criteria.
                            </p>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                              }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Main Case: Render the filtered leads
                      filteredLeads.map((lead) => (
                        <tr key={lead.zoominfo_contact_id || lead.email} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {[lead.first_name, lead.middle_name, lead.last_name].filter(Boolean).join(' ')}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {lead.job_title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {lead.company_name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {lead.city}, {lead.state}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col gap-1">
                              {lead.email && (
                                <a 
                                  href={`mailto:${lead.email}`}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 group"
                                >
                                  <Mail className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600" /> 
                                  <span className="truncate max-w-[200px]">{lead.email}</span>
                                </a>
                              )}
                              {lead.direct_phone && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  📞
                                  <span>{lead.direct_phone}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <LeadStatusBadge 
                              status={lead.status} 
                              followUpCount={lead.follow_up_count}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {lead.follow_up_count || 0}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                of 3
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs gap-1">
                              {/* Show the *most recent* activity first */}
                              {lead.meeting_scheduled_at ? (
                                <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Meeting: {formatDate(lead.meeting_scheduled_at)}
                                </span>
                              ) : lead.last_replied_at ? (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                  <Reply className="h-3.5 w-3.5" />
                                  Replied: {formatDate(lead.last_replied_at)}
                                </span>
                              ) : lead.next_follow_up_at ? (
                                <span className="text-yellow-700 dark:text-yellow-300 flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  Next: {formatDate(lead.next_follow_up_at)}
                                </span>
                              ) : lead.last_email_sent_at ? (
                                <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <Send className="h-3.5 w-3.5" />
                                  Sent: {formatDate(lead.last_email_sent_at)}
                                </span>
                              ) : (
                                <span className="text-gray-400">No activity yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {/* New Actions Column */}
                            <Link href={`/leads/${lead.zoominfo_contact_id}`}>
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}