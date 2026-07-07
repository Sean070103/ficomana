'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  LogOut,
  Bell,
  User,
  Menu,
  X,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { getNotifications, getBookings, markNotificationRead, Notification } from '@/lib/data-store'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffUser, setStaffUser] = useState<SupabaseUser | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifDrawer, setShowNotifDrawer] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setStaffUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setStaffUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  useEffect(() => {
    if (!isLoggedIn) return

    const fetchData = async () => {
      const notifs = await getNotifications()
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.isRead).length)

      const bookings = await getBookings()
      setPendingVerifications(bookings.filter((b) => b.bookingStatus === 'Pending Verification').length)
    }

    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [isLoggedIn, pathname])

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setStaffUser(null)
    router.push('/admin')
    router.refresh()
  }

  const staffLabel = staffUser?.email?.split('@')[0] ?? 'Staff'
  const staffInitial = staffLabel.charAt(0).toUpperCase()

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const isLoginPage = pathname === '/admin'

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Verification Queue',
      href: '/admin/verification',
      icon: CheckSquare,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined,
    },
    { label: 'Bookings List', href: '/admin/bookings', icon: Calendar },
    { label: 'System Email Logs', href: '/admin/emails', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 bg-[#0A0A0F] border-r border-white/10 flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="block">
            <h1 className="font-serif text-xl font-bold tracking-tight text-white">FICO MANA</h1>
            <p className="text-[8px] font-medium tracking-[0.25em] text-primary uppercase mt-0.5">Studio Console</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate max-w-[120px]">{staffLabel}</p>
              <p className="text-[9px] text-white/40 truncate max-w-[120px]">{staffUser?.email ?? 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/5 text-white/60 hover:text-white transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#0A0A0F] border-b border-white/10 h-16 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-1.5 hover:bg-white/5 text-white/70"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-white/80 hidden sm:block">
              {navItems.find((n) => n.href === pathname)?.label || 'Console'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifDrawer((prev) => !prev)}
                className="p-2 text-white/60 hover:bg-white/5 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0A0A0F] border border-white/10 shadow-2xl overflow-hidden z-30">
                  <div className="p-3.5 border-b border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">Notifications</span>
                    <span className="text-[10px] text-white/40 font-semibold">{unreadCount} unread</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-white/40">No recent notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs leading-normal flex flex-col gap-1 ${
                            n.isRead ? 'bg-transparent' : 'bg-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          <p className="text-white/80">{n.message}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[9px] text-white/40">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="text-[9px] text-primary font-bold uppercase hover:underline"
                              >
                                Mark read
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

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div className="w-8 h-8 bg-primary/20 border border-primary/30 text-primary font-bold flex items-center justify-center text-xs">
                {staffInitial}
              </div>
              <span className="text-xs font-semibold text-white/70 hidden md:block truncate max-w-[140px]">
                {staffUser?.email ?? 'Staff'}
              </span>
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <nav className="md:hidden bg-[#0A0A0F] border-b border-white/10 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-wider uppercase ${
                    isActive ? 'bg-primary text-white' : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500 text-white">{item.badge}</span>
                  )}
                </Link>
              )
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wider uppercase text-white/60 hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-black">{children}</main>
      </div>
    </div>
  )
}
