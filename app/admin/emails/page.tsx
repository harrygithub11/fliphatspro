'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useComposeEmail } from '@/context/ComposeEmailContext'
import { Mail, Send, RefreshCw, Inbox, Edit, Trash2, Reply, Plus, X, Check, Paperclip, FileText, Save, Clock, PenTool, Search, Filter, XCircle, CheckSquare, Square, MailOpen, MailX, Settings } from 'lucide-react'
import { toast } from '@/components/toast'

interface EmailAccount {
  id: string
  name: string
  email: string
}

interface Email {
  uid: number
  from: string
  to: string
  subject: string
  text: string
  htmlContent?: string
  date: string
  folder?: string
  hasAttachments?: boolean
  attachmentCount?: number
}

export default function MailSystemPage() {
  const router = useRouter()
  const { openCompose } = useComposeEmail()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [readEmails, setReadEmails] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [view, setView] = useState<'inbox' | 'compose' | 'templates'>('inbox')
  const [showAddModal, setShowAddModal] = useState(false)
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

  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    imapHost: 'imap.hostinger.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpSecure: true,
  })

  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    // Check for userEmail which is set by the login page
    const token = localStorage.getItem('userEmail')
    if (!token) {
      router.push('/admin/login')
      return
    }

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

    loadInbox()
    fetchDrafts()
    loadReadStatus(selectedAccount)
    const interval = setInterval(() => {
      syncEmails(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedAccount])


  const loadReadStatus = async (accountId: string) => {
    try {
      const res = await fetch(`/api/email-system/read-status?accountId=${accountId}`, {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success && data.readEmails) {
        // Convert object to Set for faster lookup
        const readSet = new Set<number>()
        Object.keys(data.readEmails).forEach(key => {
          const uid = parseInt(key.split('-')[0])
          readSet.add(uid)
        })
        setReadEmails(readSet)
      }
    } catch (error) {
      console.error('Failed to load read status:', error)
    }
  }

  const markAsRead = async (uid: number, folder: string = 'INBOX') => {
    if (!selectedAccount) return

    // Optimistic update
    const newRead = new Set(readEmails)
    newRead.add(uid)
    setReadEmails(newRead)

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
      const revert = new Set(readEmails)
      revert.delete(uid)
      setReadEmails(revert)
    }
  }

  const markAsUnread = async (uid: number, folder: string = 'INBOX') => {
    if (!selectedAccount) return

    // Optimistic update
    const newRead = new Set(readEmails)
    newRead.delete(uid)
    setReadEmails(newRead)

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
      // Revert on error
      const revert = new Set(readEmails)
      revert.add(uid)
      setReadEmails(revert)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/email-system/accounts', {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.accounts?.length > 0) {
        setAccounts(data.accounts)
        if (!selectedAccount) setSelectedAccount(data.accounts[0].id)
      }
    } catch (error) {
      toast.error('Failed to load accounts')
    }
  }

  const createAccount = async () => {
    if (!newAccount.name || !newAccount.email || !newAccount.password) {
      toast.error('Please fill all required fields')
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
          username: newAccount.email,
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        toast.success('Account created successfully')
        setTimeout(() => {
          setShowAddModal(false)
          setNewAccount({
            name: '',
            email: '',
            username: '',
            password: '',
            imapHost: 'mail.connectharish.online',
            imapPort: 993,
            imapSecure: true,
            smtpHost: 'mail.connectharish.online',
            smtpPort: 465,
            smtpSecure: true,
          })
        }, 500)
        fetchAccounts()
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('Failed to create account')
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
          username: editingAccount.email,
          password: editingAccount.password || undefined,
          imapHost: editingAccount.imapHost,
          imapPort: editingAccount.imapPort,
          imapSecure: editingAccount.imapSecure,
          smtpHost: editingAccount.smtpHost,
          smtpPort: editingAccount.smtpPort,
          smtpSecure: editingAccount.smtpSecure,
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
        fetchAccounts()
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

  const loadInbox = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch('/api/email-system/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({ accountId: selectedAccount, limit: 50 })
      })
      const data = await res.json()
      if (data.success) setEmails(data.emails)
    } catch (error) {
      console.error(error)
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

  const isUnread = (uid: number) => !readEmails.has(uid)
  const isSent = (email: Email) => email.folder === 'Sent'

  // Apply search and filters
  const filteredEmails = emails.filter(email => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        email.from.toLowerCase().includes(query) ||
        email.to.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.text.toLowerCase().includes(query)
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
    if (filterUnreadOnly && !isUnread(email.uid)) {
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
    const newRead = new Set(readEmails)
    selectedEmails.forEach(id => {
      const uid = parseInt(id.split('-')[0])
      newRead.add(uid)
    })
    setReadEmails(newRead)

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
      setReadEmails(readEmails)
    }

    setSelectedEmails(new Set())
  }

  const bulkMarkAsUnread = async () => {
    if (!selectedAccount || selectedEmails.size === 0) return

    // Optimistic update
    const newRead = new Set(readEmails)
    selectedEmails.forEach(id => {
      const uid = parseInt(id.split('-')[0])
      newRead.delete(uid)
    })
    setReadEmails(newRead)

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
      // Revert
      setReadEmails(readEmails)
    }

    setSelectedEmails(new Set())
  }

  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedEmails.size} selected email(s)?`)) return

    const emailsToDelete = Array.from(selectedEmails)
    const remaining = emails.filter(e => !emailsToDelete.includes(`${e.uid}-${e.folder}`))
    setEmails(remaining)
    toast.success(`Deleted ${selectedEmails.size} email(s)`)
    setSelectedEmails(new Set())
    setBulkMode(false)
  }


  const currentAccount = accounts.find(a => a.id === selectedAccount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight">Emails</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 flex items-center gap-2 bg-[#0B0B0B] text-white font-bold rounded-lg hover:bg-[#1A1A1A] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Account</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-4 py-2 border border-[#E5E7EB] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#F5F5F5] flex items-center gap-2 min-w-[200px] justify-between transition-all duration-200"
                >
                  <span className="truncate text-sm">{currentAccount?.email || 'Select Account'}</span>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                    <div className="dropdown-animate absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden z-20">
                      {accounts.map((acc) => (
                        <div
                          key={acc.id}
                          className={`flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0 ${selectedAccount === acc.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                            } transition-all duration-200`}
                        >
                          <button
                            onClick={() => {
                              setSelectedAccount(acc.id)
                              setSelectedEmail(null)
                              setDropdownOpen(false)
                            }}
                            className="flex-1 text-left"
                          >
                            <div className="font-bold text-sm">{acc.name}</div>
                            <div className="text-xs text-gray-500">{acc.email}</div>
                          </button>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingAccount(acc)
                                setShowEditModal(true)
                                setDropdownOpen(false)
                              }}
                              className="p-2 hover:bg-[#F0F7FF] hover:text-blue-600 rounded transition-all duration-200"
                              title="Edit account"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAccount(acc.id)
                              }}
                              className="p-2 hover:bg-[#FFECEC] hover:text-[#D11A2A] rounded transition-all duration-200"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
          <div className="border-b border-gray-200 flex justify-between items-center">
            <div className="flex">
              <button
                onClick={() => setView('inbox')}
                className={`px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${view === 'inbox' ? 'bg-black text-white border-b-2 border-[#D11A2A]' : 'text-gray-600 hover:bg-[#F5F5F5] border-b-2 border-transparent'
                  }`}
              >
                <Inbox className="w-4 h-4" />
                <span className="hidden sm:inline">Inbox</span> ({emails.length})
              </button>
              <button
                onClick={() => setView('templates')}
                className={`px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${view === 'templates' ? 'bg-black text-white border-b-2 border-[#D11A2A]' : 'text-gray-600 hover:bg-[#F5F5F5] border-b-2 border-transparent'
                  }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
              <button
                onClick={() => openCompose()}
                className="px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 text-gray-600 hover:bg-[#F5F5F5] border-b-2 border-transparent hover:text-black"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Compose</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mr-4">
              {view === 'templates' ? (
                <button
                  onClick={() => {
                    setEditingTemplate(null)
                    setTemplateForm({ name: '', subject: '', bodyText: '', category: 'General', isShared: false })
                    setShowTemplateModal(true)
                  }}
                  className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              ) : (
                <>
                  {bulkMode && selectedEmails.size > 0 ? (
                    <>
                      <span className="text-sm font-bold text-gray-700">{selectedEmails.size} selected</span>
                      <button
                        onClick={bulkMarkAsRead}
                        className="btn-smooth px-4 py-2 flex items-center gap-2 bg-[#E6F7F0] text-[#0F5132] text-sm font-bold rounded-lg hover:brightness-95"
                      >
                        <MailOpen className="w-4 h-4" />
                        Mark Read
                      </button>
                      <button
                        onClick={bulkMarkAsUnread}
                        className="btn-smooth px-4 py-2 flex items-center gap-2 bg-[#E8F0FF] text-[#1E3A8A] text-sm font-bold rounded-lg hover:brightness-95"
                      >
                        <MailX className="w-4 h-4" />
                        Mark Unread
                      </button>
                      <button
                        onClick={bulkDelete}
                        className="btn-smooth px-4 py-2 flex items-center gap-2 bg-[#FFE5E5] text-[#7F1D1D] text-sm font-bold rounded-lg hover:brightness-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={toggleBulkMode}
                        className={`btn-smooth px-4 py-2 flex items-center gap-2 border-2 text-sm font-bold rounded-lg ${bulkMode
                          ? 'border-black bg-[#F2F2F2]'
                          : 'border-[#E5E7EB] hover:border-black'
                          }`}
                      >
                        {bulkMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {bulkMode ? 'Exit Bulk' : 'Select'}
                      </button>
                      <button
                        onClick={() => syncEmails(true)}
                        disabled={syncing}
                        className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-[#0B0B0B] text-white text-sm font-bold rounded-lg hover:bg-[#1A1A1A] disabled:bg-gray-400"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'smooth-spin' : ''}`} />
                        Refresh
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {view === 'inbox' && (
            <>
              <div className="border-b border-gray-border p-4 bg-gray-50">
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search emails (from, to, subject, content)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 font-bold rounded-lg transition-all duration-200 ${showFilters || hasActiveFilters
                      ? 'border-black bg-[#F2F2F2]'
                      : 'border-[#E5E7EB] text-[#1A1A1A] hover:border-black'
                      }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters {hasActiveFilters && `(${[filterFrom, filterSubject, filterFolder !== 'all', filterHasAttachments, filterUnreadOnly].filter(Boolean).length})`}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-[#FFECEC] border-2 border-[#F5B5B5] text-[#D11A2A] font-bold rounded-lg hover:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>

                {showFilters && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-white border border-gray-border rounded-lg animate-slideDown">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-secondary">From</label>
                      <input
                        type="text"
                        placeholder="Filter by sender..."
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-secondary">Subject</label>
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
                )}

                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-secondary">
                    Showing <strong>{filteredEmails.length}</strong> of <strong>{emails.length}</strong> emails
                  </p>
                  <div className="flex items-center gap-2">
                    {bulkMode && filteredEmails.length > 0 && (
                      <>
                        <button
                          onClick={selectAll}
                          className="text-xs px-3 py-1 border border-gray-border rounded-md hover:bg-gray-50 font-bold"
                        >
                          Select All
                        </button>
                        <button
                          onClick={selectNone}
                          className="text-xs px-3 py-1 border border-gray-border rounded-md hover:bg-gray-50 font-bold"
                        >
                          Select None
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-border h-[600px]">
                <div className="overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-secondary">
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
                      const unread = isUnread(email.uid)
                      const sent = isSent(email)

                      return (
                        <div
                          key={`${email.uid}-${email.folder}`}
                          onClick={() => !bulkMode && handleEmailClick(email)}
                          className={`p-4 border-b border-gray-border cursor-pointer relative transition-all duration-200 hover:translate-x-1 ${selectedEmail?.uid === email.uid && selectedEmail?.folder === email.folder ? 'bg-gray-light' : 'hover:bg-gray-light'
                            } ${unread ? 'bg-gray-50' : ''}`}
                        >
                          {unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-text-black"></div>}
                          <div className="flex items-start justify-between gap-2">
                            {bulkMode && (
                              <div className="flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedEmails.has(`${email.uid}-${email.folder}`)}
                                  onChange={() => toggleEmailSelection(`${email.uid}-${email.folder}`)}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate flex items-center gap-2 ${unread ? 'font-black' : 'font-bold'}`}>
                                {sent && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md transition-all duration-200 hover:bg-gray-300">
                                    SENT
                                  </span>
                                )}
                                {email.hasAttachments && (
                                  <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                                )}
                                <span className="truncate">{sent ? email.to : email.from}</span>
                              </div>
                              <div className={`text-sm truncate ${unread ? 'font-bold' : ''}`}>
                                {email.subject || '(No Subject)'}
                              </div>
                              <div className="text-xs text-gray-secondary mt-1">
                                {new Date(email.date).toLocaleString()}
                              </div>
                            </div>
                            {unread && (
                              <div className="w-2.5 h-2.5 rounded-full bg-text-black flex-shrink-0 mt-1 success-check"></div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex flex-col h-full overflow-y-auto">
                  {selectedEmail ? (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                      <div className="border-b border-gray-border p-4 flex gap-2 flex-shrink-0">
                        <button
                          onClick={handleReply}
                          className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-[#0B0B0B] text-white text-sm font-bold rounded-lg hover:bg-[#1A1A1A]"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                        <button
                          onClick={handleDelete}
                          className="btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 border-[#E5E7EB] text-[#1A1A1A] text-sm font-bold rounded-lg hover:bg-[#FFECEC] hover:text-[#D11A2A] hover:border-[#F5B5B5]"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                      <div className="p-6 flex-1 overflow-y-auto">
                        <h2 className="text-xl font-black mb-4">{selectedEmail.subject}</h2>
                        <div className="text-sm mb-4 space-y-1 pb-4 border-b border-gray-border">
                          <div><strong>From:</strong> {selectedEmail.from}</div>
                          <div><strong>To:</strong> {selectedEmail.to}</div>
                          <div><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</div>
                          {selectedEmail.folder && <div><strong>Folder:</strong> {selectedEmail.folder}</div>}
                          {selectedEmail.hasAttachments && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Paperclip className="w-4 h-4" />
                              <strong>Attachments:</strong> {selectedEmail.attachmentCount} file{selectedEmail.attachmentCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {selectedEmail.htmlContent ? (
                          <div
                            className="email-html-content break-words"
                            dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{selectedEmail.text}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-secondary">
                      <div className="text-center">
                        <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Select an email to view</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {view === 'templates' && (
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
                        <div className="font-black text-black text-sm">{tpl.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{tpl.subject || '(No Subject)'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase">{tpl.category || 'General'}</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-2 h-2" /> Used {tpl.usageCount} times
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
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white p-8 rounded-full shadow-2xl animate-in zoom-in duration-500">
            <Check className="w-16 h-16" />
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="modal-animate bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Add New Email Account</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-black transition-all duration-200 hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-sm mb-2">Account Name *</label>
                <input type="text" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="e.g., Sales" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Email Address *</label>
                <input type="email" value={newAccount.email} onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="email@domain.com" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Password *</label>
                <input type="password" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Host</label>
                  <input type="text" value={newAccount.imapHost} onChange={(e) => setNewAccount({ ...newAccount, imapHost: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Port</label>
                  <input type="number" value={newAccount.imapPort} onChange={(e) => setNewAccount({ ...newAccount, imapPort: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Host</label>
                  <input type="text" value={newAccount.smtpHost} onChange={(e) => setNewAccount({ ...newAccount, smtpHost: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Port</label>
                  <input type="number" value={newAccount.smtpPort} onChange={(e) => setNewAccount({ ...newAccount, smtpPort: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={createAccount} disabled={loading} className="btn-smooth flex-1 px-6 py-3 bg-[#0B0B0B] text-white font-bold rounded-xl hover:bg-[#1A1A1A] disabled:bg-gray-400">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button onClick={() => setShowAddModal(false)} className="btn-smooth px-6 py-3 border-2 border-[#E5E7EB] font-bold rounded-xl hover:bg-[#F5F5F5]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-animate bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Edit Email Account</h2>
              <button onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="text-gray-500 hover:text-black transition-all duration-200 hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-sm mb-2">Account Name *</label>
                <input type="text" value={editingAccount.name} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="e.g., Sales" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Email Address *</label>
                <input type="email" value={editingAccount.email} onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="email@domain.com" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Password (leave blank to keep current)</label>
                <input type="password" value={editingAccount.password || ''} onChange={(e) => setEditingAccount({ ...editingAccount, password: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="Enter new password or leave blank" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Host</label>
                  <input type="text" value={editingAccount.imapHost} onChange={(e) => setEditingAccount({ ...editingAccount, imapHost: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Port</label>
                  <input type="number" value={editingAccount.imapPort} onChange={(e) => setEditingAccount({ ...editingAccount, imapPort: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Host</label>
                  <input type="text" value={editingAccount.smtpHost} onChange={(e) => setEditingAccount({ ...editingAccount, smtpHost: e.target.value })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Port</label>
                  <input type="number" value={editingAccount.smtpPort} onChange={(e) => setEditingAccount({ ...editingAccount, smtpPort: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={updateAccount} disabled={loading} className="btn-smooth flex-1 px-6 py-3 bg-[#0B0B0B] text-white font-bold rounded-xl hover:bg-[#1A1A1A] disabled:bg-gray-400">
                  {loading ? 'Updating...' : 'Update Account'}
                </button>
                <button onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="btn-smooth px-6 py-3 border-2 border-[#E5E7EB] font-bold rounded-xl hover:bg-[#F5F5F5]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-zinc-50">
              <h3 className="text-lg font-black text-black uppercase tracking-tight">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Welcome Email"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">Default Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="The subject line of the email"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.isShared}
                      onChange={(e) => setTemplateForm({ ...templateForm, isShared: e.target.checked })}
                      className="w-4 h-4 rounded text-black focus:ring-black"
                    />
                    <span className="text-sm font-bold">Shared with team</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">Email Content</label>
                <textarea
                  value={templateForm.bodyText}
                  onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                  className="w-full h-64 px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium resize-none"
                  placeholder="Write your email content here..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleCreateOrUpdateTemplate}
                className="flex-1 px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-3 border-2 border-zinc-200 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
