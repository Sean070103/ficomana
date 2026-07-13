import { NextResponse } from 'next/server'
import { listBookings, upsertBooking, getBookingById, addServerNotification } from '@/lib/server-store'
import type { Booking, PaymentRecord } from '@/lib/data-store'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { supabase } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireStaffAuth } from '@/lib/auth-api'
import {
  getBookingFromDb,
  listBookingsFromDb,
  saveBookingToDb,
  addNotificationToDb,
} from '@/lib/supabase-store'
import { validateBookingAvailability } from '@/lib/booking-validate'
import { listBlockedSlots } from '@/lib/server-blocked-slots'
import { listFicoSpotBlocks } from '@/lib/server-fico-spot-blocks'
import { loadSyncedBookings } from '@/lib/db-sync'
import {
  sendPaymentRejectedEmail,
  sendDepositApprovedEmails,
  sendBookingSubmittedEmail,
} from '@/lib/email'

function depositPaymentFromBooking(booking: Booking): PaymentRecord | undefined {
  const history = booking.paymentHistory || []
  return history.find((p) => p.type === 'Deposit') ?? history[history.length - 1]
}

function bookingEmailPayload(result: Booking, booking: Booking) {
  const customerEmail = booking.customerEmail?.trim()
  return customerEmail ? { ...result, customerEmail } : result
}

function pickDbClient(isExisting: boolean) {
  return isExisting ? createSupabaseServerClient() : Promise.resolve(getSupabaseAdmin() ?? supabase)
}

async function loadAvailabilityBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return listBookings()
  }

  const admin = getSupabaseAdmin() ?? supabase
  const { data, error } = await admin
    .from('bookings')
    .select('id, booking_date, slot_id, package_id, booking_status, booking_time')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((b) => ({
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

    const merged = await loadSyncedBookings()
    return NextResponse.json(merged)
  } catch (error) {
    console.error('GET /api/bookings', error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const booking = (await request.json()) as Booking

    let isExisting = false
    let priorBookingStatus: Booking['bookingStatus'] | undefined
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin() ?? supabase
      const existing = await getBookingFromDb(admin, booking.id)
      isExisting = !!existing
      priorBookingStatus = existing?.bookingStatus
    } else {
      const existing = await getBookingById(booking.id)
      isExisting = !!existing
      priorBookingStatus = existing?.bookingStatus
    }

    if (isExisting) {
      const { error: authError } = await requireStaffAuth()
      if (authError) return authError
    }

    const availabilityPool = await loadAvailabilityBookings()
    const blockedSlots = await listBlockedSlots()
    const ficoSpotBlocks = await listFicoSpotBlocks()
    const validation = validateBookingAvailability(booking, availabilityPool, {
      isUpdate: isExisting,
      blockedSlots,
      ficoSpotBlocks,
    })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 409 })
    }

    const db = getSupabaseAdmin() ?? (await pickDbClient(isExisting))
    const supabaseResult = await saveBookingToDb(db, booking)

    // File store is best-effort (read-only on Vercel)
    try {
      await upsertBooking(supabaseResult ?? booking)
    } catch (fileError) {
      console.warn('File store upsert skipped:', fileError)
    }

    const result = supabaseResult ?? booking
    const emailErrors: string[] = []

    if (!isExisting) {
      await notifyNewBooking(result)
      const customerEmail = booking.customerEmail?.trim()
      if (customerEmail) {
        const emailResult = await sendBookingSubmittedEmail(bookingEmailPayload(result, booking))
        if (!emailResult.success) {
          emailErrors.push(emailResult.error || 'Failed to email customer about booking submission.')
        }
      } else {
        emailErrors.push('No customer email on booking — submission confirmation not sent.')
      }
    }

    const rejectionChanged =
      isExisting &&
      booking.bookingStatus === 'Pending Payment' &&
      priorBookingStatus === 'Pending Verification' &&
      !!booking.rejectionReason?.trim()

    if (rejectionChanged) {
      const customerEmail = booking.customerEmail?.trim()
      if (!customerEmail) {
        emailErrors.push('No customer email on booking — rejection notice not sent.')
      } else {
        const emailResult = await sendPaymentRejectedEmail(
          { ...result, customerEmail },
          booking.rejectionReason!,
          booking.rejectionReasonId,
        )
        if (!emailResult.success) {
          emailErrors.push(emailResult.error || 'Failed to email customer about rejection.')
        }
      }
    }

    const approvedNow =
      isExisting &&
      booking.bookingStatus === 'Confirmed' &&
      priorBookingStatus !== 'Confirmed'

    if (approvedNow) {
      const customerEmail = booking.customerEmail?.trim()
      if (!customerEmail) {
        emailErrors.push('No customer email on booking — confirmation not sent.')
      } else {
        const deposit = depositPaymentFromBooking(booking)
        if (!deposit) {
          emailErrors.push('No deposit payment record — confirmation email not sent.')
        } else {
          const emailResult = await sendDepositApprovedEmails(
            bookingEmailPayload(result, booking),
            deposit,
          )
          if (!emailResult.success) {
            emailErrors.push(emailResult.error || 'Failed to email customer confirmation.')
          }
        }
      }
    }

    if (!supabaseResult && isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            'Could not save booking to database. Ensure migrations 002–004 are applied and SUPABASE_SERVICE_ROLE_KEY is set on Vercel.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      emailErrors.length > 0 ? { ...result, emailErrors } : result,
      { status: isExisting ? 200 : 201 },
    )
  } catch (error) {
    console.error('POST /api/bookings', error)
    const message = error instanceof Error ? error.message : 'Failed to save booking'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
