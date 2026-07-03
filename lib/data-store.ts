import { supabase, isSupabaseConfigured } from './supabase'

export interface PaymentRecord {
  id: string
  amount: number
  method: 'GCash' | 'Cash' | 'Card' | 'Maya' | 'Bank Transfer'
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
  note?: string
  staffNotes?: string
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

// Initial mock data to populate the dashboard on first load
const initialMockBookings: Booking[] = [
  {
    id: 'FM-761234',
    customerName: 'Juan Dela Cruz',
    customerEmail: 'juan.delacruz@gmail.com',
    customerPhone: '+63 917 123 4567',
    customerFbLink: 'https://facebook.com/juan.delacruz',
    customerFbName: 'Juan Dela Cruz',
    packageId: 'solo',
    packageName: 'Solo Session (Without Makeup)',
    bookingDate: new Date().toISOString().split('T')[0], // Today
    bookingTime: '09:00 AM - 09:30 AM',
    note: 'Requesting black backdrop for graduation shoot.',
    staffNotes: 'Wants graduation cap setup.',
    depositAmount: 500,
    price: 1200,
    transactionRef: 'GC-98273612',
    bookingStatus: 'Pending Verification',
    paymentStatus: 'Pending Verification',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    receiptUrl: '/model/model_3.jpg',
    paymentHistory: [
      {
        id: 'PAY-9921',
        amount: 500,
        method: 'GCash',
        type: 'Deposit',
        transactionRef: 'GC-98273612',
        date: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },
  {
    id: 'FM-234918',
    customerName: 'Maria Santos',
    customerEmail: 'maria.santos@gmail.com',
    customerPhone: '+63 918 234 5678',
    customerFbLink: 'https://facebook.com/mariasantos.99',
    customerFbName: 'Maria Santos',
    packageId: 'couple-makeup',
    packageName: 'Couple Session (With Makeup)',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    bookingTime: '01:00 PM - 03:00 PM',
    note: 'Anniversary photo shoot! Bringing matching shirts.',
    staffNotes: '',
    depositAmount: 500,
    price: 2300,
    transactionRef: 'GC-12349827',
    bookingStatus: 'Confirmed',
    paymentStatus: 'Paid Deposit',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    receiptUrl: '/model/model_7.jpg',
    paymentHistory: [
      {
        id: 'PAY-8812',
        amount: 500,
        method: 'GCash',
        type: 'Deposit',
        transactionRef: 'GC-12349827',
        date: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  },
  {
    id: 'FM-882731',
    customerName: 'Jose Rizal',
    customerEmail: 'jose.rizal@gmail.com',
    customerPhone: '+63 919 345 6789',
    customerFbLink: 'https://facebook.com/jose.rizal.ph',
    customerFbName: 'Pepe Rizal',
    packageId: 'family',
    packageName: 'Family Session (Without Makeup)',
    bookingDate: new Date().toISOString().split('T')[0], // Today
    bookingTime: '02:30 PM - 03:00 PM',
    note: 'Bringing 5 family members. Hope we can fit.',
    staffNotes: 'Confirmed 5 guests. Set up wider lighting backdrop.',
    depositAmount: 500,
    price: 2500,
    transactionRef: 'GC-55443211',
    bookingStatus: 'Confirmed',
    paymentStatus: 'Paid Deposit',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    receiptUrl: '/model/model9.jpg',
    paymentHistory: [
      {
        id: 'PAY-1123',
        amount: 500,
        method: 'GCash',
        type: 'Deposit',
        transactionRef: 'GC-55443211',
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },
  {
    id: 'FM-991823',
    customerName: 'Liza Soberano',
    customerEmail: 'liza@gmail.com',
    customerPhone: '+63 920 456 7890',
    customerFbLink: 'https://facebook.com/liza.soberano.real',
    customerFbName: 'Liza Soberano',
    packageId: 'fur-babies-makeup',
    packageName: 'With Fur Babies (With Makeup)',
    bookingDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // 2 days from now
    bookingTime: '11:00 AM - 01:00 PM',
    note: 'Bringing our golden retriever. He is friendly!',
    staffNotes: '',
    depositAmount: 500,
    price: 2500,
    bookingStatus: 'Pending Payment',
    paymentStatus: 'Unpaid',
    createdAt: new Date().toISOString(),
    paymentHistory: []
  },
  {
    id: 'FM-118273',
    customerName: 'Alden Richards',
    customerEmail: 'alden@gmail.com',
    customerPhone: '+63 921 567 8901',
    customerFbLink: 'https://facebook.com/alden.richards',
    customerFbName: 'Alden Richards',
    packageId: 'solo-makeup',
    packageName: 'Solo Session (With Makeup)',
    bookingDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    bookingTime: '03:00 PM - 05:00 PM',
    note: 'Need files quickly.',
    staffNotes: 'Completed. Prints delivered.',
    depositAmount: 500,
    price: 1700,
    transactionRef: 'GC-99008811',
    bookingStatus: 'Completed',
    paymentStatus: 'Paid Full',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    receiptUrl: '/model/model_4.jpg',
    paymentHistory: [
      {
        id: 'PAY-0091',
        amount: 500,
        method: 'GCash',
        type: 'Deposit',
        transactionRef: 'GC-99008811',
        date: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 'PAY-0092',
        amount: 1200,
        method: 'Cash',
        type: 'Balance Payment',
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },
]

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    bookingId: 'FM-761234',
    type: 'RECEIPT_UPLOAD',
    message: 'Juan Dela Cruz uploaded a GCash payment receipt for Booking FM-761234.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    bookingId: 'FM-991823',
    type: 'NEW_BOOKING',
    message: 'New booking FM-991823 submitted by Liza Soberano.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
]

// Local Storage Keys
const BOOKINGS_KEY = 'ficomana_bookings'
const NOTIFS_KEY = 'ficomana_notifications'
const EMAIL_LOGS_KEY = 'ficomana_email_logs'

// Helper to initialize local storage data if empty
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return
  
  if (!localStorage.getItem(BOOKINGS_KEY)) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(initialMockBookings))
  }
  if (!localStorage.getItem(NOTIFS_KEY)) {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(initialNotifications))
  }
  if (!localStorage.getItem(EMAIL_LOGS_KEY)) {
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify([]))
  }
}

// Unified Get Bookings
export async function getBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase getBookings error, falling back to mock:', error)
      return getLocalBookings()
    }
    
    return data.map((b: any) => mapDbBookingToModel(b))
  }
  
  return getLocalBookings()
}

function getLocalBookings(): Booking[] {
  initializeLocalStorage()
  if (typeof window === 'undefined') return initialMockBookings
  const data = localStorage.getItem(BOOKINGS_KEY)
  return data ? JSON.parse(data) : initialMockBookings
}

// Unified Get Single Booking
export async function getBooking(id: string): Promise<Booking | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error(`Supabase getBooking error for ${id}, falling back to local:`, error)
      return getLocalBooking(id)
    }
    return mapDbBookingToModel(data)
  }
  return getLocalBooking(id)
}

function getLocalBooking(id: string): Booking | null {
  const bookings = getLocalBookings()
  return bookings.find(b => b.id === id) || null
}

// Unified Save/Update Booking
export async function saveBooking(booking: Booking): Promise<Booking> {
  if (isSupabaseConfigured()) {
    const dbBooking = mapModelBookingToDb(booking)
    const { data, error } = await supabase
      .from('bookings')
      .upsert(dbBooking)
      .select()
      .single()
      
    if (error) {
      console.error('Supabase saveBooking error, saving locally:', error)
      saveLocalBooking(booking)
      return booking
    }
    return mapDbBookingToModel(data)
  }
  
  saveLocalBooking(booking)
  return booking
}

function saveLocalBooking(booking: Booking) {
  initializeLocalStorage()
  if (typeof window === 'undefined') return
  const bookings = getLocalBookings()
  const existingIdx = bookings.findIndex(b => b.id === booking.id)
  
  if (existingIdx >= 0) {
    bookings[existingIdx] = booking
  } else {
    bookings.unshift(booking)
  }
  
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
}

// Notifications Helper
export async function getNotifications(): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('Supabase getNotifications error, falling back:', error)
      return getLocalNotifications()
    }
    return data.map((n: any) => ({
      id: n.id,
      bookingId: n.booking_id,
      type: n.type,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at,
    }))
  }
  return getLocalNotifications()
}

function getLocalNotifications(): Notification[] {
  initializeLocalStorage()
  if (typeof window === 'undefined') return initialNotifications
  const data = localStorage.getItem(NOTIFS_KEY)
  return data ? JSON.parse(data) : initialNotifications
}

export async function addNotification(
  bookingId: string,
  type: 'NEW_BOOKING' | 'RECEIPT_UPLOAD' | 'CANCELLED' | 'RESUBMITTED',
  message: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        booking_id: bookingId,
        type,
        message,
      })
    if (!error) return
  }
  
  initializeLocalStorage()
  if (typeof window === 'undefined') return
  const notifs = getLocalNotifications()
  notifs.unshift({
    id: 'notif-' + Math.floor(1000 + Math.random() * 9000),
    bookingId,
    type,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs))
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (!error) return
  }
  
  initializeLocalStorage()
  if (typeof window === 'undefined') return
  const notifs = getLocalNotifications()
  const idx = notifs.findIndex(n => n.id === id)
  if (idx >= 0) {
    notifs[idx].isRead = true
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs))
  }
}

// Email Logs Helpers
export async function getEmailLogs(): Promise<EmailLog[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      
    if (error) {
      console.error('Supabase getEmailLogs error:', error)
      return getLocalEmailLogs()
    }
    return data.map((l: any) => ({
      id: l.id,
      bookingId: l.booking_id,
      recipientEmail: l.recipient_email,
      subject: l.subject,
      body: l.body,
      status: l.status,
      sentAt: l.sent_at,
    }))
  }
  return getLocalEmailLogs()
}

function getLocalEmailLogs(): EmailLog[] {
  initializeLocalStorage()
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(EMAIL_LOGS_KEY)
  return data ? JSON.parse(data) : []
}

export function addEmailLog(log: Omit<EmailLog, 'id' | 'sentAt'>): void {
  initializeLocalStorage()
  if (typeof window === 'undefined') return
  const logs = getLocalEmailLogs()
  logs.unshift({
    ...log,
    id: 'log-' + Math.floor(1000 + Math.random() * 9000),
    sentAt: new Date().toISOString(),
  })
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs))
}

// Receipt Upload Helper
export async function uploadReceipt(bookingId: string, file: File): Promise<string> {
  const fileName = `${bookingId}-${Date.now()}-${file.name}`
  
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file)
      
    if (error) {
      console.error('Supabase storage upload error:', error)
      return mockUploadFile(file)
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)
      
    return publicUrl
  }
  
  return mockUploadFile(file)
}

function mockUploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (file.size > 500000) {
        resolve('/model/model_3.jpg')
      } else {
        resolve(reader.result as string)
      }
    }
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}

// Mapper functions
function mapDbBookingToModel(b: any): Booking {
  return {
    id: b.id,
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    customerPhone: b.customer_phone,
    customerFbLink: b.customer_fb_link || '',
    customerFbName: b.customer_fb_name || '',
    packageId: b.package_id,
    packageName: b.package_name,
    bookingDate: b.booking_date,
    bookingTime: b.booking_time,
    note: b.note,
    staffNotes: b.staff_notes,
    depositAmount: Number(b.deposit_amount),
    price: Number(b.price),
    transactionRef: b.transaction_ref,
    bookingStatus: b.booking_status,
    paymentStatus: b.payment_status,
    rejectionReason: b.rejection_reason,
    createdAt: b.created_at,
    receiptUrl: b.receipt_url,
    paymentHistory: b.payment_history ? JSON.parse(b.payment_history) : [],
    driveLink: b.drive_link
  }
}

// Map model object to Supabase database shape
function mapModelBookingToDb(b: Booking): any {
  return {
    id: b.id,
    customer_name: b.customerName,
    customer_email: b.customerEmail,
    customer_phone: b.customerPhone,
    customer_fb_link: b.customerFbLink,
    customer_fb_name: b.customerFbName,
    package_id: b.packageId,
    package_name: b.packageName,
    booking_date: b.bookingDate,
    booking_time: b.bookingTime,
    note: b.note,
    staff_notes: b.staffNotes,
    deposit_amount: b.depositAmount,
    price: b.price,
    transaction_ref: b.transactionRef,
    booking_status: b.bookingStatus,
    payment_status: b.paymentStatus,
    rejection_reason: b.rejectionReason,
    created_at: b.createdAt,
    receipt_url: b.receiptUrl,
    payment_history: JSON.stringify(b.paymentHistory || []),
    drive_link: b.driveLink
  }
}
