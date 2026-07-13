import { NextResponse } from 'next/server'
import type { Booking } from '@/lib/data-store'
import { requireStaffAuth } from '@/lib/auth-api'
import { loadBookingById } from '@/lib/booking-load'
import { upsertBooking } from '@/lib/server-store'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { saveBookingToDb, addNotificationToDb } from '@/lib/supabase-store'
import { addServerNotification } from '@/lib/server-store'
import { sendRawPhotoApprovedEmail, sendRawPhotoRejectedEmail } from '@/lib/email'

type Body = {
  action?: 'Approve' | 'Reject'
  reason?: string
  notes?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const { id } = await params
    const body = (await request.json()) as Body
    const action = body.action
    const reason = body.reason?.trim()
    const notes = body.notes?.trim()

    if (!action || (action === 'Reject' && !reason)) {
      return NextResponse.json({ error: 'Action and rejection reason (if rejecting) are required.' }, { status: 400 })
    }

    const booking = await loadBookingById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    const updatedBooking: Booking = {
      ...booking,
      rawPhotoStatus: action === 'Approve' ? 'Approved' : 'Rejected',
      rawPhotoNotes: notes || reason || '',
    }

    const notificationType = action === 'Approve' ? 'RAW_PHOTO_APPROVED' : 'RAW_PHOTO_REJECTED'
    const notificationMessage = action === 'Approve'
      ? `Raw photo selection for booking ${booking.id} was APPROVED by editors.`
      : `Raw photo selection for booking ${booking.id} was REJECTED by editors (Reason: ${reason}).`

    const emailErrors: string[] = []

    // Attempt to send the email
    try {
      if (action === 'Approve') {
        await sendRawPhotoApprovedEmail(updatedBooking)
      } else {
        await sendRawPhotoRejectedEmail(updatedBooking, reason!, notes)
      }
    } catch (err) {
      console.error('Failed to send raw photo status email:', err)
      emailErrors.push(err instanceof Error ? err.message : 'Failed to send notification email.')
    }

    if (isSupabaseConfigured()) {
      const db = await createSupabaseServerClient()
      const saved = await saveBookingToDb(db, updatedBooking)
      if (saved) {
        await upsertBooking(saved)
        await addNotificationToDb(db, booking.id, notificationType, notificationMessage)
        return NextResponse.json({
          ...saved,
          emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
          message: `Raw photo selection successfully ${action === 'Approve' ? 'approved' : 'rejected'}.`,
        })
      }
    }

    const saved = await upsertBooking(updatedBooking)
    await addServerNotification(booking.id, notificationType, notificationMessage)

    return NextResponse.json({
      ...saved,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
      message: `Raw photo selection successfully ${action === 'Approve' ? 'approved' : 'rejected'}.`,
    })
  } catch (error) {
    console.error('POST /api/bookings/[id]/review-raw-photo', error)
    return NextResponse.json({ error: 'Failed to process raw photo review.' }, { status: 500 })
  }
}
