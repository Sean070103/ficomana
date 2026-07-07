import type { Booking } from '@/lib/data-store'
import { getBookingById } from '@/lib/server-store'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getBookingFromDb } from '@/lib/supabase-store'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function emailsMatch(a: string, b: string): boolean {
  return normalizeEmail(a) === normalizeEmail(b)
}

/** Load a booking from Supabase (admin/anon) or file store fallback. */
export async function loadBookingById(id: string): Promise<Booking | null> {
  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin() ?? supabase
    const fromDb = await getBookingFromDb(admin, id)
    if (fromDb) return fromDb
  }
  return getBookingById(id)
}

export type PublicResubmitBooking = {
  id: string
  customerName: string
  packageName: string
  bookingDate: string
  bookingTime: string
  depositAmount: number
  bookingStatus: Booking['bookingStatus']
  rejectionReason?: string
}

export function toPublicResubmitBooking(booking: Booking): PublicResubmitBooking {
  return {
    id: booking.id,
    customerName: booking.customerName,
    packageName: booking.packageName,
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    depositAmount: booking.depositAmount,
    bookingStatus: booking.bookingStatus,
    rejectionReason: booking.rejectionReason,
  }
}
