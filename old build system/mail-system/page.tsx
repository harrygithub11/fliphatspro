'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Send, RefreshCw, Inbox, Edit, Trash2, Reply, Plus, X, Check, Paperclip, FileText, Save, Clock, PenTool, Search, Filter, XCircle, CheckSquare, Square, MailOpen, MailX, Settings } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { toast } from '@/components/toast'
import RichTextEditor from '@/components/admin/RichTextEditor'
import AttachmentUpload, { Attachment } from '@/components/admin/AttachmentUpload'

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
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [readEmails, setReadEmails] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [view, setView] = useState<'inbox' | 'compose'>('inbox')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [useRichText, setUseRichText] = useState(true)
  
  // Draft management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<any[]>([])
  const [showDrafts, setShowDrafts] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  
  // Signature management
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [signatureHtml, setSignatureHtml] = useState('')
  const [useSignature, setUseSignature] = useState(false)
  const [signatureRichText, setSignatureRichText] = useState(false)
  
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
  
  
  // Templates
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('')
  
  
  
  // Rules & Analytics
  const [showRulesManager, setShowRulesManager] = useState(false)
  const [rules, setRules] = useState<any[]>([])

  const [newAccount, setNewAccount] = useState({
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
  
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    
    fetchAccounts()
  }, [router])

  useEffect(() => {
    if (!selectedAccount) return
    
    loadInbox()
    fetchDrafts()
    loadAccountSignature(selectedAccount)
    loadReadStatus(selectedAccount)
    fetchTemplates()
    const interval = setInterval(() => {
      syncEmails(false)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [selectedAccount])

  // Auto-save draft every 30 seconds when composing
  useEffect(() => {
    if (view !== 'compose' || !selectedAccount) return
    
    const autoSaveInterval = setInterval(() => {
      saveDraft(true) // silent save
    }, 30000) // 30 seconds
    
    return () => clearInterval(autoSaveInterval)
  }, [view, selectedAccount, to, subject, body, htmlBody, attachments])

  // Save draft on tab close / page unload
  useEffect(() => {
    if (view !== 'compose') return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (to || subject || body || htmlBody) {
        saveDraft(true)
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [view, to, subject, body, htmlBody])

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
    setTo(selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from)
    setSubject('Re: ' + selectedEmail.subject)
    const replyText = `\n\nOn ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from} wrote:\n> ${selectedEmail.text.split('\n').join('\n> ')}`
    setBody(replyText)
    setHtmlBody(`<br><br><p>On ${new Date(selectedEmail.date).toLocaleString()}, <strong>${selectedEmail.from}</strong> wrote:</p><blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">${selectedEmail.htmlContent || selectedEmail.text.replace(/\n/g, '<br>')}</blockquote>`)
    setAttachments([])
    setView('compose')
  }

  const handleDelete = async () => {
    if (!selectedEmail) return
    if (!confirm('Delete this email?')) return
    toast.success('Email deleted')
    setEmails(emails.filter(e => e.uid !== selectedEmail.uid))
    setSelectedEmail(null)
  }

  const sendEmail = async () => {
    if (!to || !subject) {
      toast.error('Please fill To and Subject')
      return
    }
    setLoading(true)
    try {
      // Append signature if enabled
      const finalHtmlBody = useRichText ? appendSignature(htmlBody, true) : appendSignature(`<p>${body.replace(/\n/g, '<br>')}</p>`, true)
      const finalTextBody = useRichText ? finalHtmlBody.replace(/<[^>]*>/g, '') : appendSignature(body, false)
      
      const res = await fetch('/api/email-system/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          to, 
          subject, 
          text: finalTextBody,
          html: finalHtmlBody,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        // Delete draft after successful send
        if (currentDraftId) {
          await deleteDraft(currentDraftId)
        }
        
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        toast.success('Email sent successfully')
        setTimeout(() => {
          setTo(''); setSubject(''); setBody(''); setHtmlBody('')
          setAttachments([])
          setCurrentDraftId(null)
          setView('inbox')
          // Reload inbox immediately to show sent email
          loadInbox()
          fetchDrafts()
        }, 800)
      } else {
        // Display actual error details
        const errorMsg = data.details || data.error || 'Failed to send email'
        console.error('[SEND_ERROR]', data)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to send email'
      console.error('[SEND_EXCEPTION]', error)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
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

  const saveDraft = async (silent = false) => {
    if (!selectedAccount) return
    
    // Don't save if completely empty
    const isEmpty = !to && !subject && !body && !htmlBody
    if (isEmpty) {
      setAutoSaveStatus('idle')
      return
    }

    try {
      if (!silent) setAutoSaveStatus('saving')
      
      const res = await fetch('/api/email-system/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          id: currentDraftId,
          accountId: selectedAccount,
          to,
          subject,
          body,
          htmlBody,
          hasAttachments: attachments.length > 0,
        })
      })
      const data = await res.json()
      
      if (data.success && data.draft) {
        setCurrentDraftId(data.draft.id)
        setAutoSaveStatus('saved')
        if (!silent) toast.success('Draft saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }
    } catch (error) {
      setAutoSaveStatus('idle')
      if (!silent) toast.error('Failed to save draft')
    }
  }

  const loadDraft = (draft: any) => {
    setTo(draft.to || '')
    setSubject(draft.subject || '')
    setBody(draft.body || '')
    setHtmlBody(draft.htmlBody || '')
    setCurrentDraftId(draft.id)
    setShowDrafts(false)
    setView('compose')
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

  const loadAccountSignature = async (accountId: string) => {
    try {
      const res = await fetch(`/api/email-system/accounts/${accountId}`, {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success && data.account) {
        setSignatureText(data.account.signature || '')
        setSignatureHtml(data.account.signatureHtml || '')
        setUseSignature(data.account.useSignature || false)
      }
    } catch (error) {
      console.error('Failed to load signature:', error)
    }
  }

  const saveSignature = async () => {
    if (!selectedAccount) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/email-system/accounts/${selectedAccount}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          signature: signatureText,
          signatureHtml: signatureHtml,
          useSignature: useSignature,
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Signature saved')
        setShowSignatureModal(false)
      } else {
        toast.error('Failed to save signature')
      }
    } catch (error) {
      toast.error('Failed to save signature')
    } finally {
      setLoading(false)
    }
  }

  const appendSignature = (bodyContent: string, isHtml: boolean) => {
    if (!useSignature) return bodyContent
    
    if (isHtml && signatureHtml) {
      return `${bodyContent}<br><br><div class="signature">--<br>${signatureHtml}</div>`
    } else if (!isHtml && signatureText) {
      return `${bodyContent}\n\n--\n${signatureText}`
    }
    return bodyContent
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


  // Template management functions
  const fetchTemplates = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/email-system/templates?accountId=${selectedAccount}`, {
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const saveAsTemplate = async () => {
    if (!selectedAccount || !newTemplateName.trim()) {
      toast.error('Template name required')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/email-system/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          name: newTemplateName.trim(),
          subject,
          bodyText: body,
          htmlBody: useRichText ? htmlBody : null,
          category: newTemplateCategory || null,
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Template saved')
        setNewTemplateName('')
        setNewTemplateCategory('')
        fetchTemplates()
        setShowTemplateManager(false)
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = async (template: any) => {
    setSubject(template.subject || '')
    if (template.htmlBody) {
      setUseRichText(true)
      setHtmlBody(template.htmlBody)
    } else {
      setUseRichText(false)
      setBody(template.body || '')
    }
    setShowTemplates(false)
    
    // Update usage count
    try {
      await fetch('/api/email-system/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YWRtaW4='
        },
        body: JSON.stringify({ templateId: template.id })
      })
    } catch (error) {
      console.error('Failed to update template usage')
    }
    
    toast.success('Template loaded')
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return
    
    try {
      const res = await fetch(`/api/email-system/templates?templateId=${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer YWRtaW4=' }
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Template deleted')
        fetchTemplates()
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }



  const currentAccount = accounts.find(a => a.id === selectedAccount)
  const unreadCount = emails.filter(e => isUnread(e.uid)).length

  return (
    <AdminLayout>
      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .btn-smooth {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-smooth:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn-smooth:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .email-item:hover {
          transform: translateX(4px);
        }
        .dropdown-animate {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modal-animate {
          animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .success-check {
          animation: pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .smooth-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .email-html-content {
          line-height: 1.6;
          color: #333;
        }
        .email-html-content img {
          max-width: 100%;
          height: auto;
        }
        .email-html-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .email-html-content a:hover {
          color: #1d4ed8;
        }
        .email-html-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .email-html-content table td,
        .email-html-content table th {
          padding: 8px;
          border: 1px solid #e5e7eb;
        }
        .email-html-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Modern Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">Emails</h1>
                <p className="text-sm text-gray-600 mt-0.5">Enterprise Email Management</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 flex items-center gap-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Account</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 flex items-center gap-2 min-w-[200px] justify-between transition-all duration-200"
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
                            className={`flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                              selectedAccount === acc.id ? 'bg-gray-100' : 'hover:bg-gray-50'
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
                                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded transition-all duration-200"
                                title="Edit account"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`Delete account "${acc.name}"? This cannot be undone.`)) {
                                    deleteAccount(acc.id)
                                  }
                                  setDropdownOpen(false)
                                }}
                                className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-all duration-200"
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

        {/* Stats Cards */}
        <div className="px-6 py-6">
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Inbox, label: 'Total Emails', value: emails.length },
            { icon: Mail, label: 'Unread', value: unreadCount },
            { icon: RefreshCw, label: 'Auto-Sync', value: 'Every 10s' }
          ].map((stat, idx) => (
            <div 
              key={stat.label} 
              className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover-lift"
              style={{ animation: `slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 100}ms both` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-bold tracking-wider uppercase text-gray-500">{stat.label}</span>
              </div>
              <div className="text-3xl font-black text-black">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
          <div className="border-b border-gray-200 flex justify-between items-center">
            <div className="flex">
              <button
                onClick={() => setView('inbox')}
                className={`px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                  view === 'inbox' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span className="hidden sm:inline">Inbox</span> ({emails.length})
              </button>
              <button
                onClick={() => setView('compose')}
                className={`px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                  view === 'compose' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Compose</span>
              </button>
              <button
                onClick={() => setShowDrafts(!showDrafts)}
                className={`px-6 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 relative ${
                  showDrafts ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Drafts
                {drafts.length > 0 && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {drafts.length}
                  </span>
                )}
              </button>
            </div>
            
            {view === 'inbox' && (
              <div className="flex items-center gap-2 mr-4">
                {bulkMode && selectedEmails.size > 0 ? (
                  <>
                    <span className="text-sm font-bold text-gray-700">{selectedEmails.size} selected</span>
                    <button
                      onClick={bulkMarkAsRead}
                      className="btn-smooth px-4 py-2 flex items-center gap-2 bg-green-50 border-2 border-green-200 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100"
                    >
                      <MailOpen className="w-4 h-4" />
                      Mark Read
                    </button>
                    <button
                      onClick={bulkMarkAsUnread}
                      className="btn-smooth px-4 py-2 flex items-center gap-2 bg-blue-50 border-2 border-blue-200 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-100"
                    >
                      <MailX className="w-4 h-4" />
                      Mark Unread
                    </button>
                    <button
                      onClick={bulkDelete}
                      className="btn-smooth px-4 py-2 flex items-center gap-2 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={toggleBulkMode}
                      className={`btn-smooth px-4 py-2 flex items-center gap-2 border-2 text-sm font-bold rounded-lg ${
                        bulkMode
                          ? 'border-text-black bg-gray-100'
                          : 'border-gray-border hover:border-text-black'
                      }`}
                    >
                      {bulkMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {bulkMode ? 'Exit Bulk' : 'Select'}
                    </button>
                    <button
                      onClick={() => syncEmails(true)}
                      disabled={syncing}
                      className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-text-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'smooth-spin' : ''}`} />
                      Refresh
                    </button>
                  </>
                )}
              </div>
            )}
            
            {view === 'compose' && (
              <div className="flex items-center gap-3 mr-4">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="btn-smooth px-4 py-2 flex items-center gap-2 border-2 border-gray-border text-text-black text-sm font-bold rounded-lg hover:border-text-black hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4" />
                  Templates ({templates.length})
                </button>
                {autoSaveStatus !== 'idle' && (
                  <span className="text-xs flex items-center gap-1.5 text-gray-600">
                    {autoSaveStatus === 'saving' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        Saved
                      </>
                    )}
                  </span>
                )}
                <button
                  onClick={() => saveDraft(false)}
                  disabled={loading}
                  className="btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 border-gray-border text-text-black text-sm font-bold rounded-lg hover:border-text-black hover:bg-gray-50"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className={`btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 text-sm font-bold rounded-lg ${
                    useSignature ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-border text-text-black hover:border-text-black hover:bg-gray-50'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Signature {useSignature && '✓'}
                </button>
              </div>
            )}
          </div>

          {showDrafts && (
            <div className="border-b border-gray-border bg-gray-50 p-4">
              <div className="max-w-4xl">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Saved Drafts ({drafts.length})
                </h3>
                {drafts.length === 0 ? (
                  <p className="text-sm text-gray-secondary">No saved drafts</p>
                ) : (
                  <div className="space-y-2">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="bg-white border border-gray-border rounded-lg p-3 hover:border-text-black transition-all duration-200 cursor-pointer group"
                        onClick={() => loadDraft(draft)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {draft.to && (
                                <span className="text-sm font-bold truncate">
                                  To: {draft.to}
                                </span>
                              )}
                              {currentDraftId === draft.id && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-700 truncate">
                              {draft.subject || '(No Subject)'}
                            </div>
                            <div className="text-xs text-gray-secondary mt-1">
                              Last updated: {new Date(draft.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Delete this draft?')) {
                                deleteDraft(draft.id)
                              }
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 font-bold rounded-lg transition-all duration-200 ${
                      showFilters || hasActiveFilters
                        ? 'border-text-black bg-gray-100'
                        : 'border-gray-border hover:border-text-black'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters {hasActiveFilters && `(${[filterFrom, filterSubject, filterFolder !== 'all', filterHasAttachments, filterUnreadOnly].filter(Boolean).length})`}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-100"
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
                        className="w-full px-3 py-2 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-gray-secondary">Folder</label>
                      <select
                        value={filterFolder}
                        onChange={(e) => setFilterFolder(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black text-sm"
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
                    {hasActiveFilters && (
                      <p className="text-xs text-blue-600 font-bold">
                        {emails.length - filteredEmails.length} hidden
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-border h-[600px]">
                <div className="overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-secondary">
                    <div className="text-center" style={{ animation: 'fadeIn 0.5s' }}>
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
                  filteredEmails.map((email, idx) => {
                    const unread = isUnread(email.uid)
                    const sent = isSent(email)
                    
                    return (
                      <div
                        key={`${email.uid}-${email.folder}`}
                        onClick={() => !bulkMode && handleEmailClick(email)}
                        className={`email-item p-4 border-b border-gray-border cursor-pointer relative ${
                          selectedEmail?.uid === email.uid && selectedEmail?.folder === email.folder ? 'bg-gray-light' : 'hover:bg-gray-light'
                        } ${unread ? 'bg-gray-50' : ''}`}
                        style={{ animation: `slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 30}ms both` }}
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
                  <div style={{ animation: 'fadeIn 0.3s' }} className="flex flex-col h-full">
                    <div className="border-b border-gray-border p-4 flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleReply}
                        className="btn-smooth px-5 py-2.5 flex items-center gap-2 bg-text-black text-white text-sm font-bold rounded-lg hover:bg-gray-800"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                      <button
                        onClick={handleDelete}
                        className="btn-smooth px-5 py-2.5 flex items-center gap-2 border-2 border-gray-border text-text-black text-sm font-bold rounded-lg hover:border-red-500 hover:bg-red-50 hover:text-red-600"
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
                          className="email-html-content"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{selectedEmail.text}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-secondary">
                    <div className="text-center" style={{ animation: 'fadeIn 0.5s' }}>
                      <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Select an email to view</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {view === 'compose' && (
            <div className="p-6" style={{ animation: 'fadeIn 0.3s' }}>
              <div className="max-w-3xl space-y-4">
                <div>
                  <label className="block font-bold text-sm tracking-wider uppercase text-gray-secondary mb-2">From</label>
                  <input type="text" value={currentAccount?.email || ''} disabled className="w-full px-4 py-3 border border-gray-border bg-gray-50 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-sm tracking-wider uppercase text-gray-secondary mb-2">To</label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black focus:border-transparent transition-all duration-200"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm tracking-wider uppercase text-gray-secondary mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-sm tracking-wider uppercase text-gray-secondary">Message</label>
                    <button
                      onClick={() => setUseRichText(!useRichText)}
                      className="text-xs px-3 py-1 border border-gray-border rounded-md hover:bg-gray-50 transition-colors duration-200"
                    >
                      {useRichText ? 'Switch to Plain Text' : 'Switch to Rich Text'}
                    </button>
                  </div>
                  {useRichText ? (
                    <RichTextEditor
                      value={htmlBody}
                      onChange={setHtmlBody}
                      placeholder="Write your message..."
                      height="350px"
                    />
                  ) : (
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black focus:border-transparent h-80 transition-all duration-200"
                      placeholder="Write your message..."
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-sm tracking-wider uppercase text-gray-secondary mb-2">Attachments</label>
                  <AttachmentUpload
                    attachments={attachments}
                    onChange={setAttachments}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={sendEmail}
                    disabled={loading}
                    className="btn-smooth px-8 py-3 bg-text-black text-white font-bold tracking-wider uppercase hover:bg-gray-800 disabled:bg-gray-300 flex items-center gap-2 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    onClick={() => {
                      if (to || subject || (useRichText ? htmlBody : body) || attachments.length > 0) {
                        if (confirm('Discard draft?')) {
                          setTo(''); setSubject(''); setBody(''); setHtmlBody('')
                          setAttachments([])
                          setCurrentDraftId(null)
                          setView('inbox')
                        }
                      } else {
                        setCurrentDraftId(null)
                        setView('inbox')
                      }
                    }}
                    className="btn-smooth px-8 py-3 border-2 border-gray-300 font-bold tracking-wider uppercase hover:bg-gray-50 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="success-check bg-green-500 text-white p-8 rounded-full shadow-2xl" style={{ animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <Check className="w-16 h-16" />
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ animation: 'fadeIn 0.2s' }}>
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
                <input type="text" value={newAccount.name} onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="e.g., Sales" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Email Address *</label>
                <input type="email" value={newAccount.email} onChange={(e) => setNewAccount({...newAccount, email: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="email@domain.com" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Password *</label>
                <input type="password" value={newAccount.password} onChange={(e) => setNewAccount({...newAccount, password: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Host</label>
                  <input type="text" value={newAccount.imapHost} onChange={(e) => setNewAccount({...newAccount, imapHost: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Port</label>
                  <input type="number" value={newAccount.imapPort} onChange={(e) => setNewAccount({...newAccount, imapPort: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Host</label>
                  <input type="text" value={newAccount.smtpHost} onChange={(e) => setNewAccount({...newAccount, smtpHost: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Port</label>
                  <input type="number" value={newAccount.smtpPort} onChange={(e) => setNewAccount({...newAccount, smtpPort: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={createAccount} disabled={loading} className="btn-smooth flex-1 px-6 py-3 bg-text-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-400">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button onClick={() => setShowAddModal(false)} className="btn-smooth px-6 py-3 border-2 border-gray-300 font-bold rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ animation: 'fadeIn 0.2s' }}>
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
                <input type="text" value={editingAccount.name} onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="e.g., Sales" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Email Address *</label>
                <input type="email" value={editingAccount.email} onChange={(e) => setEditingAccount({...editingAccount, email: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="email@domain.com" />
              </div>
              <div>
                <label className="block font-bold text-sm mb-2">Password (leave blank to keep current)</label>
                <input type="password" value={editingAccount.password || ''} onChange={(e) => setEditingAccount({...editingAccount, password: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" placeholder="Enter new password or leave blank" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Host</label>
                  <input type="text" value={editingAccount.imapHost} onChange={(e) => setEditingAccount({...editingAccount, imapHost: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">IMAP Port</label>
                  <input type="number" value={editingAccount.imapPort} onChange={(e) => setEditingAccount({...editingAccount, imapPort: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Host</label>
                  <input type="text" value={editingAccount.smtpHost} onChange={(e) => setEditingAccount({...editingAccount, smtpHost: e.target.value})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-2">SMTP Port</label>
                  <input type="number" value={editingAccount.smtpPort} onChange={(e) => setEditingAccount({...editingAccount, smtpPort: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black transition-all duration-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={updateAccount} disabled={loading} className="btn-smooth flex-1 px-6 py-3 bg-text-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-400">
                  {loading ? 'Updating...' : 'Update Account'}
                </button>
                <button onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="btn-smooth px-6 py-3 border-2 border-gray-300 font-bold rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ animation: 'fadeIn 0.2s' }}>
          <div className="modal-animate bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Email Signature</h2>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-500 hover:text-black transition-all duration-200 hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={useSignature}
                  onChange={(e) => setUseSignature(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label className="font-bold text-sm">
                  Auto-append signature to outgoing emails
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-sm">Signature</label>
                  <button
                    onClick={() => setSignatureRichText(!signatureRichText)}
                    className="text-xs px-3 py-1 border border-gray-border rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    {signatureRichText ? 'Switch to Plain Text' : 'Switch to Rich Text'}
                  </button>
                </div>

                {signatureRichText ? (
                  <RichTextEditor
                    value={signatureHtml}
                    onChange={setSignatureHtml}
                    placeholder="Your signature here (e.g., name, title, contact info)..."
                    height="250px"
                  />
                ) : (
                  <textarea
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black h-48 transition-all duration-200"
                    placeholder="Your signature here (e.g., name, title, contact info)..."
                  />
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-border rounded-lg">
                <p className="text-sm font-bold mb-2">Preview:</p>
                <div className="text-sm text-gray-700 border-t border-gray-300 pt-2 mt-2">
                  --
                  {signatureRichText && signatureHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{signatureText || '(Empty signature)'}</div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={saveSignature} 
                  disabled={loading} 
                  className="btn-smooth flex-1 px-6 py-3 bg-text-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Save Signature'}
                </button>
                <button 
                  onClick={() => setShowSignatureModal(false)} 
                  className="btn-smooth px-6 py-3 border-2 border-gray-300 font-bold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Template Selector Dropdown */}
      {showTemplates && view === 'compose' && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-end z-40" onClick={() => setShowTemplates(false)}>
          <div className="mt-20 mr-8 bg-white rounded-xl shadow-2xl border border-gray-border p-4 w-96 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Load Template</h3>
              <button onClick={() => setShowTemplateManager(true)} className="text-sm text-blue-600 hover:underline">
                Manage
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-secondary">No templates yet.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="w-full text-left p-3 border border-gray-border rounded-lg hover:border-text-black transition-all duration-200"
                  >
                    <div className="font-bold">{template.name}</div>
                    {template.subject && <div className="text-sm text-gray-600 truncate">{template.subject}</div>}
                    <div className="text-xs text-gray-secondary mt-1 flex items-center gap-2">
                      {template.category && <span className="px-2 py-0.5 bg-gray-100 rounded">{template.category}</span>}
                      <span>Used {template.usageCount || 0} times</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ animation: 'fadeIn 0.2s' }}>
          <div className="modal-animate bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Manage Templates</h2>
              <button onClick={() => setShowTemplateManager(false)} className="text-gray-500 hover:text-black transition-all duration-200 hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Save Current as Template */}
            {view === 'compose' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold mb-3">Save Current Email as Template</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-secondary">Template Name</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Welcome Email"
                      className="w-full px-3 py-2 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-gray-secondary">Category (Optional)</label>
                    <input
                      type="text"
                      value={newTemplateCategory}
                      onChange={(e) => setNewTemplateCategory(e.target.value)}
                      placeholder="e.g., Support"
                      className="w-full px-3 py-2 border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-text-black"
                    />
                  </div>
                </div>
                <button
                  onClick={saveAsTemplate}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Save as Template'}
                </button>
              </div>
            )}

            {/* Templates List */}
            <div>
              <h3 className="font-bold mb-3">Your Templates ({templates.length})</h3>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-secondary">No templates created yet.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between p-4 border border-gray-border rounded-lg hover:border-text-black transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="font-bold">{template.name}</div>
                        {template.subject && <div className="text-sm text-gray-600">{template.subject}</div>}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-secondary">
                          {template.category && <span className="px-2 py-1 bg-gray-100 rounded">{template.category}</span>}
                          <span>Used {template.usageCount || 0} times</span>
                          {template.lastUsed && <span>Last: {new Date(template.lastUsed).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {view === 'compose' && (
                          <button
                            onClick={() => {
                              loadTemplate(template)
                              setShowTemplateManager(false)
                            }}
                            className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </AdminLayout>
  )
}

