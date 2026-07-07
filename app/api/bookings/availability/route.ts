import { NextResponse } from 'next/server'
import { listBookings } from '@/lib/server-store'
import { isSupabaseConfigured } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { toAvailability } from '@/lib/auth-api'
import { mergeBookingsLists } from '@/lib/supabase-store'
import type { Booking } from '@/lib/data-store'

function mapDbBookingToAvailability(b: Record<string, unknown>) {
  return toAvailability({
    id: String(b.id),
    bookingDate: String(b.booking_date),
    slotId: b.slot_id ? String(b.slot_id) : undefined,
    packageId: String(b.package_id),
    bookingStatus: String(b.booking_status),
  })
}

function bookingToAvailability(b: Booking) {
  return toAvailability({
    id: b.id,
    bookingDate: b.bookingDate,
    slotId: b.slotId,
    packageId: b.packageId,
    bookingStatus: b.bookingStatus,
  })
}

/** Public endpoint — returns only fields needed for slot/calendar availability. */
export async function GET() {
  try {
    const fileBookings = await listBookings()

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_date, slot_id, package_id, booking_status')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const fromDb = data.map(mapDbBookingToAvailability)
        const fromFile = fileBookings.map(bookingToAvailability)
        const merged = mergeBookingsLists(
          fromDb.map((a) => ({
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
            bookingStatus: a.bookingStatus as Booking['bookingStatus'],
            paymentStatus: 'Unpaid',
            createdAt: '',
            paymentHistory: [],
          })),
          fileBookings,
        )
        return NextResponse.json(merged.map(bookingToAvailability))
      }
    }

    return NextResponse.json(fileBookings.map(bookingToAvailability))
  } catch (error) {
    console.error('GET /api/bookings/availability', error)
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 })
  }
}
