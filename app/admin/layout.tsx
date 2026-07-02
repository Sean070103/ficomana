'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Mail, 
  LogOut, 
  Bell, 
  User,
  Menu,
  X
} from 'lucide-react'
import { getNotifications, getBookings, markNotificationRead, Notification } from '@/lib/data-store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifDrawer, setShowNotifDrawer] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Verification pending badge count
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auth Guard
  useEffect(() => {
    const adminSession = localStorage.getItem('ficomana_admin_session')
    
    if (!adminSession && pathname !== '/admin') {
      router.push('/admin')
    } else if (adminSession && pathname === '/admin') {
      router.push('/admin/dashboard')
    }
    
    if (adminSession) {
      setIsLoggedIn(true)
    }
    setLoading(false)
  }, [pathname, router])

  // Fetch badges and notifications periodically
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchData = async () => {
      // 1. Fetch notifications
      const notifs = await getNotifications()
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.isRead).length)

      // 2. Fetch pending verification count
      const bookings = await getBookings()
      const pendingCount = bookings.filter(b => b.bookingStatus === 'Pending Verification').length
      setPendingVerifications(pendingCount)
    }

    fetchData()
    const interval = setInterval(fetchData, 8000) // Poll every 8s for live dashboard updates
    return () => clearInterval(interval)
  }, [isLoggedIn, pathname])

  const handleLogout = () => {
    localStorage.removeItem('ficomana_admin_session')
    setIsLoggedIn(false)
    router.push('/admin')
  }

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  // If login page, don't show admin sidebar/header layout
  if (pathname === '/admin') {
    return <>{children}</>
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { 
      label: 'Verification Queue', 
      href: '/admin/verification', 
      icon: CheckSquare,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined 
    },
    { label: 'Bookings List', href: '/admin/bookings', icon: Calendar },
    { label: 'System Email Logs', href: '/admin/emails', icon: Mail },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex md:w-64 bg-[#0500D0] text-white flex-col flex-shrink-0">
        {/* Brand Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="block">
            <h1 className="font-serif text-xl font-bold tracking-tight text-white">FICO MANA</h1>
            <p className="text-[8px] font-medium tracking-[0.25em] text-white/60 uppercase">Studio Management</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-primary'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-primary text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold">Studio Admin</p>
              <p className="text-[9px] text-white/60">Staff Account</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded text-white/80 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE BAR HEADER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-slate-700 hidden sm:block">
              {navItems.find(n => n.href === pathname)?.label || 'Console'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDrawer(prev => !prev)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-30">
                  <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Notifications</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{unreadCount} Unread</span>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No recent notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs leading-normal flex flex-col gap-1 transition-colors ${
                            n.isRead ? 'bg-white' : 'bg-blue-50/50 hover:bg-blue-50'
                          }`}
                        >
                          <p className="text-slate-700">{n.message}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="text-[9px] text-[#0500D0] font-bold uppercase hover:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-primary/5 text-primary font-bold flex items-center justify-center text-xs">
                A
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden md:block">Studio Admin</span>
            </div>
          </div>
        </header>

        {/* MOBILE MENU NAV */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-[#0500D0] text-white p-4 space-y-2 border-b border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider uppercase ${
                    isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wider uppercase text-white/80 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        )}

        {/* Core Subpages Content rendering */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// Quick inline dummy helper for auth guard loading spinner
function RefreshCw(props: any) {
  return (
    <svg 
      className={`w-6 h-6 animate-spin ${props.className || ''}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  )
}
