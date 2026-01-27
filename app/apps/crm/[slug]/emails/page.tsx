'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useComposeEmail } from '@/context/ComposeEmailContext'
import { Send, RefreshCw, Inbox, Edit, Trash2, Reply, Plus, X, Check, Paperclip, FileText, Save, Clock, PenTool, Search, Filter, XCircle, CheckSquare, Square, MailOpen, MailX, Settings, Loader2, Calendar, Megaphone, Printer, Users } from 'lucide-react'
import { MarketingView } from '@/components/admin/email/MarketingView'
import { toast } from '@/components/toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button06 } from "@/components/ui/sneaky-button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Server } from 'lucide-react'

interface EmailAccount {
  id: string
  name: string
  email: string
}

interface Email {
  uid: number
  from: string
  to: string | any[] | any // Can be JSON array/object or string
  subject: string
  text: string
  htmlContent?: string
  date: string
  folder?: string
  hasAttachments?: boolean
  attachmentCount?: number
  isRead?: number | boolean
}

interface ScheduledEmail {
  id: string
  accountId: string
  to: string
  subject: string
  body: string
  scheduledFor: string
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  createdAt: string
}

// Helper to format subject with styled prefixes
function Subject({ text }: { text: string }) {
  if (!text) return <span className="text-gray-400 italic">(No Subject)</span>

  const match = text.match(/^((?:Re|Fwd|FW|RE|FWD):\s*)(.+)/i)
  if (match) {
    return (
      <>
        <span className="text-gray-400 font-medium mr-1 tracking-normal">{match[1]}</span>
        <span>{match[2]}</span>
      </>
    )
  }
  return <span>{text}</span>
}

// Helper to clean raw MIME content if parsing failed
function cleanEmailContent(content: string): string {
  if (!content) return ''
  // Check for multipart boundaries in text
  if (content.includes('Content-Type: text/html') && content.includes('------=_Part_')) {
    const htmlMatch = content.match(/Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?:------=_Part_|$)/i)
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1].trim()
    }
  }
  return content
}


// Component to render text email bodies with styled reply history
function EmailBody({ text }: { text: string }) {
  if (!text) return <div>No content</div>

  // Split into lines to find the "On ... wrote:" marker
  const lines = text.split('\n')
  const replyIndex = lines.findIndex(line =>
    line.match(/^On\s+.+,\s+.+\s+wrote:/i) ||
    line.match(/^[-]+ Original Message [-]+$/i)
  )

  if (replyIndex !== -1) {
    const mainContent = lines.slice(0, replyIndex).join('\n').trim()
    const replyHeader = lines[replyIndex]
    const replyContent = lines.slice(replyIndex + 1).join('\n')

    return (
      <div className="space-y-6">
        <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
          {mainContent || <span className="text-gray-400 italic">No message body</span>}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider select-none">
            Reply History
          </div>
          <div className="text-sm text-gray-500 font-medium mb-3 pl-2 border-l-2 border-gray-200">
            {replyHeader}
          </div>
          <div className="pl-4 border-l-2 border-gray-100 text-gray-400 text-sm whitespace-pre-wrap font-sans">
            {replyContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
      {text}
    </div>
  )
}

// Helper to parse recipient_to (JSON or string) into displayable string
function parseRecipient(to: any): string {
  if (!to) return ''
  if (typeof to === 'string') {
    if (to.startsWith('[')) {
      try {
        const parsed = JSON.parse(to)
        return parseRecipient(parsed)
      } catch {
        return to
      }
    }
    return to
  }
  if (Array.isArray(to)) {
    return to.map((r: any) => {
      if (typeof r === 'string') return r
      return r.address || r.email || r.name || r.text || ''
    }).filter(Boolean).join(', ')
  }
  if (typeof to === 'object') {
    // If it's a value object { value: [...] } as per mailparser sometimes
    if (to.value && Array.isArray(to.value)) {
      return parseRecipient(to.value)
    }
    return to.address || to.email || to.name || to.text || ''
  }
  return String(to)
}

export default function MailSystemPage() {
  const router = useRouter()
  const { openCompose } = useComposeEmail()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  // readEmails removed, using email.isRead directly
  const [loading, setLoading] = useState(false)
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const searchParams = useSearchParams()

  // Initialize view from URL or default to 'inbox'
  const initialView = () => {
    const urlTab = searchParams.get('tab')
    if (urlTab && ['inbox', 'sent', 'templates', 'scheduled', 'marketing'].includes(urlTab)) {
      return urlTab as 'inbox' | 'compose' | 'templates' | 'scheduled' | 'marketing'
    }
    return 'inbox'
  }

  const [view, setView] = useState<'inbox' | 'compose' | 'templates' | 'scheduled' | 'marketing'>(initialView)

  // Sync URL when view changes
  const handleViewChange = (newView: 'inbox' | 'compose' | 'templates' | 'scheduled' | 'marketing') => {
    setView(newView)
    const url = new URL(window.location.href)
    if (newView === 'inbox') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', newView)
    }
    window.history.replaceState({}, '', url.toString())
  }
  const [currentFolder, setCurrentFolder] = useState<string>('INBOX')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addError, setAddError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)


  // Draft management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<any[]>([])
  const [showDrafts, setShowDrafts] = useState(false)

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterFolder, setFilterFolder] = useState<'all' | 'INBOX' | 'Sent'>('all')
  const [filterHasAttachments, setFilterHasAttachments] = useState(false)
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false)

  // Bulk operations
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())

  // Templates management
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    bodyText: '',
    category: 'General',
    isShared: false
  })

  // Scheduled Emails
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [loadingScheduled, setLoadingScheduled] = useState(false)

  const loadScheduled = async (accountId: string) => {
    if (!accountId) return
    setLoadingScheduled(true)
    try {
      const res = await fetch(`/api/email-system/schedule?accountId=${accountId}`)
      const data = await res.json()
      if (data.success) {
        setScheduledEmails(data.scheduledEmails)
      }
    } catch (error) {
      console.error('Failed to load scheduled emails:', error)
      toast({ title: 'Error', description: 'Failed to load scheduled emails', variant: 'destructive' })
    } finally {
      setLoadingScheduled(false)
    }
  }

  const [processing, setProcessing] = useState(false)

  const processScheduled = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/email-system/schedule/process', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Processed", description: data.message })
        if (selectedAccount) loadScheduled(selectedAccount)
      } else {
        toast({ title: "Error", description: data.error || "Failed to process", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return

    try {
      const res = await fetch(`/api/email-system/schedule?id=${id}&accountId=${selectedAccount}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Cancelled", description: "Email schedule cancelled" })
        if (selectedAccount) loadScheduled(selectedAccount)
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to cancel", variant: "destructive" })
    }
  }

  const handleEditSchedule = (email: ScheduledEmail) => {
    // Open Compose with pre-filled data
    // Ideally we pass a context that this is an "EDIT" of a schedule, 
    // but standard compose just creates new. 
    // Workaround: Cancel old, open new draft.

    if (!confirm('Editing will cancel the current schedule and open a draft. Continue?')) return;

    handleCancelSchedule(email.id).then(() => {
      openCompose({
        to: email.to,
        subject: email.subject,
        body: email.body
      })
    })
  }

  const [newAccount, setNewAccount] = useState({
    name: '',
    provider: 'custom',
    email: '',
    username: '',
    password: '',
    // SMTP
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    from_name: '',
    from_email: '',
    // IMAP
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    // Signature
    signature_html: '',
    use_signature: true,
    // Validation
    skipVerification: false,
  })

  // Helper for provider presets
  const handleProviderChange = (value: string, isEdit = false) => {
    let base = isEdit ? editingAccount : newAccount;
    // If switching provider, apply defaults
    let newData = { ...base, provider: value };

    if (value === 'gmail') {
      newData.smtpHost = 'smtp.gmail.com';
      newData.smtpPort = 587;
      newData.imapHost = 'imap.gmail.com';
      newData.imapPort = 993;
      if (!newData.name) newData.name = 'Gmail Account';
    } else if (value === 'outlook') {
      newData.smtpHost = 'smtp.office365.com';
      newData.smtpPort = 587;
      newData.imapHost = 'outlook.office365.com';
      newData.imapPort = 993;
      if (!newData.name) newData.name = 'Outlook Account';
    } else if (value === 'sendgrid') {
      newData.smtpHost = 'smtp.sendgrid.net';
      newData.smtpPort = 587;
      if (!newData.name) newData.name = 'SendGrid';
    }

    if (isEdit) setEditingAccount(newData);
    else setNewAccount(newData);
  };

  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    // Auth is handled by Layout/Middleware
    fetchAccounts()
  }, [router])

  useEffect(() => {
    if (view === 'templates' && selectedAccount) {
      fetchTemplates()
    }
  }, [view, selectedAccount])

  const fetchTemplates = async () => {
    if (!selectedAccount) return
    setLoadingTemplates(true)
    try {
      const res = await fetch(`/api/email-system/templates?accountId=${selectedAccount}`, {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (e) {
      toast.error('Failed to fetch templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleCreateOrUpdateTemplate = async () => {
    if (!templateForm.name || !selectedAccount) {
      toast.error('Please name your template')
      return
    }

    try {
      const method = editingTemplate ? 'PATCH' : 'POST'
      const res = await fetch('/api/email-system/templates', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          ...templateForm,
          accountId: selectedAccount,
          templateId: editingTemplate?.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created')
        setShowTemplateModal(false)
        setEditingTemplate(null)
        setTemplateForm({ name: '', subject: '', bodyText: '', category: 'General', isShared: false })
        fetchTemplates()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      const res = await fetch(`/api/email-system/templates?templateId=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Template deleted')
        fetchTemplates()
      }
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  useEffect(() => {
    if (!selectedAccount) return

    loadInbox(currentFolder)
    fetchDrafts()
    // Removed auto-sync interval - user must click Refresh to sync
  }, [selectedAccount, currentFolder])




  const markAsRead = async (uid: number, folder: string = 'INBOX') => {
    if (!selectedAccount) return

    // Optimistic update
    setEmails(prev => prev.map(e => e.uid === uid ? { ...e, isRead: 1 } : e))

    // Update database
    try {
      await fetch('/api/email-system/read-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          emails: [{ uid, folder }],
          isRead: true
        })
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
      // Revert on error
      setEmails(prev => prev.map(e => e.uid === uid ? { ...e, isRead: 0 } : e))
    }
  }

  const markAsUnread = async (uid: number, folder: string = 'INBOX') => {
    if (!selectedAccount) return

    // Optimistic update
    setEmails(prev => prev.map(e => e.uid === uid ? { ...e, isRead: 0 } : e))

    // Update database
    try {
      await fetch('/api/email-system/read-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          emails: [{ uid, folder }],
          isRead: false
        })
      })
    } catch (error) {
      console.error('Failed to mark as unread:', error)
      setEmails(prev => prev.map(e => e.uid === uid ? { ...e, isRead: 1 } : e))
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/email-system/accounts', {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.accounts) {
        setAccounts(data.accounts)
        if (data.accounts.length > 0) {
          if (!selectedAccount || !data.accounts.find((a: any) => a.id === selectedAccount)) {
            setSelectedAccount(data.accounts[0].id)
          }
        } else {
          setSelectedAccount('')
          setEmails([])
        }
      }
    } catch (error) {
      toast.error('Failed to load accounts')
    }
  }

  const createAccount = async () => {
    setAddError('')
    // Consolidated validation: Check Name, From Email, Username, Password, Host
    if (!newAccount.name || !newAccount.from_email || !newAccount.password || !newAccount.username || !newAccount.smtpHost) {
      setAddError('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/email-system/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          ...newAccount,
          // Ensure 'email' is populated for backend validation (it expects 'email' or 'from_email' but checks !email often)
          email: newAccount.from_email,
        })
      })
      const data = await res.json()
      console.log('Create Account Response:', data)

      if (data.success) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2500)

        // Instant Sync & Select
        const newAccountId = data.account.id
        setSelectedAccount(newAccountId)

        // Trigger Sync in background immediately
        fetch('/api/email-system/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YWRtaW4='
          },
          body: JSON.stringify({ accountId: newAccountId, limit: 20 })
        })
          .then(res => res.json())
          .then(data => {
            // Reload inbox after sync matches
            if (selectedAccount === newAccountId) {
              loadInbox('INBOX')
              if (data.success && data.synced > 0) {
                toast.success(`Synced ${data.synced} emails`)
              } else if (data.success) {
                toast({ title: 'Connected', description: 'Inbox seems empty.' })
              } else {
                // Silent fail logs
                console.error('Sync failed:', data.error)
              }
            }
          })
          .catch(err => console.error('Sync network error', err))

        setTimeout(() => {
          setShowAddModal(false)
          setNewAccount({
            name: '',
            provider: 'custom',
            email: '',
            username: '',
            password: '',
            smtpHost: '',
            smtpPort: 587,
            smtpSecure: false,
            from_name: '',
            from_email: '',
            imapHost: '',
            imapPort: 993,
            imapSecure: true,
            signature_html: '',
            use_signature: true,
            skipVerification: false,
          })
        }, 500)
        fetchAccounts()
      } else {
        console.error('Account Creation Failed:', data.error)
        setAddError(data.error || 'Connection failed. Check credentials.')
        // Use direct properties to ensure it shows
        toast({
          title: "Connection Failed",
          description: data.error || 'Check your credentials and try again',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Create Account Error:', error)
      setAddError('Network error. Failed to connect.')
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateAccount = async () => {
    if (!editingAccount || !editingAccount.name || !editingAccount.email) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/email-system/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          name: editingAccount.name,
          email: editingAccount.email,
          username: editingAccount.username,
          password: editingAccount.password || undefined,
          imapHost: editingAccount.imapHost,
          imapPort: editingAccount.imapPort,
          imapSecure: editingAccount.imapSecure,
          smtpHost: editingAccount.smtpHost,
          smtpPort: editingAccount.smtpPort,
          smtpSecure: editingAccount.smtpSecure,
          provider: editingAccount.provider,
          from_name: editingAccount.from_name || editingAccount.name,
          from_email: editingAccount.from_email || editingAccount.email,
          // signature items intentionally omitted until DB supports them
          // signature_html: editingAccount.signature_html,
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Account updated successfully')
        setShowEditModal(false)
        setEditingAccount(null)
        fetchAccounts()
      } else {
        toast.error(data.error || 'Failed to update account')
      }
    } catch (error) {
      toast.error('Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (accountId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/email-system/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Account deleted successfully')
        if (selectedAccount === accountId) {
          setSelectedAccount('')
          setEmails([])
        }
        await fetchAccounts()
        setDropdownOpen(false)
      } else {
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const syncEmails = async (showToast = true) => {
    if (!selectedAccount) return
    setSyncing(true)
    try {
      await fetch('/api/email-system/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({ accountId: selectedAccount, limit: 50 })
      })
      await loadInbox()
      if (showToast) toast.success('Emails synced')
    } catch (error) {
      if (showToast) toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const loadInbox = async (folder: string = currentFolder) => {
    if (!selectedAccount) {
      setLoadingEmails(false)
      return
    }
    setLoadingEmails(true)
    setEmails([]) // Clear previous emails while loading

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const res = await fetch('/api/email-system/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({ accountId: selectedAccount, limit: 50, folder }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await res.json()

      if (data.success && Array.isArray(data.emails)) {
        setEmails(data.emails)
      } else {
        setEmails([])
        console.error('[INBOX_LOAD] API returned error:', data.error || data)
      }
    } catch (error: any) {
      console.error('[INBOX_LOAD_ERROR]', error.message || error)
      setEmails([])
    } finally {
      setLoadingEmails(false)
    }
  }

  const handleReply = () => {
    if (!selectedEmail) return
    openCompose({
      to: selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from,
      subject: 'Re: ' + selectedEmail.subject,
      body: selectedEmail.text ? `\n\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from} wrote:\n> ${selectedEmail.text.split('\n').join('\n> ')}` : ''
    })
  }

  const handleDelete = async () => {
    if (!selectedEmail) return
    if (!confirm('Delete this email?')) return
    toast.success('Email deleted')
    setEmails(emails.filter(e => e.uid !== selectedEmail.uid))
    setSelectedEmail(null)
  }

  const fetchDrafts = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/email-system/drafts?accountId=${selectedAccount}`, {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        setDrafts(data.drafts || [])
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    }
  }

  const loadDraft = (draft: any) => {
    openCompose({
      to: draft.to || '',
      subject: draft.subject || '',
      body: draft.body || draft.htmlBody?.replace(/<[^>]*>/g, '') || ''
    })
    setShowDrafts(false)
    toast.success('Draft loaded')
  }

  const deleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/email-system/drafts?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        setDrafts(drafts.filter(d => d.id !== id))
        if (currentDraftId === id) {
          setCurrentDraftId(null)
        }
        toast.success('Draft deleted')
      }
    } catch (error) {
      toast.error('Failed to delete draft')
    }
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email)
    markAsRead(email.uid, email.folder || 'INBOX')
  }

  const isSent = (email: Email) => email.folder === 'SENT' || email.folder === 'Sent'

  // Apply search and filters
  const filteredEmails = emails.filter(email => {
    const toStr = parseRecipient(email.to)
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        email.from.toLowerCase().includes(query) ||
        toStr.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        (email.text || '').toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // From filter
    if (filterFrom && !email.from.toLowerCase().includes(filterFrom.toLowerCase())) {
      return false
    }

    // Subject filter
    if (filterSubject && !email.subject.toLowerCase().includes(filterSubject.toLowerCase())) {
      return false
    }

    // Folder filter
    if (filterFolder !== 'all' && email.folder !== filterFolder) {
      return false
    }

    // Has attachments filter
    if (filterHasAttachments && !email.hasAttachments) {
      return false
    }

    // Unread only filter
    if (filterUnreadOnly && email.isRead) {
      return false
    }

    return true
  })

  const clearFilters = () => {
    setSearchQuery('')
    setFilterFrom('')
    setFilterSubject('')
    setFilterFolder('all')
    setFilterHasAttachments(false)
    setFilterUnreadOnly(false)
  }

  const hasActiveFilters = searchQuery || filterFrom || filterSubject || filterFolder !== 'all' || filterHasAttachments || filterUnreadOnly

  // Bulk operations
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedEmails(new Set())
  }

  const toggleEmailSelection = (emailId: string) => {
    const newSelection = new Set(selectedEmails)
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId)
    } else {
      newSelection.add(emailId)
    }
    setSelectedEmails(newSelection)
  }

  const selectAll = () => {
    const allIds = new Set(filteredEmails.map(e => `${e.uid}-${e.folder}`))
    setSelectedEmails(allIds)
  }

  const selectNone = () => {
    setSelectedEmails(new Set())
  }

  const bulkMarkAsRead = async () => {
    if (!selectedAccount || selectedEmails.size === 0) return

    // Optimistic update
    setEmails(prev => prev.map(e => selectedEmails.has(`${e.uid}-${e.folder}`) ? { ...e, isRead: 1 } : e))

    // Prepare emails array for API
    const emailsArray = Array.from(selectedEmails).map(id => {
      const [uid, folder] = id.split('-')
      return { uid: parseInt(uid), folder: folder || 'INBOX' }
    })

    try {
      await fetch('/api/email-system/read-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          emails: emailsArray,
          isRead: true
        })
      })
      toast.success(`Marked ${selectedEmails.size} email(s) as read`)
    } catch (error) {
      console.error('Failed to bulk mark as read:', error)
      toast.error('Failed to update read status')
      // Revert
      setEmails(prev => prev.map(e => selectedEmails.has(`${e.uid}-${e.folder}`) ? { ...e, isRead: 0 } : e))
    }

    setSelectedEmails(new Set())
  }

  const bulkMarkAsUnread = async () => {
    if (!selectedAccount || selectedEmails.size === 0) return

    // Optimistic update
    setEmails(prev => prev.map(e => selectedEmails.has(`${e.uid}-${e.folder}`) ? { ...e, isRead: 0 } : e))

    // Prepare emails array for API
    const emailsArray = Array.from(selectedEmails).map(id => {
      const [uid, folder] = id.split('-')
      return { uid: parseInt(uid), folder: folder || 'INBOX' }
    })

    try {
      await fetch('/api/email-system/read-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          emails: emailsArray,
          isRead: false
        })
      })
      toast.success(`Marked ${selectedEmails.size} email(s) as unread`)
    } catch (error) {
      console.error('Failed to bulk mark as unread:', error)
      toast.error('Failed to update read status')
      setSelectedEmails(new Set());
    }

    setSelectedEmails(new Set());
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedEmails.size} selected email(s)?`)) return;

    const emailsToDelete = Array.from(selectedEmails);
    const remaining = emails.filter(e => !emailsToDelete.includes(`${e.uid}-${e.folder}`));
    setEmails(remaining);
    toast.success(`Deleted ${selectedEmails.size} email(s)`);
    setSelectedEmails(new Set());
    setBulkMode(false);
  };

  const currentAccount = accounts.find(a => a.id === selectedAccount);

  const currentTab = (view === 'inbox')
    ? (currentFolder === 'Sent' ? 'sent' : 'inbox')
    : view;

  const handleTabChange = (val: string) => {
    if (val === 'inbox') {
      handleViewChange('inbox');
      setCurrentFolder('INBOX');
      loadInbox('INBOX');
    } else if (val === 'sent') {
      handleViewChange('inbox');
      setCurrentFolder('Sent');
      loadInbox('Sent');
    } else if (val === 'templates') {
      handleViewChange('templates');
    } else if (val === 'scheduled') {
      handleViewChange('scheduled');
      if (selectedAccount) loadScheduled(selectedAccount);
    } else if (val === 'marketing') {
      handleViewChange('marketing');
    } else if (val === 'compose') {
      openCompose();
    }
  };

  return (
    <div className="h-full overflow-hidden relative bg-zinc-50/50 dark:bg-black">
      {/* Background simplified for debugging */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-white/50 dark:bg-black/50" />

      {/* Compact Header Removed as per user request */}

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full relative z-10">
        <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-none overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-red-500/5 z-10">
          <div className="border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-muted/20 dark:bg-muted/10 pr-2">
            <ScrollArea className="flex-1 min-w-0">
              <TabsList className="w-full justify-start bg-transparent p-0 gap-0 h-auto">
                <TabsTrigger
                  value="inbox"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D11A2A] data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/5 data-[state=active]:shadow-none font-bold text-slate-600 dark:text-slate-400 data-[state=active]:text-[#D11A2A] dark:data-[state=active]:text-[#FF5941] uppercase tracking-wider text-xs gap-2"
                >
                  <Inbox className="w-4 h-4" />
                  Inbox
                  {emails.filter(e => !e.isRead && e.folder !== 'Sent').length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 bg-red-100 text-red-600 hover:bg-red-200 border-0 h-5 min-w-5 px-1">
                      {emails.filter(e => !e.isRead && e.folder !== 'Sent').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D11A2A] data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/5 data-[state=active]:shadow-none font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 data-[state=active]:text-[#D11A2A] dark:data-[state=active]:text-[#FF5941] uppercase tracking-wider text-xs gap-2"
                >
                  <Send className="w-4 h-4" />
                  Sent
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D11A2A] data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/5 data-[state=active]:shadow-none font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 data-[state=active]:text-[#D11A2A] dark:data-[state=active]:text-[#FF5941] uppercase tracking-wider text-xs gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D11A2A] data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/5 data-[state=active]:shadow-none font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 data-[state=active]:text-[#D11A2A] dark:data-[state=active]:text-[#FF5941] uppercase tracking-wider text-xs gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger
                  value="marketing"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D11A2A] data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/5 data-[state=active]:shadow-none font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 data-[state=active]:text-[#D11A2A] dark:data-[state=active]:text-[#FF5941] uppercase tracking-wider text-xs gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  Marketing
                </TabsTrigger>
                <TabsTrigger
                  value="compose"
                  className="px-4 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 uppercase tracking-wider text-xs gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Compose
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="flex items-center gap-2 mr-4 shrink-0">
              {/* Search Bar (Moved before Account Selector) */}
              {view !== 'templates' && (
                <div className="flex items-center gap-2 mr-2">
                  <div className="relative w-32 focus-within:w-48 transition-all duration-300 ease-in-out z-20">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-xs font-medium transition-all dark:text-white dark:placeholder-gray-500 focus-within:bg-white dark:focus-within:bg-zinc-800"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1.5 rounded-lg border transition-all duration-200 ${showFilters || hasActiveFilters
                      ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                      : 'bg-white/50 border-gray-200 text-gray-500 hover:bg-gray-50 dark:bg-zinc-800/50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-zinc-800'
                      }`}
                    title="Filters"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="p-1.5 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 transition-all"
                      title="Clear Filters"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="h-4 w-px bg-gray-300 mx-1" />
                </div>
              )}

              {/* Account Selector Integration */}
              <div className="relative mr-2">
                <Button06
                  text={currentAccount?.name || 'Account'}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="mr-2"
                />
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-3xl border border-white/40 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
                      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                        {accounts.map((acc) => (
                          <div
                            key={acc.id}
                            className={`group flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all ${selectedAccount === acc.id ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            onClick={() => {
                              setSelectedAccount(acc.id)
                              setSelectedEmail(null)
                              setDropdownOpen(false)
                            }}
                          >
                            <div className="overflow-hidden">
                              <div className={`font-bold text-sm ${selectedAccount === acc.id ? 'text-red-600' : 'text-gray-900'}`}>{acc.name}</div>
                              <div className="text-xs text-gray-500 truncate">{acc.email}</div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingAccount(acc)
                                  setShowEditModal(true)
                                  setDropdownOpen(false)
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-700"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteAccount(acc.id)
                                }}
                                className="p-1.5 hover:bg-red-100 rounded-md text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => { setShowAddModal(true); setDropdownOpen(false); }}
                          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-white transition-all text-xs font-bold uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4" /> Add Another Account
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Right side buttons preserved */}
              {view === 'templates' ? (
                <button
                  onClick={() => {
                    setEditingTemplate(null)
                    setTemplateForm({ name: '', subject: '', bodyText: '', category: 'General', isShared: false })
                    setShowTemplateModal(true)
                  }}
                  className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-[#D11A2A] text-white text-sm font-bold rounded-lg hover:bg-[#B5171E] transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              ) : view === 'marketing' ? (
                <></>
              ) : (
                <>
                  {bulkMode ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                      <button
                        onClick={toggleBulkMode}
                        className="btn-smooth px-3 py-1.5 flex items-center gap-2 border border-red-200 bg-red-50 text-red-900 text-xs font-bold rounded-lg hover:bg-red-100"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Exit
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1" />

                      <span className="text-xs font-bold text-gray-700 tabular-nums min-w-[60px]">
                        {selectedEmails.size} selected
                      </span>

                      <div className="flex items-center gap-1">
                        <button onClick={selectAll} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 hover:bg-gray-100 rounded text-gray-500">All</button>
                        <button onClick={selectNone} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 hover:bg-gray-100 rounded text-gray-500">None</button>
                      </div>

                      {selectedEmails.size > 0 && (
                        <>
                          <div className="h-4 w-px bg-gray-300 mx-1" />
                          <button onClick={bulkMarkAsRead} title="Mark Read" className="btn-smooth p-1.5 bg-[#E6F7F0] text-[#0F5132] rounded-md hover:brightness-95"><MailOpen className="w-3.5 h-3.5" /></button>
                          <button onClick={bulkMarkAsUnread} title="Mark Unread" className="btn-smooth p-1.5 bg-[#E8F0FF] text-[#1E3A8A] rounded-md hover:brightness-95"><MailX className="w-3.5 h-3.5" /></button>
                          <button onClick={bulkDelete} title="Delete" className="btn-smooth p-1.5 bg-[#FFE5E5] text-[#7F1D1D] rounded-md hover:brightness-95"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>

                      <Button06
                        text="Refresh"
                        onClick={() => syncEmails(true)}
                        disabled={syncing}
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'smooth-spin' : ''}`} />}
                        className="bg-[#D11A2A] border-[#D11A2A] hover:border-[#B5171E] hover:bg-[#B5171E] shadow-red-200/50"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`m-0 focus-visible:outline-none relative ${currentTab === 'inbox' || currentTab === 'sent' ? 'block' : 'hidden'}`}>
            {/* The content for both 'inbox' and 'sent' tabs will be rendered here,
                and the internal logic will differentiate based on currentFolder. */}
            <>
              {/* Search Bar relocated to header */}

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute top-2 right-4 left-4 z-50 grid grid-cols-2 gap-3 p-4 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-black mb-1.5 text-slate-600 dark:text-slate-400 uppercase tracking-widest">From</label>
                      <input
                        type="text"
                        placeholder="Filter by sender..."
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm bg-white/60 dark:bg-zinc-800/60 dark:text-white backdrop-blur-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-1.5 text-slate-600 uppercase tracking-widest">Subject</label>
                      <input
                        type="text"
                        placeholder="Filter by subject..."
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-secondary">Folder</label>
                      <select
                        value={filterFolder}
                        onChange={(e) => setFilterFolder(e.target.value as any)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      >
                        <option value="all">All Folders</option>
                        <option value="INBOX">Inbox Only</option>
                        <option value="Sent">Sent Only</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 justify-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterHasAttachments}
                          onChange={(e) => setFilterHasAttachments(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-bold">Has Attachments</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterUnreadOnly}
                          onChange={(e) => setFilterUnreadOnly(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-bold">Unread Only</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mt-3 px-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold tracking-tight">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredEmails.length}</strong> of <strong className="text-slate-900 dark:text-white">{emails.length}</strong> emails
                </p>
              </div>


              <div className="grid grid-cols-[400px_1fr] divide-x divide-gray-200 dark:divide-white/10 h-[calc(100vh-140px)] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-b-2xl border-x border-b border-gray-200 dark:border-white/10">
                <div className="overflow-y-auto">
                  {loadingEmails ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-slate-100 dark:border-zinc-800 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-800 dark:text-slate-200 font-black uppercase tracking-widest text-xs">Loading emails...</p>
                      </div>
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-secondary dark:text-gray-400">
                      <div className="text-center">
                        {hasActiveFilters ? (
                          <>
                            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="font-bold mb-2">No matching emails</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </>
                        ) : (
                          <>
                            <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No emails</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    filteredEmails.map((email) => {
                      const unread = !email.isRead
                      const sent = isSent(email)

                      return (
                        <div
                          key={`${email.uid}-${email.folder}`}
                          onClick={() => !bulkMode && handleEmailClick(email)}
                          className={`p-4 border-b border-slate-200 dark:border-white/5 cursor-pointer relative transition-all duration-200 hover:translate-x-1 ${(selectedEmail && (
                            (email.uid != null && selectedEmail.uid != null && String(selectedEmail.uid) === String(email.uid) && selectedEmail.folder === email.folder) ||
                            (email.uid == null && selectedEmail.uid == null && selectedEmail.subject === email.subject && selectedEmail.from === email.from && selectedEmail.date === email.date)
                          ))
                            ? 'bg-red-50 dark:bg-zinc-800 border-l-4 border-l-red-600 pl-[12px]'
                            : unread
                              ? 'bg-white/50 dark:bg-zinc-800/40 hover:bg-gray-50/80 dark:hover:bg-zinc-800/80 backdrop-blur-sm'
                              : 'dark:bg-zinc-900/20 hover:bg-gray-50/80 dark:hover:bg-zinc-800/80 backdrop-blur-sm'
                            }`}
                        >
                          {unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>}
                          <div className="flex items-center gap-3">
                            {bulkMode && (
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedEmails.has(`${email.uid}-${email.folder}`)}
                                  onCheckedChange={() => toggleEmailSelection(`${email.uid}-${email.folder}`)}
                                  className="border-gray-300 data-[state=checked]:bg-[#D11A2A] data-[state=checked]:border-[#D11A2A]"
                                />
                              </div>
                            )}
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#D11A2A] to-[#8B0000] flex items-center justify-center text-white font-bold text-sm uppercase shadow-md shadow-red-200">
                              {(() => {
                                const name = sent ? parseRecipient(email.to) : email.from || '?'
                                const cleaned = name.replace(/^["'\s]+/, '')
                                return (cleaned.charAt(0) || '?').toUpperCase()
                              })()}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {sent && (
                                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-300 rounded-md font-black uppercase tracking-widest">
                                    To
                                  </span>
                                )}
                                <span className={`truncate ${unread ? 'font-black' : 'font-bold'} text-slate-900 dark:text-white text-xs`}>
                                  {sent ? parseRecipient(email.to) : (email.from || 'Unknown Sender')}
                                </span>
                                {email.hasAttachments && (
                                  <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className={`text-xs truncate mt-0.5 ${unread ? 'font-black text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400 font-medium'}`}>
                                {email.subject || '(No Subject)'}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-tight mt-1.5 opacity-80">
                                {new Date(email.date).toLocaleDateString()} {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {/* Unread indicator */}
                            {unread && (
                              <div className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex flex-col h-full overflow-y-auto">
                  {selectedEmail ? (
                    <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl animate-in fade-in duration-300 relative">
                      {/* Compact Single-Row Header */}
                      <div className="border-b border-slate-200 dark:border-white/10 px-6 py-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D11A2A] to-[#8B0000] text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                            {(selectedEmail.from || '?').replace(/^["'\s]+/, '').charAt(0).toUpperCase()}
                          </div>

                          {/* Sender & Subject */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{selectedEmail.from.split('<')[0].trim().replace(/"/g, '')}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded uppercase tracking-wider flex-shrink-0">
                                {selectedEmail.folder || 'Inbox'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold truncate mt-0.5">
                              <Subject text={selectedEmail.subject} />
                            </div>
                          </div>

                          {/* Attachments Badge (if any) */}
                          {selectedEmail.hasAttachments && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold flex-shrink-0">
                              <Paperclip className="w-3 h-3" />
                              {selectedEmail.attachmentCount}
                            </div>
                          )}

                          {/* Date & Time */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-gray-700 dark:text-white">
                              {new Date(selectedEmail.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">
                              {new Date(selectedEmail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={handleReply}
                              title="Reply"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleDelete}
                              title="Delete"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-black">
                        <div className="max-w-4xl mx-auto p-8 min-h-full">
                          {selectedEmail.htmlContent ? (
                            <div className="email-content-wrapper font-sans text-gray-800 dark:text-gray-200 leading-relaxed text-[15px]">
                              {/* Use Shadow DOM or Iframe ideally, but keeping dangerouslySetInnerHTML with styling wrapper for now */}
                              <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                            </div>
                          ) : (
                            (() => {
                              const cleaned = cleanEmailContent(selectedEmail.text || '')
                              const isHtml = cleaned.trim().startsWith('<') || cleaned.includes('</')

                              if (isHtml) {
                                return (
                                  <div className="email-content-wrapper font-sans text-gray-800 dark:text-gray-200 leading-relaxed text-[15px]">
                                    <div dangerouslySetInnerHTML={{ __html: cleaned }} />
                                  </div>
                                )
                              }
                              return (
                                <div className="font-sans text-gray-800 dark:text-gray-200 leading-relaxed text-[15px] whitespace-pre-wrap">
                                  <EmailBody text={cleaned} />
                                </div>
                              )
                            })()
                          )}
                        </div>
                      </div>

                      {/* Reply Box Removed - Action moved to header */}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                      <div className="text-center p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 dark:border-white/10 max-w-sm mx-auto transform transition-all hover:scale-105 duration-500">
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                          <MailOpen className="w-12 h-12 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No Email Selected</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-bold tracking-wide">Select an email from the list to view its contents.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          </div>


          <TabsContent value="templates" className="m-0 focus-visible:outline-none">
            {/* Templates View is inside here? */}
            {view === 'templates' && (
              <div className="p-0">
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto bg-white custom-scrollbar">
                  {loadingTemplates ? (
                    <div className="p-20 text-center text-gray-400 animate-pulse">
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 smooth-spin opacity-20" />
                      <p className="font-bold tracking-widest uppercase text-xs">Loading Templates...</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-20 text-center text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold tracking-widest uppercase text-xs">No templates found</p>
                      <button
                        onClick={() => {
                          setEditingTemplate(null)
                          setTemplateForm({ name: '', subject: '', bodyText: '', category: 'General', isShared: false })
                          setShowTemplateModal(true)
                        }}
                        className="mt-4 text-black font-bold underline"
                      >
                        Create your first template
                      </button>
                    </div>
                  ) : (
                    templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="group px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 text-zinc-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-900 text-sm tracking-tight">{tpl.name}</div>
                            <div className="text-xs text-slate-600 font-bold truncate mt-0.5">{tpl.subject || '(No Subject)'}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">{tpl.category || 'General'}</span>
                              {tpl.isShared && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none flex items-center gap-1">
                                  <Users className="w-3 h-3" /> Shared
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight flex items-center gap-1 opacity-60">
                                <Clock className="w-3 h-3" /> Used {tpl.usageCount} times
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingTemplate(tpl)
                              setTemplateForm({
                                name: tpl.name,
                                subject: tpl.subject || '',
                                bodyText: tpl.body || '',
                                category: tpl.category || 'General',
                                isShared: tpl.isShared
                              })
                              setShowTemplateModal(true)
                            }}
                            className="p-2 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-black transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-2 hover:bg-red-50 rounded-md text-zinc-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketing" className="m-0 focus-visible:outline-none">
            {view === 'marketing' && (
              <div className="p-6">
                <MarketingView accounts={accounts} searchQuery={searchQuery} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="m-0 focus-visible:outline-none">
            {view === 'scheduled' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-zinc-50">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Scheduled Emails</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Emails waiting to be sent automatically</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={processScheduled}
                      disabled={processing}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Send className={`w-3 h-3 ${processing ? 'animate-spin' : ''}`} />
                      Process Now
                    </button>
                    <button
                      onClick={() => selectedAccount && loadScheduled(selectedAccount)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                      title="Refresh List"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingScheduled ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {loadingScheduled ? (
                    <div className="p-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Loading...</p>
                    </div>
                  ) : scheduledEmails.length === 0 ? (
                    <div className="p-20 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">No scheduled emails</p>
                    </div>
                  ) : (
                    scheduledEmails.map(email => (
                      <div key={email.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                            {email.to.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm truncate">{email.to}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${email.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                email.status === 'sent' ? 'bg-green-100 text-green-700' :
                                  'bg-red-100 text-red-700'
                                }`}>{email.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">{email.subject}</div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Scheduled for: {new Date(email.scheduledFor).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditSchedule(email)}
                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-black transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelSchedule(email.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
                            title="Cancel Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Account Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* SMTP Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <Server className="w-4 h-4" /> SMTP Settings (Sending)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    placeholder="e.g. Work Gmail"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={newAccount.provider}
                    onValueChange={(val) => handleProviderChange(val)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="custom">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={newAccount.smtpHost} onChange={e => setNewAccount({ ...newAccount, smtpHost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={newAccount.smtpPort} onChange={e => setNewAccount({ ...newAccount, smtpPort: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input placeholder="John Doe" value={newAccount.from_name} onChange={e => setNewAccount({ ...newAccount, from_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input placeholder="john@example.com" value={newAccount.from_email} onChange={e => setNewAccount({ ...newAccount, from_email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={newAccount.username} onChange={e => setNewAccount({ ...newAccount, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password / App Password</Label>
                  <Input type="password" value={newAccount.password} onChange={e => setNewAccount({ ...newAccount, password: e.target.value })} />
                </div>
              </div>
            </div>

            {/* IMAP Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <Inbox className="w-4 h-4" /> IMAP Settings (Syncing)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IMAP Host</Label>
                  <Input value={newAccount.imapHost} onChange={e => setNewAccount({ ...newAccount, imapHost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>IMAP Port</Label>
                  <Input type="number" value={newAccount.imapPort} onChange={e => setNewAccount({ ...newAccount, imapPort: parseInt(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4" /> Email Signature
              </h3>
              <div className="space-y-2">
                <Label>HTML Signature</Label>
                <textarea
                  className="w-full min-h-[100px] p-2 rounded-md border bg-background text-sm"
                  placeholder="<p>Best regards,<br>John</p>"
                  value={newAccount.signature_html}
                  onChange={e => setNewAccount({ ...newAccount, signature_html: e.target.value })}
                />
              </div>
            </div>

            {addError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
                {addError}
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto">
              <input type="checkbox" checked={newAccount.skipVerification} onChange={e => setNewAccount({ ...newAccount, skipVerification: e.target.checked })} className="rounded border-gray-300" />
              <Label className="text-xs text-muted-foreground cursor-pointer">Skip Verification</Label>
            </div>
            <Button06
              text={loading ? "Connecting..." : "Connect Account"}
              onClick={createAccount}
              disabled={loading}
              className="bg-black text-white hover:bg-zinc-800"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      {editingAccount && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={editingAccount.provider || 'custom'}
                    onValueChange={(val) => handleProviderChange(val, true)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="custom">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password (Leave empty to keep current)</Label>
                <Input type="password" value={editingAccount.password || ''} onChange={e => setEditingAccount({ ...editingAccount, password: e.target.value })} />
              </div>

              <Separator />
              <h4 className="font-bold text-sm">Server Settings</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={editingAccount.smtpHost} onChange={e => setEditingAccount({ ...editingAccount, smtpHost: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input value={editingAccount.smtpPort} onChange={e => setEditingAccount({ ...editingAccount, smtpPort: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>IMAP Host</Label>
                  <Input value={editingAccount.imapHost} onChange={e => setEditingAccount({ ...editingAccount, imapHost: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>HTML Signature</Label>
                <textarea
                  className="w-full min-h-[100px] p-2 rounded-md border bg-background text-sm"
                  value={editingAccount.signature_html || ''}
                  onChange={e => setEditingAccount({ ...editingAccount, signature_html: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button06
                text={loading ? "Saving..." : "Save Changes"}
                onClick={updateAccount}
                disabled={loading}
                className="w-full bg-black text-white hover:bg-zinc-800"
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Weekly Update"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g. Sales, Support"
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                placeholder="Subject..."
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Body Content</Label>
              <textarea
                className="w-full min-h-[250px] p-3 rounded-md border bg-background text-sm font-sans leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Dear {name},..."
                value={templateForm.bodyText}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">You can use simple text. HTML keys are not fully supported in simple editor yet.</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isShared"
                checked={templateForm.isShared}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isShared: checked as boolean })}
              />
              <Label htmlFor="isShared" className="font-normal cursor-pointer">Share with team</Label>
            </div>
          </div>
          <DialogFooter>
            <Button06
              text="Save Template"
              onClick={handleCreateOrUpdateTemplate}
              className="bg-red-600 text-white hover:bg-red-700"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md perspective-1000"
          >
            {/* Confetti Explosion (50 particles) */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][i % 5]}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 1000,
                  y: (Math.random() - 0.5) * 1000,
                  opacity: 0,
                  scale: Math.random() * 1.5,
                  rotate: Math.random() * 720
                }}
                transition={{ duration: 2.5, ease: "easeOut" }}
              />
            ))}

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: -45 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-zinc-900 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 min-w-[380px] border border-white/20 relative overflow-hidden"
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              />

              <div className="w-28 h-28 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center relative shadow-lg shadow-green-500/30">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <Check className="w-14 h-14 text-white stroke-[3] drop-shadow-md" />
                </motion.div>
                {/* Ripple rings */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-green-400 rounded-full"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>

              <div className="text-center z-10">
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
                >
                  Connected!
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground font-medium mt-2 text-xl"
                >
                  System Online & Syncing
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
