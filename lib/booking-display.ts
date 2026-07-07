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
