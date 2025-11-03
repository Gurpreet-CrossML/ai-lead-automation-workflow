'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Mail, Phone, Building2, Briefcase, Calendar, 
  MessageSquare, TrendingUp, User, Globe, Linkedin
} from "lucide-react"

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getSentimentColor = (sentiment) => {
  if (!sentiment) return 'bg-muted text-muted-foreground'
  
  const lowerSentiment = sentiment.toLowerCase()
  if (lowerSentiment.includes('positive')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  if (lowerSentiment.includes('negative')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
}

export function LeadDetailsModal({ lead, open, onOpenChange }) {
  if (!lead) return null

  const fullName = [lead.first_name, lead.middle_name, lead.last_name].filter(Boolean).join(' ')
  const location = [lead.person_city, lead.person_state, lead.country].filter(Boolean).join(', ')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {(lead.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground mb-1">
                {fullName}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {lead.job_title} {lead.company_name && `at ${lead.company_name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lead.email_address && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${lead.email_address}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {lead.email_address}
                    </a>
                  </div>
                )}
                {lead.direct_phone_number && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{lead.direct_phone_number}</span>
                  </div>
                )}
                {lead.mobile_phone && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{lead.mobile_phone}</span>
                  </div>
                )}
                {lead.linkedin_contact_profile_url && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={lead.linkedin_contact_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lead.company_name && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Company</div>
                      <div className="text-sm font-medium text-foreground">{lead.company_name}</div>
                    </div>
                  </div>
                )}
                {lead.department && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Department</div>
                      <div className="text-sm font-medium text-foreground">{lead.department}</div>
                    </div>
                  </div>
                )}
                {lead.management_level && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Management Level</div>
                      <div className="text-sm font-medium text-foreground">{lead.management_level}</div>
                    </div>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      <div className="text-sm font-medium text-foreground">{location}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Email Summaries */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Email Communication History
                {lead.email_summaries && lead.email_summaries.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {lead.email_summaries.length} {lead.email_summaries.length === 1 ? 'email' : 'emails'}
                  </Badge>
                )}
              </h3>
              
              {!lead.email_summaries || lead.email_summaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No email communication history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lead.email_summaries.map((summary, index) => (
                    <div 
                      key={summary.id} 
                      className="border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">
                              Email Summary
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(summary.summary_generated_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {summary.sentiment && (
                            <Badge className={getSentimentColor(summary.sentiment)}>
                              {summary.sentiment}
                            </Badge>
                          )}
                          {summary.category && (
                            <Badge variant="outline">
                              {summary.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {summary.email_body_summary && (
                        <div className="pl-10">
                          <p className="text-sm text-foreground leading-relaxed">
                            {summary.email_body_summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lead ID */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                ZoomInfo Contact ID: <span className="font-mono">{lead.zoominfo_contact_id}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}