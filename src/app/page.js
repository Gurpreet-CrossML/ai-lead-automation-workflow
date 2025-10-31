"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RefreshCcw, Mail, Eye, Reply, Calendar, Clock, AlertCircle, Users, 
  BarChart3, Send, MessageSquare, CheckCircle, XCircle, Search, 
  TrendingUp, Filter, Download
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"

// --- Helper function to format status ---
const formatStatusLabel = (status) => {
  if (!status) return 'New Lead'
  // Convert snake_case to Title Case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// --- Constants ---
const STATUS_CONFIG = {
  'new': { 
    icon: Users, 
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    dotColor: 'bg-slate-500'
  },
  'email_sent': { 
    icon: Send, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dotColor: 'bg-blue-500'
  },
  'pending_reply': { 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    dotColor: 'bg-yellow-500'
  },
  'replied': { 
    icon: MessageSquare, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dotColor: 'bg-green-500'
  },
  'proposal_accepted': { 
    icon: CheckCircle, 
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  'follow_up_sent': { 
    icon: Reply, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dotColor: 'bg-purple-500'
  },
  'no_response': { 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dotColor: 'bg-red-500'
  },
  'meeting_scheduled': { 
    icon: Calendar, 
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    dotColor: 'bg-emerald-500'
  }
}

// --- Helper Component ---
function LeadStatusBadge({ status = 'new', followUpCount = 0 }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['new']
  const Icon = config.icon
  
  // Use the actual status from API, formatted
  let label = formatStatusLabel(status)
  if (status === 'follow_up_sent' && followUpCount > 0) {
    label = `Follow Up ${followUpCount} Sent`
  }
  
  return (
    <Badge className={`${config.color} inline-flex items-center gap-1.5 font-medium px-3 py-1.5 border-0 whitespace-nowrap`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  )
}

// --- Utility Function ---
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/lead')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads')
      }
      
      const normalized = data.map((lead) => ({
        ...lead,
        zoominfo_contact_id: lead.zoominfo_contact_id ? String(lead.zoominfo_contact_id) : null,
        status: lead.status_info?.status || 'new',
        follow_up_count: lead.status_info?.follow_up_count || 0,
        contact_accuracy_score: lead.status_info?.contact_accuracy_score || null,
        contact_accuracy_grade: lead.status_info?.contact_accuracy_grade || null,
        last_email_sent_at: lead.status_info?.last_email_sent_at || null,
        last_replied_at: lead.status_info?.last_replied_at || null,
        next_follow_up_at: lead.status_info?.next_follow_up_at || null,
        meeting_scheduled_at: lead.status_info?.meeting_scheduled_at || null,
        job_start_date: lead.status_info?.job_start_date || null,
        thread_id: lead.status_info?.thread_id || null,
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

  const stats = useMemo(() => {
    const statsData = leads.reduce((acc, lead) => {
      const status = lead.status || 'new'
      acc.statusCounts[status] = (acc.statusCounts[status] || 0) + 1
      
      if (lead.contact_accuracy_grade === 'A') acc.highAccuracy++
      if (lead.last_replied_at) acc.hasReplies++
      if (lead.meeting_scheduled_at) acc.hasMeetings++
      acc.totalFollowUps += (lead.follow_up_count || 0)
      
      return acc
    }, {
      statusCounts: {},
      highAccuracy: 0,
      hasReplies: 0,
      hasMeetings: 0,
      totalFollowUps: 0
    })

    const replyRate = leads.length > 0 ? ((statsData.hasReplies / leads.length) * 100).toFixed(1) : 0
    const meetingRate = leads.length > 0 ? ((statsData.hasMeetings / leads.length) * 100).toFixed(1) : 0

    return [
      { 
        label: "Total Leads", 
        value: leads.length, 
        icon: Users, 
        color: "text-blue-600 dark:text-blue-400", 
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-900",
        trend: null
      },
      { 
        label: "High Accuracy", 
        value: statsData.highAccuracy, 
        icon: CheckCircle, 
        color: "text-green-600 dark:text-green-400", 
        bgColor: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-900",
        trend: null
      },
      { 
        label: "New Leads", 
        value: statsData.statusCounts['new'] || 0, 
        icon: Users, 
        color: "text-slate-600 dark:text-slate-400", 
        bgColor: "bg-slate-50 dark:bg-slate-950/50",
        border: "border-slate-200 dark:border-slate-800",
        trend: null
      },
      { 
        label: "Emails Sent", 
        value: statsData.statusCounts['email_sent'] || 0, 
        icon: Send, 
        color: "text-blue-600 dark:text-blue-400", 
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-900",
        trend: null
      },
      { 
        label: "Reply Rate", 
        value: `${replyRate}%`, 
        icon: MessageSquare, 
        color: "text-green-600 dark:text-green-400", 
        bgColor: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-900",
        trend: replyRate > 20 ? "up" : null
      },
      { 
        label: "Pending Reply", 
        value: statsData.statusCounts['pending_reply'] || 0, 
        icon: Clock, 
        color: "text-yellow-600 dark:text-yellow-400", 
        bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
        border: "border-yellow-200 dark:border-yellow-900",
        trend: null
      },
      { 
        label: "Meetings Set", 
        value: statsData.hasMeetings, 
        icon: Calendar, 
        color: "text-emerald-600 dark:text-emerald-400", 
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        border: "border-emerald-200 dark:border-emerald-900",
        trend: statsData.hasMeetings > 0 ? "up" : null
      },
      { 
        label: "Meeting Rate", 
        value: `${meetingRate}%`, 
        icon: TrendingUp, 
        color: "text-purple-600 dark:text-purple-400", 
        bgColor: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-200 dark:border-purple-900",
        trend: meetingRate > 10 ? "up" : null
      },
    ]
  }, [leads])

  const filteredLeads = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase()
    
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false
      }
      
      if (searchTerm) {
        const fullName = [lead.first_name, lead.middle_name, lead.last_name].filter(Boolean).join(' ').toLowerCase()
        const email = (lead.email_address || '').toLowerCase()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Lead Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                    Automated email workflow with intelligent follow-up system
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline"
                className="gap-2 border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button 
                onClick={handleRefresh} 
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {stats.map((item) => (
            <Card 
              key={item.label} 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-neutral-800 group cursor-pointer"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${item.bgColor} opacity-40 rounded-bl-full`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </CardTitle>
                <div className={`${item.bgColor} p-2 rounded-lg shadow-sm transition-transform group-hover:scale-110`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </div>
                  {item.trend === "up" && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium">Good</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Lead Details Table */}
        <Card className="border border-gray-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Lead Activity Tracker
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filteredLeads.length} of {leads.length} leads shown
                </p>
              </div>
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search name, email, company..."
                    className="pl-9 border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-52 border-gray-300 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2 font-medium">
                        All Statuses
                      </div>
                    </SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, { icon: Icon, dotColor }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                          <Icon className="h-4 w-4" />
                          <span>{formatStatusLabel(key)}</span>
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
                  <thead className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Lead Info</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Follow-ups</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                              <RefreshCcw className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading leads...</p>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7">
                          <div className="p-20 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 mb-4">
                              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Error Loading Leads
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                              {error}
                            </p>
                            <Button 
                              onClick={handleRefresh}
                              className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                          <div className="p-20 text-center">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 mb-6">
                              <BarChart3 className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              No leads in your pipeline yet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                              Upload your first batch of leads to start the automated workflow
                            </p>
                            <Link href="/lead-upload">
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                                <Users className="h-4 w-4 mr-2" />
                                Upload Leads Now
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                           <div className="p-20 text-center">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 mb-6">
                              <Search className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              No Leads Found
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                              No leads match your current search and filter criteria.
                            </p>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                              }}
                              className="border-gray-300 dark:border-neutral-700"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.zoominfo_contact_id || lead.email_address} className="hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {(lead.first_name?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {[lead.first_name, lead.middle_name, lead.last_name].filter(Boolean).join(' ')}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {lead.job_title}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {lead.company_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {lead.email_address && (
                                <a 
                                  href={`mailto:${lead.email_address}`}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 group"
                                >
                                  <Mail className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" /> 
                                  <span className="truncate max-w-[200px]">{lead.email_address}</span>
                                </a>
                              )}
                              {lead.direct_phone_number && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <span>📞</span>
                                  <span>{lead.direct_phone_number}</span>
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
                              <div className="relative inline-flex items-center justify-center">
                                <svg className="h-12 w-12 -rotate-90">
                                  <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="20" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                    fill="none" 
                                    className="text-gray-200 dark:text-neutral-800"
                                  />
                                  <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="20" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                    fill="none" 
                                    strokeDasharray={`${((lead.follow_up_count || 0) / 3) * 125.6} 125.6`}
                                    className="text-blue-600 dark:text-blue-400 transition-all"
                                  />
                                </svg>
                                <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
                                  {lead.follow_up_count || 0}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                of 3
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs gap-1.5">
                              {lead.meeting_scheduled_at ? (
                                <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span className="font-medium">Meeting: {formatDate(lead.meeting_scheduled_at)}</span>
                                </div>
                              ) : lead.last_replied_at ? (
                                <div className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">
                                  <Reply className="h-3.5 w-3.5" />
                                  <span className="font-medium">Replied: {formatDate(lead.last_replied_at)}</span>
                                </div>
                              ) : lead.next_follow_up_at ? (
                                <div className="inline-flex items-center gap-1.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="font-medium">Next: {formatDate(lead.next_follow_up_at)}</span>
                                </div>
                              ) : lead.last_email_sent_at ? (
                                <div className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                                  <Send className="h-3.5 w-3.5" />
                                  <span className="font-medium">Sent: {formatDate(lead.last_email_sent_at)}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600 italic">No activity yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/leads/${lead.zoominfo_contact_id}`}>
                              <Button variant="outline" size="sm" className="gap-1.5 border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
                                <Eye className="h-4 w-4" />
                                View Details
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