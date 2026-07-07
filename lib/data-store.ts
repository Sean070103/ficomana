import type { BookingPackage } from './booking-packages'
import { bookingPackages } from './booking-packages'

export interface PaymentRecord {
  id: string
  amount: number
  method: 'GCash' | 'Cash' | 'Card' | 'Maya' | 'Bank Transfer' | 'BPI'
  type: 'Deposit' | 'Balance Payment'
  transactionRef?: string
  date: string
}

export interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerFbLink: string
  customerFbName: string
  packageId: string
  packageName: string
  bookingDate: string
  bookingTime: string
  slotId?: string
  arrivalTime?: string
  shootTime?: string
  isWalkIn?: boolean
  note?: string
  staffNotes?: string
  schoolName?: string
  course?: string
  hoodColor?: string
  togaColor?: string
  tasselColor?: string
  backgroundColor?: string
  depositAmount: number
  price: number
  transactionRef?: string
  bookingStatus: 'Pending Payment' | 'Pending Verification' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Completed' | 'No Show'
  paymentStatus: 'Unpaid' | 'Pending Verification' | 'Paid Deposit' | 'Paid Full' | 'Refunded'
  rejectionReason?: string
  createdAt: string
  receiptUrl?: string
  paymentHistory: PaymentRecord[]
  driveLink?: string
}

export interface Notification {
  id: string
  bookingId: string
  type: 'NEW_BOOKING' | 'RECEIPT_UPLOAD' | 'CANCELLED' | 'RESUBMITTED'
  message: string
  isRead: boolean
  createdAt: string
}

export interface EmailLog {
  id: string
  bookingId: string
  recipientEmail: string
  subject: string
  body: string
  status: 'SENT' | 'FAILED'
  sentAt: string
}

const BOOKINGS_KEY = 'ficomana_bookings'
const NOTIFS_KEY = 'ficomana_notifications'

function cacheBookings(bookings: Booking[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
  }
}

function cacheNotifications(notifs: Notification[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs))
  }
}

function getCachedBookings(): Booking[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(BOOKINGS_KEY)
    return data ? (JSON.parse(data) as Booking[]) : []
  } catch {
    return []
  }
}

/** Load bookable packages from API (falls back to code catalog). */
export async function getBookingPackages(category?: string): Promise<BookingPackage[]> {
  try {
    const url = category ? `/api/packages?category=${encodeURIComponent(category)}` : '/api/packages'
    const res = await fetch(url, { cache: 'no-store' })
    if (res.ok) return (await res.json()) as BookingPackage[]
  } catch (error) {
    console.error('getBookingPackages failed:', error)
  }
  return category ? bookingPackages.filter((p) => p.category === category) : bookingPackages
}

/** Staff: all bookings from API (Supabase + file merge on server). */
export async function getBookings(): Promise<Booking[]> {
  try {
    const res = await fetch('/api/bookings', { cache: 'no-store', credentials: 'include' })
    if (res.ok) {
      const data = (await res.json()) as Booking[]
      cacheBookings(data)
      return data
    }
    if (res.status === 401) {
      console.error('getBookings: staff login required')
      return []
    }
  } catch (error) {
    console.error('getBookings failed:', error)
  }
  return getCachedBookings()
}

/** Public availability for booking calendar (no PII). */
export async function getBookingsForAvailability(): Promise<Booking[]> {
  try {
    const res = await fetch('/api/bookings/availability', { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as Array<{
        id: string
        bookingDate: string
        slotId?: string
        packageId: string
        bookingStatus: Booking['bookingStatus']
      }>
      return data.map((a) => ({
        id: a.id,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerFbLink: '',
        customerFbName: '',
        packageId: a.packageId,
        packageName: '',
        bookingDate: a.bookingDate,
        bookingTime: '',
        slotId: a.slotId,
        depositAmount: 0,
        price: 0,
        bookingStatus: a.bookingStatus,
        paymentStatus: 'Unpaid',
        createdAt: '',
        paymentHistory: [],
      }))
    }
  } catch (error) {
    console.error('getBookingsForAvailability failed:', error)
  }
  return []
}

export async function getBooking(id: string): Promise<Booking | null> {
  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    if (res.ok) return (await res.json()) as Booking
  } catch (error) {
    console.error(`getBooking failed for ${id}:`, error)
  }
  return getCachedBookings().find((b) => b.id === id) ?? null
}

export async function saveBooking(booking: Booking): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(booking),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || 'Failed to save booking')
  }

  const saved = (await res.json()) as Booking
  const cached = getCachedBookings()
  const idx = cached.findIndex((b) => b.id === saved.id)
  if (idx >= 0) cached[idx] = saved
  else cached.unshift(saved)
  cacheBookings(cached)
  return saved
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const res = await fetch('/api/notifications', { cache: 'no-store', credentials: 'include' })
    if (res.ok) {
      const data = (await res.json()) as Notification[]
      cacheNotifications(data)
      return data
    }
  } catch (error) {
    console.error('getNotifications failed:', error)
  }
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(NOTIFS_KEY)
    return raw ? (JSON.parse(raw) as Notification[]) : []
  } catch {
    return []
  }
}

export async function addNotification(
  bookingId: string,
  type: Notification['type'],
  message: string,
): Promise<void> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bookingId, type, message }),
  })
  if (!res.ok) throw new Error('Failed to add notification')
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) return

  if (typeof window !== 'undefined') {
    const notifs = await getNotifications()
    cacheNotifications(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }
}

export async function getEmailLogs(): Promise<EmailLog[]> {
  try {
    const res = await fetch('/api/emails/logs', { cache: 'no-store', credentials: 'include' })
    if (res.ok) return (await res.json()) as EmailLog[]
  } catch (error) {
    console.error('getEmailLogs failed:', error)
  }
  return []
}

export async function uploadReceipt(bookingId: string, file: File): Promise<string> {
  const { supabase, isSupabaseConfigured } = await import('./supabase')
  const fileName = `${bookingId}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`

  if (isSupabaseConfigured()) {
    const { error } = await supabase.storage.from('receipts').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName)
      return publicUrl
    }
    console.error('Supabase storage upload error:', error)
  }

  return mockUploadFile(file)
}

function mockUploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (file.size > 500000) resolve('/model/model_3.jpg')
      else resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export { mapDbBookingToModel, mapModelBookingToDb } from './booking-db'
