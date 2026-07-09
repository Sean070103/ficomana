'use client'

import { useEffect, useState } from 'react'
import { getBookings, Booking } from '@/lib/data-store'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  UserCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { adminPage, adminCard, adminPanel, adminCardHover, adminSpinnerWrap, adminSpinner } from '@/lib/admin-ui'
import AdminBookingSearch from '@/components/admin-booking-search'
import AdminPageHeader from '@/components/admin-page-header'
import { useOnAdminDbSync } from '@/components/admin-auto-sync'
import { useAdminToast } from '@/components/admin-toast-provider'

export default function DashboardOverview() {
  const toast = useAdminToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    todaysBookings: 0,
    pendingVerification: 0,
    confirmedBookings: 0,
    completedSessions: 0,
    outstandingBalances: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await getBookings()
      setBookings(data)

      const todayStr = new Date().toISOString().split('T')[0]

      let todaysBookings = 0
      let pendingVerification = 0
      let confirmedBookings = 0
      let completedSessions = 0
      let outstandingBalances = 0
      let totalRevenue = 0

      data.forEach((b) => {
        if (b.bookingDate === todayStr) todaysBookings++
        if (b.bookingStatus === 'Pending Verification') pendingVerification++
        if (b.bookingStatus === 'Confirmed') confirmedBookings++
        if (b.bookingStatus === 'Completed') completedSessions++

        const paidPayments = b.paymentHistory || []
        let paidSum = 0

        paidPayments.forEach((pay) => {
          const isDepositVerified =
            pay.type === 'Deposit' && ['Confirmed', 'Completed', 'No Show'].includes(b.bookingStatus)
          const isBalancePayment = pay.type === 'Balance Payment'

          if (isDepositVerified || isBalancePayment) {
            paidSum += pay.amount
            totalRevenue += pay.amount
          }
        })

        if (b.bookingStatus === 'Confirmed') {
          outstandingBalances += b.price - paidSum
        }
      })

      setStats({
        todaysBookings,
        pendingVerification,
        confirmedBookings,
        completedSessions,
        outstandingBalances,
        totalRevenue,
      })
    } catch (err) {
      console.error(err)
      if (!silent) toast.error('Sync failed', 'Could not load dashboard data from database.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats(true)
  }, [])

  useOnAdminDbSync(() => fetchStats(true))

  if (loading) {
    return (
      <div className={adminSpinnerWrap}>
        <div className={adminSpinner} />
      </div>
    )
  }

  const kpis = [
    {
      label: "Today's Bookings",
      value: stats.todaysBookings,
      desc: 'Sessions scheduled for today',
      accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      icon: Calendar,
    },
    {
      label: 'Pending Verification',
      value: stats.pendingVerification,
      desc: 'Receipts waiting review',
      accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: Clock,
      link: '/admin/verification',
    },
    {
      label: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      desc: 'Verified deposits active',
      accent: 'text-green-400 border-green-500/30 bg-green-500/10',
      icon: CheckCircle,
    },
    {
      label: 'Completed Sessions',
      value: stats.completedSessions,
      desc: 'Total shoots delivered',
      accent: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      icon: UserCheck,
    },
    {
      label: 'Outstanding Balances',
      value: `₱${stats.outstandingBalances.toLocaleString()}`,
      desc: 'Sum of remaining in-studio payments',
      accent: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      icon: DollarSign,
    },
    {
      label: 'Total Revenue',
      value: `₱${stats.totalRevenue.toLocaleString()}`,
      desc: 'Verified deposit & studio collections',
      accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      icon: TrendingUp,
    },
  ]

  const todayStr = new Date().toISOString().split('T')[0]
  const todaysList = bookings.filter((b) => b.bookingDate === todayStr)

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyRevenue = (() => {
    const totals = Array(7).fill(0)
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      bookings.forEach((b) => {
        ;(b.paymentHistory || []).forEach((pay) => {
          if (pay.date.split('T')[0] === key) totals[6 - i] += pay.amount
        })
      })
    }
    const max = Math.max(...totals, 1)
    return totals.map((revenue, idx) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - idx))
      const heightPct = Math.max(8, Math.round((revenue / max) * 100))
      return {
        day: dayLabels[d.getDay()],
        revenue,
        style: { height: `${heightPct}%` },
      }
    })
  })()
  const peakDay = weeklyRevenue.reduce((best, bar) => (bar.revenue > best.revenue ? bar : best), weeklyRevenue[0])

  return (
    <div className={adminPage}>
      <AdminPageHeader
        title="Console Dashboard"
        subtitle="Live operational overview for FICO MANA Studio"
        onRefresh={() => fetchStats()}
        refreshing={refreshing}
      >
        <div className="text-xs font-semibold text-white/50 border border-white/10 bg-white/[0.02] px-4 py-2.5">
          Studio Date:{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </AdminPageHeader>

      <AdminBookingSearch bookings={bookings} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          const card = (
            <div className={`${adminCard} ${adminCardHover} p-6 flex items-start gap-4`}>
              <div className={`w-12 h-12 flex items-center justify-center border ${kpi.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
                <p className="text-[11px] text-white/50 leading-normal">{kpi.desc}</p>
              </div>
            </div>
          )

          if (kpi.link) {
            return (
              <Link key={idx} href={kpi.link} className="block">
                {card}
              </Link>
            )
          }
          return <div key={idx}>{card}</div>
        })}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 ${adminPanel} p-6 space-y-4`}>
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Today&apos;s Session Schedule</h4>
            <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 uppercase">
              {todaysList.length} Active
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
            {todaysList.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/40">No sessions booked for today.</div>
            ) : (
              todaysList.map((b) => (
                <div key={b.id} className="py-3 flex justify-between items-center text-xs hover:bg-white/[0.02] transition-colors px-1 -mx-1">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{b.customerName}</p>
                    <p className="text-white/40 font-mono text-[10px]">Time: {b.bookingTime}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{b.packageName}</span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                        b.bookingStatus === 'Confirmed'
                          ? 'bg-green-500/15 text-green-400'
                          : b.bookingStatus === 'Pending Verification'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`lg:col-span-5 ${adminPanel} p-6 space-y-4 flex flex-col justify-between`}>
          <div className="border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Weekly Revenue Trend</h4>
          </div>

          <div className="h-44 flex items-end justify-between px-4 pb-2 border-b border-white/10">
            {weeklyRevenue.map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-8 h-full justify-end">
                <div
                  className={`w-full bg-white/20 hover:bg-primary transition-colors ${bar.revenue > 0 && bar.revenue === peakDay.revenue ? '!bg-primary' : ''}`}
                  style={bar.style}
                  title={`₱${bar.revenue.toLocaleString()}`}
                />
                <span className="text-[10px] font-semibold text-white/40">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[11px] text-white/50 pt-1">
            <span>
              {peakDay.revenue > 0 ? `Peak: ${peakDay.day} · ₱${peakDay.revenue.toLocaleString()}` : 'No payments this week'}
            </span>
            <Link href="/admin/bookings" className="flex items-center gap-1 text-primary font-bold hover:underline">
              View sales ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
