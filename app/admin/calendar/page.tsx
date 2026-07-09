'use client'

import { useEffect, useState } from 'react'
import { getBookings, Booking } from '@/lib/data-store'
import { useOnAdminDbSync } from '@/components/admin-auto-sync'
import { useAdminToast } from '@/components/admin-toast-provider'
import AdminPageHeader from '@/components/admin-page-header'
import AdminBookingCalendar, { AdminDaySessions } from '@/components/admin-booking-calendar'
import { adminPage, adminSpinnerWrap, adminSpinner } from '@/lib/admin-ui'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function AdminCalendarPage() {
  const toast = useAdminToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayKey())

  const fetchBookings = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const data = await getBookings()
      setBookings(data)
    } catch {
      if (!silent) toast.error('Sync failed', 'Could not load bookings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBookings(true)
  }, [])

  useOnAdminDbSync(() => fetchBookings(true))

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
        title="Session Calendar"
        subtitle="Browse dates and see how many bookings are scheduled each day."
        onRefresh={() => fetchBookings()}
        refreshing={refreshing}
      />

      <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-5 items-start max-w-4xl">
        <AdminBookingCalendar
          bookings={bookings}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <AdminDaySessions bookings={bookings} date={selectedDate} />
      </div>
    </div>
  )
}
