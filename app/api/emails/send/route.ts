import { NextResponse } from 'next/server'
import type { Booking, PaymentRecord } from '@/lib/data-store'
import type { EmailAction } from '@/lib/email-dispatch'
import {
  sendBookingCreatedEmail,
  sendPaymentReceivedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendTransactionConfirmationEmail,
  sendTransactionReceiptEmail,
  sendFinalOfficialReceiptEmail,
  sendBookingCancelledEmail,
  sendBookingRescheduledEmail,
  sendGalleryLinkEmail,
} from '@/lib/email'

type Body = {
  action: EmailAction
  booking: Booking
  payment?: PaymentRecord
  reason?: string
  rebookingFee?: number
  driveLink?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const { action, booking, payment, reason, rebookingFee, driveLink } = body

    if (!booking?.id || !booking?.customerEmail) {
      return NextResponse.json({ error: 'Invalid booking payload' }, { status: 400 })
    }

    let result: { success: boolean; error?: string } = { success: true }

    switch (action) {
      case 'booking_created':
        result = await sendBookingCreatedEmail(booking)
        break
      case 'payment_received':
        result = await sendPaymentReceivedEmail(booking)
        break
      case 'payment_approved':
        result = await sendPaymentApprovedEmail(booking)
        break
      case 'payment_rejected':
        result = await sendPaymentRejectedEmail(booking, reason || 'Unable to verify payment')
        break
      case 'transaction_confirmation':
        if (!payment) return NextResponse.json({ error: 'Payment required' }, { status: 400 })
        result = await sendTransactionConfirmationEmail(booking, payment)
        break
      case 'transaction_receipt':
        if (!payment) return NextResponse.json({ error: 'Payment required' }, { status: 400 })
        result = await sendTransactionReceiptEmail(booking, payment)
        break
      case 'transaction_both':
        if (!payment) return NextResponse.json({ error: 'Payment required' }, { status: 400 })
        result = await sendTransactionEmails(booking, payment)
        break
      case 'final_receipt':
        result = await sendFinalOfficialReceiptEmail(booking)
        break
      case 'booking_cancelled':
        result = await sendBookingCancelledEmail(booking)
        break
      case 'booking_rescheduled':
        result = await sendBookingRescheduledEmail(booking, rebookingFee ?? 0)
        break
      case 'gallery_link':
        if (!driveLink) return NextResponse.json({ error: 'Drive link required' }, { status: 400 })
        await sendGalleryLinkEmail(booking, driveLink)
        break
      default:
        return NextResponse.json({ error: 'Unknown email action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/emails/send', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

async function sendTransactionEmails(booking: Booking, payment: PaymentRecord) {
  const confirmation = await sendTransactionConfirmationEmail(booking, payment)
  if (!confirmation.success) return confirmation
  return sendTransactionReceiptEmail(booking, payment)
}
