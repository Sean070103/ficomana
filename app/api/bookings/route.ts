import { NextResponse } from 'next/server'
import { listBookings, upsertBooking, getBookingById, addServerNotification } from '@/lib/server-store'
import type { Booking } from '@/lib/data-store'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireStaffAuth } from '@/lib/auth-api'
import {
  getBookingFromDb,
  listBookingsFromDb,
  saveBookingToDb,
  mergeBookingsLists,
  addNotificationToDb,
} from '@/lib/supabase-store'
import { validateBookingAvailability } from '@/lib/booking-validate'

function pickDbClient(isExisting: boolean) {
  return isExisting ? createSupabaseServerClient() : Promise.resolve(getSupabaseAdmin() ?? supabase)
}

async function loadAvailabilityBookings(): Promise<Booking[]> {
  const fileBookings = await listBookings()
  if (!isSupabaseConfigured()) return fileBookings

  const admin = getSupabaseAdmin() ?? supabase
  const { data, error } = await admin
    .from('bookings')
    .select('id, booking_date, slot_id, package_id, booking_status, booking_time')
    .order('created_at', { ascending: false })

  if (error || !data) return fileBookings

  const fromDb: Booking[] = data.map((b) => ({
    id: String(b.id),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerFbLink: '',
    customerFbName: '',
    packageId: String(b.package_id),
    packageName: '',
    bookingDate: String(b.booking_date),
    bookingTime: String(b.booking_time ?? ''),
    slotId: b.slot_id ? String(b.slot_id) : undefined,
    depositAmount: 0,
    price: 0,
    bookingStatus: b.booking_status as Booking['bookingStatus'],
    paymentStatus: 'Unpaid',
    createdAt: '',
    paymentHistory: [],
  }))

  return mergeBookingsLists(fromDb, fileBookings)
}

async function notifyNewBooking(booking: Booking) {
  const newBookingMsg = `New booking ${booking.id} submitted by ${booking.customerName}.`
  const receiptMsg = `${booking.customerName} submitted a receipt for booking ${booking.id}.`
  const admin = getSupabaseAdmin()

  try {
    if (isSupabaseConfigured() && admin) {
      await addNotificationToDb(admin, booking.id, 'NEW_BOOKING', newBookingMsg)
      if (booking.receiptUrl) {
        await addNotificationToDb(admin, booking.id, 'RECEIPT_UPLOAD', receiptMsg)
      }
      return
    }

    await addServerNotification(booking.id, 'NEW_BOOKING', newBookingMsg)
    if (booking.receiptUrl) {
      await addServerNotification(booking.id, 'RECEIPT_UPLOAD', receiptMsg)
    }
  } catch (error) {
    console.warn('notifyNewBooking skipped:', error)
  }
}

export async function GET() {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const fileBookings = await listBookings()

    if (isSupabaseConfigured()) {
      const db = await createSupabaseServerClient()
      let supabaseBookings = await listBookingsFromDb(db)
      if (supabaseBookings) {
        const dbIds = new Set(supabaseBookings.map((b) => b.id))
        for (const booking of fileBookings) {
          if (!dbIds.has(booking.id)) {
            const synced = await saveBookingToDb(db, booking)
            if (synced) dbIds.add(booking.id)
          }
        }
        if (dbIds.size > supabaseBookings.length) {
          supabaseBookings = (await listBookingsFromDb(db)) ?? supabaseBookings
        }
        return NextResponse.json(mergeBookingsLists(supabaseBookings, fileBookings))
      }
    }

    return NextResponse.json(fileBookings)
  } catch (error) {
    console.error('GET /api/bookings', error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const booking = (await request.json()) as Booking

    let isExisting = false
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin() ?? supabase
      const existing = await getBookingFromDb(admin, booking.id)
      isExisting = !!existing
    } else {
      isExisting = !!(await getBookingById(booking.id))
    }

    if (isExisting) {
      const { error: authError } = await requireStaffAuth()
      if (authError) return authError
    }

    const availabilityPool = await loadAvailabilityBookings()
    const validation = validateBookingAvailability(booking, availabilityPool, { isUpdate: isExisting })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 409 })
    }

    const db = await pickDbClient(isExisting)
    const supabaseResult = await saveBookingToDb(db, booking)

    // File store is best-effort (read-only on Vercel)
    try {
      await upsertBooking(supabaseResult ?? booking)
    } catch (fileError) {
      console.warn('File store upsert skipped:', fileError)
    }

    if (!isExisting) {
      await notifyNewBooking(supabaseResult ?? booking)
    }

    const result = supabaseResult ?? booking

    if (!supabaseResult && isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            'Could not save booking to database. Ensure migrations 002–004 are applied and SUPABASE_SERVICE_ROLE_KEY is set on Vercel.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json(result, { status: isExisting ? 200 : 201 })
  } catch (error) {
    console.error('POST /api/bookings', error)
    const message = error instanceof Error ? error.message : 'Failed to save booking'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
