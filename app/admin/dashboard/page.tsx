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
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

export default function DashboardOverview() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    todaysBookings: 0,
    pendingVerification: 0,
    confirmedBookings: 0,
    completedSessions: 0,
    outstandingBalances: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
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

        data.forEach(b => {
          const isToday = b.bookingDate === todayStr
          
          if (isToday) todaysBookings++
          if (b.bookingStatus === 'Pending Verification') pendingVerification++
          if (b.bookingStatus === 'Confirmed') confirmedBookings++
          if (b.bookingStatus === 'Completed') completedSessions++
          
          // Calculate payments received for revenue
          const paidPayments = b.paymentHistory || []
          let paidSum = 0
          
          paidPayments.forEach(pay => {
            const isDepositVerified = pay.type === 'Deposit' && ['Confirmed', 'Completed', 'No Show'].includes(b.bookingStatus)
            const isBalancePayment = pay.type === 'Balance Payment'
            
            if (isDepositVerified || isBalancePayment) {
              paidSum += pay.amount
              totalRevenue += pay.amount
            }
          })
          
          // Outstanding balances for Confirmed bookings
          if (b.bookingStatus === 'Confirmed') {
            outstandingBalances += (b.price - paidSum)
          }
        })

        setStats({
          todaysBookings,
          pendingVerification,
          confirmedBookings,
          completedSessions,
          outstandingBalances,
          totalRevenue
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 8000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#0500D0] border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  const kpis = [
    { 
      label: "Today's Bookings", 
      value: stats.todaysBookings, 
      desc: "Sessions scheduled for today", 
      color: "border-blue-500 bg-blue-50/40 text-blue-700",
      icon: Calendar 
    },
    { 
      label: "Pending Verification", 
      value: stats.pendingVerification, 
      desc: "Receipts waiting review", 
      color: "border-amber-500 bg-amber-50/40 text-amber-700",
      icon: Clock,
      link: "/admin/verification"
    },
    { 
      label: "Confirmed Bookings", 
      value: stats.confirmedBookings, 
      desc: "Verified deposits active", 
      color: "border-green-500 bg-green-50/40 text-green-700",
      icon: CheckCircle 
    },
    { 
      label: "Completed Sessions", 
      value: stats.completedSessions, 
      desc: "Total shoots delivered", 
      color: "border-purple-500 bg-purple-50/40 text-purple-700",
      icon: UserCheck 
    },
    { 
      label: "Outstanding Balances", 
      value: `₱${stats.outstandingBalances.toLocaleString()}`, 
      desc: "Sum of remaining in-studio payments", 
      color: "border-rose-500 bg-rose-50/40 text-rose-700",
      icon: DollarSign 
    },
    { 
      label: "Total Revenue", 
      value: `₱${stats.totalRevenue.toLocaleString()}`, 
      desc: "Verified deposit & studio collections", 
      color: "border-emerald-500 bg-emerald-50/40 text-emerald-700",
      icon: TrendingUp 
    },
  ]

  // Filter bookings for today's preview list
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysList = bookings.filter(b => b.bookingDate === todayStr)

  return (
    <div className="space-y-8 font-sans">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Console Dashboard</h1>
          <p className="text-xs text-slate-500">Live operational overview for FICO MANA Studio</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-2 shadow-sm">
          Studio Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          const CardContent = (
            <div className={`p-6 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-default`}>
              <div className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{kpi.value}</h3>
                <p className="text-[11px] text-slate-500 leading-normal">{kpi.desc}</p>
              </div>
            </div>
          )
          
          if (kpi.link) {
            return (
              <Link key={idx} href={kpi.link} className="block group">
                {CardContent}
              </Link>
            )
          }
          return <div key={idx}>{CardContent}</div>
        })}
      </div>

      {/* Row details */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Today's Schedule preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Today's Session Schedule</h4>
            <span className="text-[10px] bg-primary/10 text-[#0500D0] font-bold px-2 py-0.5 rounded-full uppercase">
              {todaysList.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
            {todaysList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No sessions booked for today.
              </div>
            ) : (
              todaysList.map((b) => (
                <div key={b.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">{b.customerName}</p>
                    <p className="text-slate-500 font-mono text-[10px]">Time: {b.bookingTime}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{b.packageName}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      b.bookingStatus === 'Confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : b.bookingStatus === 'Pending Verification'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Revenue Graph mock */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Weekly Revenue Trend</h4>
          </div>

          {/* Simple Tailwind bar chart representation */}
          <div className="h-44 flex items-end justify-between px-4 pb-2 border-b border-slate-200">
            {[
              { day: 'Mon', revenue: 2000, height: 'h-16' },
              { day: 'Tue', revenue: 3500, height: 'h-24' },
              { day: 'Wed', revenue: 1500, height: 'h-12' },
              { day: 'Thu', revenue: 4200, height: 'h-28' },
              { day: 'Fri', revenue: 5000, height: 'h-36' },
              { day: 'Sat', revenue: 8000, height: 'h-40 bg-primary' },
              { day: 'Sun', revenue: 6500, height: 'h-32' },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-8">
                <div className={`w-full rounded-t-sm bg-slate-300 group-hover:bg-[#0500D0] transition-colors relative ${bar.height}`}>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-slate-800 text-white rounded px-1 opacity-0 hover:opacity-100 transition-opacity">
                    ₱{bar.revenue}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Peak day: Saturday</span>
            <Link href="/admin/bookings" className="flex items-center gap-1 text-[#0500D0] font-bold hover:underline">
              View sales ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
