'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  PenTool,
  Search,
  Upload,
} from 'lucide-react'
import { getBookings, type Booking } from '@/lib/data-store'
import {
  getRawPhotoWorkflowStatus,
  isRawPhotoWorkflowBooking,
  rawPhotoWorkflowLabel,
  type RawPhotoWorkflowStatus,
} from '@/lib/booking-display'
import { countPendingRawPhotoReviews, hasRawPhotoSubmission } from '@/lib/raw-photo-display'
import { adminCard, adminCardHover, adminEmptyState, adminInput, adminPage, adminPanel, adminSpinner, adminSpinnerWrap, rawPhotoStatusBadge } from '@/lib/admin-ui'
import AdminPageHeader from '@/components/admin-page-header'
import AdminBookingCalendar from '@/components/admin-booking-calendar'
import AdminRawPhotoQueue from '@/components/admin-raw-photo-queue'
import { useOnAdminDbSync } from '@/components/admin-auto-sync'
import { useAdminToast } from '@/components/admin-toast-provider'
import { isPlaceholderCustomerEmail } from '@/lib/customer-email'

export type FilteringDashTab = 'overview' | 'queue' | 'calendar' | 'editor'

type Props = {
  initialSearch?: string
  initialTab?: FilteringDashTab
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function workflowBookings(bookings: Booking[]) {
  return bookings.filter(
    (b) =>
      b.bookingStatus !== 'Cancelled' &&
      (isRawPhotoWorkflowBooking(b) ||
        b.bookingStatus === 'Confirmed' ||
        b.bookingStatus === 'Completed'),
  )
}

export default function FilteringDashboard({ initialSearch = '', initialTab }: Props) {
  const toast = useAdminToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<FilteringDashTab>(
    initialTab || (initialSearch ? 'queue' : 'overview'),
  )
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [editorSearch, setEditorSearch] = useState('')
  const [queueSearch, setQueueSearch] = useState(initialSearch)

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await getBookings()
      setBookings(data)
    } catch (err) {
      console.error(err)
      if (!silent) toast.error('Sync failed', 'Could not load filtering dashboard data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData(true)
  }, [])

  useOnAdminDbSync(() => fetchData(true))

  const pipeline = useMemo(() => {
    const relevant = workflowBookings(bookings)
    const counts: Record<RawPhotoWorkflowStatus, number> = {
      awaiting_gallery: 0,
      awaiting_selection: 0,
      pending_review: 0,
      approved: 0,
      delivered: 0,
      rejected: 0,
    }
    for (const b of relevant) {
      const status = getRawPhotoWorkflowStatus(b)
      if (status) counts[status]++
    }
    return {
      relevant,
      counts,
      pendingReview: countPendingRawPhotoReviews(bookings),
      submitted: bookings.filter(hasRawPhotoSubmission).length,
      awaitingEdit: counts.approved,
    }
  }, [bookings])

  const calendarBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.bookingStatus !== 'Cancelled' &&
          (b.bookingStatus === 'Confirmed' ||
            b.bookingStatus === 'Completed' ||
            hasRawPhotoSubmission(b) ||
            Boolean(b.driveLink) ||
            Boolean(b.editedPhotoLink)),
      ),
    [bookings],
  )

  const dayBookings = useMemo(
    () =>
      calendarBookings
        .filter((b) => b.bookingDate === selectedDate)
        .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime)),
    [calendarBookings, selectedDate],
  )

  const editorQueue = useMemo(() => {
    const approved = bookings
      .filter((b) => b.rawPhotoStatus === 'Approved' && hasRawPhotoSubmission(b))
      .sort((a, b) => {
        // Undelivered first, then newest submitted
        const aDone = a.editedPhotoLink ? 1 : 0
        const bDone = b.editedPhotoLink ? 1 : 0
        if (aDone !== bDone) return aDone - bDone
        const aTime = a.rawPhotoSubmittedAt ? new Date(a.rawPhotoSubmittedAt).getTime() : 0
        const bTime = b.rawPhotoSubmittedAt ? new Date(b.rawPhotoSubmittedAt).getTime() : 0
        return bTime - aTime
      })

    const term = editorSearch.trim().toLowerCase()
    if (!term) return approved
    return approved.filter(
      (b) =>
        b.id.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        b.customerEmail.toLowerCase().includes(term) ||
        (b.packageName || '').toLowerCase().includes(term),
    )
  }, [bookings, editorSearch])

  const tabs: { id: FilteringDashTab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Review Queue', icon: ListChecks, count: pipeline.pendingReview },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'editor', label: 'Editor', icon: PenTool, count: pipeline.awaitingEdit },
  ]

  if (loading) {
    return (
      <div className={adminSpinnerWrap}>
        <div className={adminSpinner} />
      </div>
    )
  }

  return (
    <div className={adminPage}>
      <AdminPageHeader
        title="Filtering Dashboard"
        subtitle="Post-shoot pipeline — gallery links, client 5-pick review, calendar, and editor queue."
        onRefresh={() => fetchData()}
        refreshing={refreshing}
      >
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
        >
          All Bookings <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </AdminPageHeader>

      <div className="flex border-b border-white/10 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'border-primary text-white bg-white/[0.02]'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-primary text-white'
                      : tab.id === 'queue'
                        ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-white/60'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          counts={pipeline.counts}
          pendingReview={pipeline.pendingReview}
          submitted={pipeline.submitted}
          relevant={pipeline.relevant}
          onOpenTab={setActiveTab}
        />
      )}

      {activeTab === 'queue' && (
        <AdminRawPhotoQueue key={queueSearch || 'queue'} initialSearch={queueSearch} embedded />
      )}

      {activeTab === 'calendar' && (
        <div className="grid xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] gap-6 items-start">
          <div className="xl:sticky xl:top-4">
            <AdminBookingCalendar
              bookings={calendarBookings}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
          <FilteringDaySessions
            bookings={dayBookings}
            date={selectedDate}
            onReview={(id) => {
              setQueueSearch(id)
              setActiveTab('queue')
            }}
          />
        </div>
      )}

      {activeTab === 'editor' && (
        <EditorTab
          bookings={editorQueue}
          search={editorSearch}
          onSearchChange={setEditorSearch}
          awaitingEdit={pipeline.awaitingEdit}
          delivered={pipeline.counts.delivered}
          onDelivered={() => fetchData(true)}
        />
      )}
    </div>
  )
}

function OverviewTab({
  counts,
  pendingReview,
  submitted,
  relevant,
  onOpenTab,
}: {
  counts: Record<RawPhotoWorkflowStatus, number>
  pendingReview: number
  submitted: number
  relevant: Booking[]
  onOpenTab: (tab: FilteringDashTab) => void
}) {
  const kpis = [
    {
      label: 'Awaiting Gallery',
      value: counts.awaiting_gallery,
      desc: 'Confirmed — needs Drive gallery link',
      accent: 'text-white/70 border-white/20 bg-white/5',
      icon: Upload,
      tab: 'calendar' as FilteringDashTab,
    },
    {
      label: 'Awaiting Selection',
      value: counts.awaiting_selection,
      desc: 'Gallery sent — waiting on client picks',
      accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      icon: FolderOpen,
      tab: 'calendar' as FilteringDashTab,
    },
    {
      label: 'Pending Review',
      value: pendingReview,
      desc: '5-pick folders waiting for staff',
      accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: Clock,
      tab: 'queue' as FilteringDashTab,
    },
    {
      label: 'Ready for Editor',
      value: counts.approved,
      desc: 'Approved — waiting for edited Drive link',
      accent: 'text-green-400 border-green-500/30 bg-green-500/10',
      icon: PenTool,
      tab: 'editor' as FilteringDashTab,
    },
  ]

  const recentPending = relevant
    .filter((b) => getRawPhotoWorkflowStatus(b) === 'pending_review')
    .sort((a, b) => {
      const aT = a.rawPhotoSubmittedAt ? new Date(a.rawPhotoSubmittedAt).getTime() : 0
      const bT = b.rawPhotoSubmittedAt ? new Date(b.rawPhotoSubmittedAt).getTime() : 0
      return bT - aT
    })
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onOpenTab(kpi.tab)}
              className={`${adminCard} ${adminCardHover} p-5 text-left`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white mt-2 tabular-nums">{kpi.value}</p>
                  <p className="text-[11px] text-white/45 mt-1.5 leading-snug">{kpi.desc}</p>
                </div>
                <div className={`p-2.5 rounded-lg border ${kpi.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className={`${adminPanel} p-5`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Pipeline</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {relevant.length} active booking{relevant.length === 1 ? '' : 's'} · {submitted} submitted
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenTab('queue')}
              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
            >
              Open queue <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {(Object.keys(counts) as RawPhotoWorkflowStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${rawPhotoStatusBadge(status)}`}>
                  {rawPhotoWorkflowLabel(status)}
                </span>
                <span className="text-sm font-semibold text-white tabular-nums">{counts[status]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${adminPanel} flex flex-col`}>
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Needs review</p>
              <p className="text-sm font-semibold text-white mt-0.5">Latest submissions</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenTab('queue')}
              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {recentPending.length === 0 ? (
            <div className={`${adminEmptyState} m-5 border-none bg-transparent flex-1`}>
              <CheckCircle className="w-8 h-8 text-green-400/50" />
              <p className="text-sm text-white/60">No pending reviews</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentPending.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onOpenTab('queue')}
                  className="w-full flex items-center justify-between gap-4 p-4 hover:bg-white/[0.03] text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.customerName}</p>
                    <p className="text-[11px] text-white/40 mt-1">
                      {b.bookingDate} · {b.packageName}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-primary shrink-0">{b.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilteringDaySessions({
  bookings,
  date,
  onReview,
}: {
  bookings: Booking[]
  date: string
  onReview: (bookingId: string) => void
}) {
  const label = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  if (!date) {
    return (
      <div className={`${adminPanel} min-h-[380px] flex flex-col`}>
        <div className={`${adminEmptyState} flex-1 m-5`}>
          <CalendarDays className="w-6 h-6 text-primary/70" />
          <p className="text-sm font-medium text-white/70">Select a date</p>
          <p className="text-xs text-white/40 max-w-xs">
            Pick a shoot day to see booking filtering status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${adminPanel} flex flex-col`}>
      <div className="p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">Filtering by day</p>
          <p className="text-sm font-semibold text-white mt-0.5">{label}</p>
        </div>
        <Link
          href={`/admin/bookings?date=${date}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
        >
          Open bookings <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {bookings.length === 0 ? (
          <div className={`${adminEmptyState} m-5 border-none bg-transparent`}>
            <ImageIcon className="w-5 h-5 text-white/30" />
            <p className="text-sm font-medium text-white/60">No sessions on this date</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {bookings.map((b) => {
              const workflow = getRawPhotoWorkflowStatus(b)
              return (
                <div key={b.id} className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{b.customerName}</p>
                      <p className="text-[11px] text-white/40 mt-1">
                        {b.bookingTime} · {b.packageName}
                      </p>
                      <Link
                        href={`/admin/bookings?search=${encodeURIComponent(b.id)}`}
                        className="font-mono text-[10px] text-primary hover:underline mt-1 inline-block"
                      >
                        {b.id}
                      </Link>
                    </div>
                    {workflow && (
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase border shrink-0 ${rawPhotoStatusBadge(workflow)}`}>
                        {rawPhotoWorkflowLabel(workflow)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/bookings?search=${encodeURIComponent(b.id)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider text-white/70"
                    >
                      Booking
                    </Link>
                    {b.driveLink && (
                      <a
                        href={b.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider text-white/70"
                      >
                        Gallery <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {hasRawPhotoSubmission(b) && (
                      <>
                        <a
                          href={b.rawPhotoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-[9px] font-bold uppercase tracking-wider text-primary"
                        >
                          5 picks <ExternalLink className="w-3 h-3" />
                        </a>
                        {(b.rawPhotoStatus || 'Pending Review') === 'Pending Review' && (
                          <button
                            type="button"
                            onClick={() => onReview(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[9px] font-bold uppercase tracking-wider text-amber-300"
                          >
                            Review
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div className="p-3.5 border-t border-white/[0.08] text-[11px] text-white/40 text-center bg-white/[0.02]">
          {bookings.length} session{bookings.length === 1 ? '' : 's'} · filtering status by booking
        </div>
      )}
    </div>
  )
}

function EditorTab({
  bookings,
  search,
  onSearchChange,
  awaitingEdit,
  delivered,
  onDelivered,
}: {
  bookings: Booking[]
  search: string
  onSearchChange: (value: string) => void
  awaitingEdit: number
  delivered: number
  onDelivered: () => void
}) {
  const toast = useAdminToast()
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({})
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todo' | 'done' | 'all'>('todo')

  const visible = bookings.filter((b) => {
    if (filter === 'todo') return !b.editedPhotoLink
    if (filter === 'done') return Boolean(b.editedPhotoLink)
    return true
  })

  const deliver = async (booking: Booking, sendEmailFlag: boolean) => {
    const link = (linkDrafts[booking.id] ?? booking.editedPhotoLink ?? '').trim()
    const emailDraft = (
      emailDrafts[booking.id] ??
      (isPlaceholderCustomerEmail(booking.customerEmail) ? '' : booking.customerEmail)
    ).trim()

    if (!link) {
      toast.warning('Drive link required', 'Paste the Google Drive folder of the edited photos.')
      return
    }
    if (!link.startsWith('https://drive.google.com/')) {
      toast.warning('Invalid link', 'Use a Google Drive link (https://drive.google.com/...).')
      return
    }
    if (sendEmailFlag) {
      if (!emailDraft || !emailDraft.includes('@') || isPlaceholderCustomerEmail(emailDraft)) {
        toast.warning('Client email required', 'Enter the client email before sending edited photos.')
        return
      }
    }

    setSavingId(booking.id)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/deliver-edited-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedPhotoLink: link,
          sendEmail: sendEmailFlag,
          customerName: booking.customerName,
          customerEmail: emailDraft || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to deliver edited photos.')

      if (Array.isArray(data.emailErrors) && data.emailErrors.length > 0) {
        toast.warning('Saved — email issue', data.emailErrors.join(' · '))
      } else if (sendEmailFlag) {
        toast.success('Edited photos delivered', `${booking.id} emailed to ${emailDraft}.`)
      } else {
        toast.success('Link saved', `${booking.id} edited Drive link saved (no email).`)
      }
      onDelivered()
    } catch (err) {
      toast.error('Delivery failed', err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className={`${adminCard} p-4 space-y-3`}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search approved bookings by name, email, or ID…"
            className={`${adminInput} pl-11`}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-white/45">
            <span className="font-semibold text-amber-300">{awaitingEdit}</span> need edited link ·{' '}
            <span className="font-semibold text-emerald-300">{delivered}</span> delivered
          </p>
          <div className="flex gap-1">
            {(
              [
                ['todo', 'To edit'],
                ['done', 'Delivered'],
                ['all', 'All'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  filter === id
                    ? 'border-primary/40 bg-primary/15 text-white'
                    : 'border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${adminEmptyState} p-16`}>
          <PenTool className="w-7 h-7 text-white/30" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {filter === 'todo' ? 'No jobs waiting' : 'Nothing here'}
          </h3>
          <p className="text-xs text-white/40 max-w-md">
            After editing, paste the Google Drive link of the finished photos and email the client.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((b) => {
            const deliveredAlready = Boolean(b.editedPhotoLink)
            const draft = linkDrafts[b.id] ?? b.editedPhotoLink ?? ''
            const busy = savingId === b.id

            return (
              <div key={b.id} className={`${adminCard} ${adminCardHover} p-5 space-y-4`}>
                <div className="flex justify-between items-start gap-3 border-b border-white/10 pb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{b.customerName}</h3>
                    <Link
                      href={`/admin/bookings?search=${encodeURIComponent(b.id)}`}
                      className="text-[10px] text-primary font-mono mt-0.5 hover:underline"
                    >
                      {b.id}
                    </Link>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 uppercase shrink-0 border ${
                      deliveredAlready
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-green-500/15 text-green-400 border-green-500/30'
                    }`}
                  >
                    {deliveredAlready ? 'Delivered' : 'Ready to edit'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-white/40">Shoot</span>
                    <span className="text-white/80 text-right">
                      {b.bookingDate} · {b.bookingTime}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-white/40">Package</span>
                    <span className="text-white/80 text-right">{b.packageName}</span>
                  </div>
                  {b.customerEmail && !b.customerEmail.includes('imported@') && (
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Email</span>
                      <span className="text-white/70 text-right truncate max-w-[180px]">
                        {b.customerEmail}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={b.rawPhotoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Open 5-pick folder <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {b.driveLink && (
                    <a
                      href={b.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Full gallery <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="text-[10px] font-bold tracking-widest text-white/45 uppercase">
                    Client email (for delivery)
                  </label>
                  <input
                    type="email"
                    value={
                      emailDrafts[b.id] ??
                      (isPlaceholderCustomerEmail(b.customerEmail) ? '' : b.customerEmail)
                    }
                    onChange={(e) =>
                      setEmailDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))
                    }
                    placeholder="client@email.com"
                    className={adminInput}
                  />

                  <label className="text-[10px] font-bold tracking-widest text-white/45 uppercase">
                    Edited photos Drive link
                  </label>
                  <input
                    type="url"
                    value={draft}
                    onChange={(e) =>
                      setLinkDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))
                    }
                    placeholder="https://drive.google.com/drive/folders/..."
                    className={adminInput}
                  />
                  <p className="text-[10px] text-white/40">
                    Share the folder as Anyone with the link (Viewer), then send to the client.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deliver(b, true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : deliveredAlready ? 'Update & Re-email Client' : 'Save & Email Client'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deliver(b, false)}
                      className="w-full border border-white/15 text-white/60 hover:text-white hover:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider py-2 disabled:opacity-50"
                    >
                      Save link only
                    </button>
                  </div>
                  {b.editedPhotoLink && (
                    <a
                      href={b.editedPhotoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-300 hover:underline pt-1"
                    >
                      Open delivered folder <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
