import type { Booking } from '@/lib/data-store'

/** Pull structured values embedded in the note field (core-schema fallback). */
export function extractNoteField(note: string | undefined, label: string): string | undefined {
  if (!note) return undefined
  for (const part of note.split(' · ')) {
    const prefix = `${label}: `
    if (part.startsWith(prefix)) {
      const value = part.slice(prefix.length).trim()
      if (value && value !== '(receipt on file)') return value
    }
  }
  return undefined
}

/** Fill receipt URL and transaction ref from note / payment history when DB columns are empty. */
export function enrichBookingDisplay(booking: Booking): Booking {
  const note = booking.note
  let receiptUrl = booking.receiptUrl?.trim() || undefined
  let transactionRef = booking.transactionRef?.trim() || undefined

  if (!receiptUrl) {
    receiptUrl = extractNoteField(note, 'Receipt')
  }
  if (!transactionRef) {
    transactionRef = extractNoteField(note, 'TxnRef')
  }
  if (!transactionRef && booking.paymentHistory?.length) {
    const deposit = booking.paymentHistory.find((p) => p.type === 'Deposit')
    transactionRef = deposit?.transactionRef?.trim() || undefined
  }

  if (receiptUrl === booking.receiptUrl && transactionRef === booking.transactionRef) {
    return booking
  }

  return { ...booking, receiptUrl, transactionRef }
}

const INVALID_RECEIPT_PATTERNS = [
  'booking_model',
  '/model/model_',
  'grad_',
  'bg_package',
  'bg_pricing',
]

export function isLikelyInvalidReceipt(url?: string): boolean {
  if (!url) return true
  const lower = url.toLowerCase()
  return INVALID_RECEIPT_PATTERNS.some((p) => lower.includes(p))
}

export function receiptDisplayLabel(url?: string): string {
  if (!url) return 'No receipt uploaded'
  if (url.startsWith('data:')) return 'Receipt image (embedded)'
  if (url.endsWith('.pdf')) return 'PDF receipt'
  if (isLikelyInvalidReceipt(url)) return 'Invalid file — not a payment screenshot'
  return 'Payment receipt'
}

function normalizeSearchTerm(term: string) {
  return term.trim().toLowerCase().replace(/\s+/g, '')
}

function normalizePhoneDigits(value?: string) {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

function bookingIdVariants(id: string): string[] {
  const lower = id.toLowerCase()
  const bare = lower.replace(/^fm-rcp-/, '').replace(/^fm-/, '')
  return [lower, bare, `fm-${bare}`, `fm-rcp-${bare}`]
}

/** Match booking reference (FM-XXXXXX), receipt (FM-RCP-…), GCash ref, name, email, or phone. */
export function bookingMatchesSearch(booking: Booking, term: string): boolean {
  const t = normalizeSearchTerm(term)
  if (!t) return true

  const tDigits = t.replace(/\D/g, '')
  const phoneDigits = normalizePhoneDigits(booking.customerPhone)

  const receiptNumbers = (booking.paymentHistory || []).map((payment) => {
    const bookingPart = booking.id.replace(/^FM-/i, '')
    const payPart = payment.id.replace(/^PAY-/i, '')
    return `fm-rcp-${bookingPart}-${payPart}`
  })

  const haystack = [
    ...bookingIdVariants(booking.id),
    booking.transactionRef,
    booking.customerName,
    booking.customerPhone,
    booking.customerEmail,
    booking.packageName,
    ...(booking.paymentHistory || []).flatMap((payment) => [
      payment.id,
      payment.transactionRef,
      payment.type,
      payment.method,
    ]),
    ...receiptNumbers,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase().replace(/\s+/g, ''))

  if (tDigits.length >= 4) {
    const digitHaystack = [
      phoneDigits,
      normalizePhoneDigits(booking.transactionRef),
      booking.id.replace(/\D/g, ''),
      ...(booking.paymentHistory || []).map((payment) => normalizePhoneDigits(payment.transactionRef)),
    ].filter((value) => value.length >= 4)

    if (digitHaystack.some((value) => value.includes(tDigits))) return true
  }

  return haystack.some((value) => {
    if (!value) return false
    if (value.includes(t)) return true
    if (t.length >= 8 && t.includes(value) && value.length >= 6) return true
    return false
  })
}

export type BookingFilterOptions = {
  searchTerm?: string
  statusFilter?: string
  paymentFilter?: string
  packageFilter?: string
  dateFilter?: string
}

export function filterBookings(bookings: Booking[], filters: BookingFilterOptions): Booking[] {
  const {
    searchTerm = '',
    statusFilter = 'All',
    paymentFilter = 'All',
    packageFilter = 'All',
    dateFilter = '',
  } = filters

  let result = bookings.map(enrichBookingDisplay)

  if (searchTerm.trim()) {
    result = result.filter((booking) => bookingMatchesSearch(booking, searchTerm))
  }
  if (statusFilter !== 'All') {
    result = result.filter((booking) => booking.bookingStatus === statusFilter)
  }
  if (paymentFilter !== 'All') {
    result = result.filter((booking) => booking.paymentStatus === paymentFilter)
  }
  if (packageFilter !== 'All') {
    result = result.filter((booking) => booking.packageId === packageFilter)
  }
  if (dateFilter) {
    result = result.filter((booking) => booking.bookingDate === dateFilter)
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
