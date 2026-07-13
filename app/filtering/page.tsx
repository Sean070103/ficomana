'use client'

import { useEffect, useState } from 'react'
import { getBookings, dismissBookingNotifications, Booking } from '@/lib/data-store'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAdminToast } from '@/components/admin-toast-provider'
import { AdminToastProvider } from '@/components/admin-toast-provider'
import { 
  Check, 
  X, 
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  Image as ImageIcon,
  Clock,
  ChevronRight,
  Lock,
  Mail,
  LogOut,
  Camera
} from 'lucide-react'
import { 
  adminCardHover, 
  adminSelect, 
  adminInput,
  adminSpinner,
  adminSpinnerWrap,
  adminBtnPrimary
} from '@/lib/admin-ui'

type FilteringTab = 'Pending Review' | 'Approved' | 'Rejected' | 'All'

type RawRejectionReason = 'blurry' | 'already_edited' | 'invalid_link' | 'unmatching_booking' | 'other'

const RAW_REJECTION_MESSAGES: Record<RawRejectionReason, string> = {
  blurry: 'The selected photo is blurry or out of focus. Please select a clear, sharp photo.',
  already_edited: 'The selected photo appears to have been edited, cropped, or filtered. We require the original raw photo file for professional editing.',
  invalid_link: 'The Google Drive link provided is invalid, restricted, or empty. Please ensure the link is shared publicly so we can access and download the raw photo.',
  unmatching_booking: 'The photo in the folder does not seem to match your booking details. Please verify your selection.',
  other: 'Other (details provided below)'
}

function FilteringDashboardContent() {
  const toast = useAdminToast()
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [staffEmail, setStaffEmail] = useState('')

  // Queue state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<FilteringTab>('Pending Review')

  // Selected Booking Drawer/Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<RawRejectionReason>('blurry')
  const [customReason, setCustomReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Auth checker
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      if (session?.user?.email) {
        setStaffEmail(session.user.email)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (session?.user?.email) {
        setStaffEmail(session.user.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!isSupabaseConfigured()) {
      setLoginError('Supabase is not configured.')
      return
    }

    setLoginSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setLoginError(
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password.'
            : signInError.message,
        )
        return
      }

      setIsLoggedIn(true)
    } catch {
      setLoginError('Something went wrong. Please try again.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setBookings([])
  }

  const fetchQueue = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await getBookings()
      const filtered = data.filter((b) => !!b.rawPhotoLink)
      setBookings(filtered)
    } catch (err) {
      console.error(err)
      toast.error('Sync failed', 'Could not load raw photo queue from database.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchQueue(true)
    }
  }, [isLoggedIn])

  const handleApprove = async (booking: Booking) => {
    if (!window.confirm(`Approve raw photo selection for ${booking.id}?`)) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/review-raw-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Approve', notes: 'Approved for editing' }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve raw photo.')
      }

      toast.success('Selection Approved', `${booking.id} raw photo selection is approved for editing.`)
      
      try {
        await dismissBookingNotifications(booking.id)
      } catch (err) {
        console.warn('dismissBookingNotifications failed:', err)
      }

      setShowDetailModal(false)
      setSelectedBooking(null)
      fetchQueue(true)
    } catch (err) {
      console.error(err)
      toast.error('Approval failed', err instanceof Error ? err.message : 'Could not update database.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    const reasonText = RAW_REJECTION_MESSAGES[rejectionReason]
    const finalReason = rejectionReason === 'other' ? customReason.trim() : reasonText
    const notesText = rejectionReason === 'other' ? customReason.trim() : `${reasonText} ${customReason.trim()}`.trim()

    if (rejectionReason === 'other' && !customReason.trim()) {
      toast.warning('Reason required', 'Enter a rejection reason for the customer.')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/review-raw-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Reject',
          reason: finalReason,
          notes: notesText,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject raw photo.')
      }

      toast.success('Selection Rejected', `${selectedBooking.id} raw photo selection was rejected. Client notified.`)

      try {
        await dismissBookingNotifications(selectedBooking.id)
      } catch (err) {
        console.warn('dismissBookingNotifications failed:', err)
      }

      setShowRejectModal(false)
      setShowDetailModal(false)
      setSelectedBooking(null)
      setCustomReason('')
      setRejectionReason('blurry')
      fetchQueue(true)
    } catch (err) {
      console.error(err)
      toast.error('Rejection failed', err instanceof Error ? err.message : 'Could not update database.')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter logic
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.packageName && booking.packageName.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    const status = booking.rawPhotoStatus || 'Pending Review'
    if (activeTab === 'Pending Review') return status === 'Pending Review'
    if (activeTab === 'Approved') return status === 'Approved'
    if (activeTab === 'Rejected') return status === 'Rejected'
    return true
  })

  // Get status counters
  const countPending = bookings.filter((b) => (b.rawPhotoStatus || 'Pending Review') === 'Pending Review').length
  const countApproved = bookings.filter((b) => b.rawPhotoStatus === 'Approved').length
  const countRejected = bookings.filter((b) => b.rawPhotoStatus === 'Rejected').length
  const countAll = bookings.length

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  // Render Login Card if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(5,0,208,0.12)_0%,_transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-8 md:p-10 relative z-10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <Camera className="w-6 h-6 text-primary" /> FICO MANA
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase">Filtering Dashboard Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 p-3.5 text-xs font-medium text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@ficomana.studio"
                  className={`${adminInput} pl-11`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${adminInput} pl-11`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className={`w-full py-4 flex items-center justify-center gap-2 ${adminBtnPrimary}`}
            >
              {loginSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                'Login to Filtering Console'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Render Filtering Dashboard if logged in
  return (
    <div className="min-h-screen bg-[#222222] text-white">
      {/* Header Banner */}
      <header className="relative bg-[#222222]/80 backdrop-blur-xl border-b border-white/[0.08] h-16 flex items-center justify-between px-6 md:px-12 z-20">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-lg font-bold tracking-tight text-white">
            FICO MANA <span className="text-[10px] uppercase font-sans tracking-[0.2em] ml-2 text-primary font-bold">Filtering Queue</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50 hidden sm:inline">Signed in as <strong className="text-white/80">{staffEmail}</strong></span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/20 text-xs font-semibold uppercase tracking-wider transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold">Raw Photo Review</h2>
            <p className="text-xs text-white/40 mt-1">Review raw photo selections uploaded by clients. Approve for editing or reject blurry/filtered shots.</p>
          </div>
          <button
            onClick={() => fetchQueue()}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="flex border-b border-white/10 gap-2">
          {(['Pending Review', 'Approved', 'Rejected', 'All'] as FilteringTab[]).map((tab) => {
            const count = 
              tab === 'Pending Review' ? countPending :
              tab === 'Approved' ? countApproved :
              tab === 'Rejected' ? countRejected : countAll
            
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all relative ${
                  isActive
                    ? 'border-primary text-white bg-white/[0.02]'
                    : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : tab === 'Pending Review' && count > 0
                        ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-white/10 text-white/60'
                  }`}>
                    {count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Search filter */}
        <div className="border border-white/10 bg-white/[0.01] p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, email, booking reference ID, package..."
              className={`${adminInput} pl-11`}
            />
          </div>
          <p className="text-[11px] text-white/45 mt-3">
            Showing <span className="font-semibold text-white/70">{filteredBookings.length}</span> of{' '}
            <span className="font-semibold text-white/70">{countAll}</span> total submissions in this view
          </p>
        </div>

        {/* Grid List */}
        {loading && bookings.length === 0 ? (
          <div className={adminSpinnerWrap}>
            <div className={adminSpinner} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.01] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 rounded-full mx-auto mb-4">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">No submissions found</h3>
            <p className="text-xs text-white/40 mt-1">There are no raw photo selections matching your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBookings.map((booking) => {
              const status = booking.rawPhotoStatus || 'Pending Review'
              return (
                <div 
                  key={booking.id} 
                  className={`border border-white/10 bg-white/[0.02] flex flex-col justify-between overflow-hidden ${adminCardHover}`}
                >
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex justify-between items-start border-b border-white/10 pb-3">
                      <div>
                        <h3 className="font-semibold text-white truncate max-w-[150px]">{booking.customerName}</h3>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{booking.id}</p>
                      </div>
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase max-w-[110px] truncate">
                        {booking.packageName}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/40">Shoot Date:</span>
                        <span className="font-semibold text-white/80">{booking.bookingDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Time Slot:</span>
                        <span className="font-semibold text-white/80">{booking.bookingTime}</span>
                      </div>
                      {booking.rawPhotoSubmittedAt && (
                        <div className="flex justify-between items-center text-[11px] pt-1 text-white/50">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted:</span>
                          <span>{new Date(booking.rawPhotoSubmittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>

                    <div className={`mt-3 p-2 text-[11px] border rounded flex items-center gap-2 ${
                      status === 'Approved'
                        ? 'border-green-500/20 bg-green-500/5 text-green-400'
                        : status === 'Rejected'
                          ? 'border-red-500/20 bg-red-500/5 text-red-400'
                          : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                      <span className="font-bold uppercase tracking-wider text-[9px]">{status}</span>
                    </div>

                    {status === 'Rejected' && booking.rawPhotoNotes && (
                      <div className="mt-2 text-[11px] p-2 bg-red-950/20 border border-red-500/10 text-red-200 italic">
                        "{booking.rawPhotoNotes}"
                      </div>
                    )}
                  </div>

                  <div className="bg-white/[0.03] px-5 py-4 border-t border-white/10 space-y-3">
                    <a
                      href={booking.rawPhotoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#0500D0]/10 hover:bg-[#0500D0]/20 border border-[#0500D0]/30 text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
                    >
                      Open Raw Photo Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {status === 'Pending Review' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(booking)}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setRejectionReason('blurry')
                            setShowRejectModal(true)
                          }}
                          disabled={actionLoading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}

                    {(status === 'Approved' || status === 'Rejected') && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowDetailModal(true)
                        }}
                        className="w-full text-center text-white/50 hover:text-white text-[10px] uppercase tracking-wider py-1 font-semibold flex items-center justify-center gap-1 hover:underline"
                      >
                        View Full Details <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* 1. DETAILED VIEW MODAL */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="border border-white/10 bg-[#222222] shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-lg">Raw Photo Details</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Booking Reference: {selectedBooking.id}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedBooking(null)
                }}
                className="p-1 hover:bg-white/[0.05] rounded text-white/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                <div>
                  <p className="text-white/40 font-medium">Customer Name</p>
                  <p className="font-semibold text-white mt-0.5">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <p className="text-white/40 font-medium">Customer Email</p>
                  <p className="font-semibold text-white/90 mt-0.5 break-all">{selectedBooking.customerEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                <div>
                  <p className="text-white/40 font-medium">Package</p>
                  <p className="font-semibold text-primary mt-0.5">{selectedBooking.packageName}</p>
                </div>
                <div>
                  <p className="text-white/40 font-medium">Shoot Date</p>
                  <p className="font-semibold text-white mt-0.5">{selectedBooking.bookingDate} ({selectedBooking.bookingTime})</p>
                </div>
              </div>

              <div>
                <p className="text-white/40 font-medium mb-1.5">Submitted Raw Photo Link</p>
                <a
                  href={selectedBooking.rawPhotoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[#0500D0] hover:underline break-all"
                >
                  {selectedBooking.rawPhotoLink} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="pt-3 border-t border-white/10">
                <p className="text-white/40 font-medium mb-1.5">Review Status</p>
                <div className={`p-3 border rounded text-xs ${
                  selectedBooking.rawPhotoStatus === 'Approved'
                    ? 'border-green-500/20 bg-green-500/5 text-green-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}>
                  <div className="flex gap-2 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[9px]">
                        {selectedBooking.rawPhotoStatus}
                      </p>
                      {selectedBooking.rawPhotoNotes && (
                        <p className="mt-1 text-white/80 italic text-[11px]">
                          "{selectedBooking.rawPhotoNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-4 mt-2">
              {selectedBooking.rawPhotoStatus === 'Rejected' && (
                <button
                  onClick={() => handleApprove(selectedBooking)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve Instead
                </button>
              )}
              {selectedBooking.rawPhotoStatus === 'Approved' && (
                <button
                  onClick={() => {
                    setRejectionReason('blurry')
                    setShowRejectModal(true)
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject Instead
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedBooking(null)
                }}
                className="flex-1 border border-white/10 text-white/90 text-xs font-bold uppercase tracking-wider py-3 hover:bg-white/[0.03]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECT MODAL */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <form
            onSubmit={handleRejectSubmit}
            className="relative border border-white/10 bg-[#222222] shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5"
          >
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white">Reject Raw Photo Selection</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Booking ID: {selectedBooking.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 hover:bg-white/[0.05] rounded text-white/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-200 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Rejecting this photo choice will email the client with the specified reason and a deep link to submit another raw photo link.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value as RawRejectionReason)}
                  className={adminSelect}
                >
                  <option value="blurry">Blurry Photo / Out of Focus</option>
                  <option value="already_edited">Already Edited / Cropped / Filtered</option>
                  <option value="invalid_link">Invalid Drive Link / Access Restricted</option>
                  <option value="unmatching_booking">Does Not Match Booking Session Details</option>
                  <option value="other">Other (Enter custom reason below)</option>
                </select>
                {rejectionReason !== 'other' && (
                  <p className="text-[10px] text-white/40 leading-relaxed mt-2 bg-black/10 p-2 rounded">
                    Client will see: &ldquo;{RAW_REJECTION_MESSAGES[rejectionReason]}&rdquo;
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="customReason" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {rejectionReason === 'other' ? 'Custom Reason Details *' : 'Additional Editor Notes (Optional)'}
                </label>
                <textarea
                  id="customReason"
                  required={rejectionReason === 'other'}
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={rejectionReason === 'other' ? 'Enter detailed reason for rejection so the client knows what was wrong...' : 'Provide additional details or guidance for the client...'}
                  className="w-full bg-black/40 border border-white/10 focus:border-primary focus:outline-none p-3 text-xs font-semibold resize-none text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-white/10 text-white/90 text-xs font-bold uppercase tracking-wider py-3 hover:bg-white/[0.03]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default function RawPhotoFilteringQueue() {
  return (
    <AdminToastProvider>
      <FilteringDashboardContent />
    </AdminToastProvider>
  )
}
