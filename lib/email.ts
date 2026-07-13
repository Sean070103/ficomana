import { persistEmailLog } from './server-email-log'
import { getServerEmailTemplate, renderTemplate } from './email-templates'
import { LATE_FEE_POLICY } from './booking-slots'
import { resubmitBookingUrl, submitRawPhotoUrl } from './site-url'
import { isForgedRejection } from './rejection-reasons'
import {
  getResendClient,
  getResendFromAddress,
  isResendConfigured,
  getResendDiagnostics,
} from './resend-config'

export { getResendDiagnostics, isResendConfigured }

function templateVars(booking: any) {
  return {
    customerName: String(booking.customerName ?? ''),
    bookingId: String(booking.id ?? ''),
    packageName: String(booking.packageName ?? ''),
    bookingDate: String(booking.bookingDate ?? ''),
    arrivalTime: String(booking.arrivalTime ?? booking.bookingTime ?? ''),
    shootTime: String(booking.shootTime ?? booking.bookingTime ?? ''),
    depositAmount: Number(booking.depositAmount ?? 0),
    lateFeePolicy: LATE_FEE_POLICY,
  }
}

import type { PaymentRecord } from './data-store'

function brandedEmail(title: string, inner: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #0500D0; background: #ffffff;">
      <h2 style="color: #0500D0; text-align: center; margin: 0 0 4px;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A; text-align: center; margin: 0 0 20px;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 0 0 20px;" />
      <h3 style="color: #0500D0; margin: 0 0 16px;">${title}</h3>
      ${inner}
      <p style="font-size: 11px; color: #5A5A8A; text-align: center; margin-top: 32px; border-top: 1px solid #EEF0FF; padding-top: 16px;">
        Cabuyao Retail Plaza, 4025 Cabuyao, Laguna · +63 49 576 5176
      </p>
    </div>
  `
}

function formatMoney(amount: number) {
  return `₱${amount.toFixed(2)}`
}

function totalPaid(booking: any) {
  return ((booking.paymentHistory as PaymentRecord[]) || []).reduce((s, p) => s + p.amount, 0)
}

function remainingBalance(booking: any) {
  return Math.max(0, Number(booking.price ?? 0) - totalPaid(booking))
}

function depositPayment(booking: any, payment?: PaymentRecord): PaymentRecord {
  if (payment) return payment
  const history = (booking.paymentHistory as PaymentRecord[]) || []
  return (
    history.find((p) => p.type === 'Deposit') ?? {
      id: 'PAY-DEP',
      amount: Number(booking.depositAmount ?? 0),
      method: 'BPI',
      type: 'Deposit',
      transactionRef: booking.transactionRef ? String(booking.transactionRef) : undefined,
      date: String(booking.createdAt ?? new Date().toISOString()),
    }
  )
}

function sessionDetailsTable(booking: any) {
  const arrival = String(booking.arrivalTime ?? booking.bookingTime ?? '')
  const shoot = String(booking.shootTime ?? booking.bookingTime ?? '')
  return `
    <table style="width: 100%; font-size: 13px; margin: 16px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Booking Reference</td>
        <td style="padding: 8px 0; font-weight: bold; color: #0500D0; font-family: monospace; border-bottom: 1px solid #EEF0FF;">${booking.id}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Package</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${booking.packageName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Session Date</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${booking.bookingDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Time Slot</td>
        <td style="padding: 8px 0; font-weight: bold; color: #0500D0; border-bottom: 1px solid #EEF0FF;">${booking.bookingTime}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Arrival Time</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${arrival}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Shoot Time</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${shoot}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A;">Status</td>
        <td style="padding: 8px 0; font-weight: bold; color: #16A34A;">Confirmed</td>
      </tr>
    </table>
  `
}

function receiptNumber(bookingId: string, paymentId: string) {
  return `FM-RCP-${bookingId.replace('FM-', '')}-${paymentId.replace('PAY-', '')}`
}

function paymentDetailsTable(booking: any, payment: PaymentRecord) {
  const price = Number(booking.price ?? 0)
  const paid = totalPaid(booking)
  const remaining = Math.max(0, price - paid)

  return `
    <table style="width: 100%; font-size: 13px; margin: 16px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Booking Reference</td>
        <td style="padding: 8px 0; font-weight: bold; color: #0500D0; border-bottom: 1px solid #EEF0FF;">${booking.id}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Receipt No.</td>
        <td style="padding: 8px 0; font-weight: bold; font-family: monospace; border-bottom: 1px solid #EEF0FF;">${receiptNumber(String(booking.id), payment.id)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Transaction ID</td>
        <td style="padding: 8px 0; font-weight: bold; font-family: monospace; border-bottom: 1px solid #EEF0FF;">${payment.id}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Payment Type</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${payment.type}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Payment Method</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${payment.method}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Transaction Ref</td>
        <td style="padding: 8px 0; font-weight: bold; font-family: monospace; border-bottom: 1px solid #EEF0FF;">${payment.transactionRef || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Date</td>
        <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${new Date(payment.date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A;">Amount Paid (this transaction)</td>
        <td style="padding: 8px 0; font-weight: bold; color: #0500D0; font-size: 16px;">${formatMoney(payment.amount)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A;">Package Total</td>
        <td style="padding: 8px 0; font-weight: bold;">${formatMoney(price)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #5A5A8A;">Remaining Balance</td>
        <td style="padding: 8px 0; font-weight: bold; color: ${remaining > 0 ? '#DC2626' : '#16A34A'};">${formatMoney(remaining)}</td>
      </tr>
    </table>
  `
}

/** Payment confirmation — sent for every verified/recorded transaction. */
export async function sendTransactionConfirmationEmail(booking: Record<string, unknown>, payment: PaymentRecord) {
  const subject = `Payment Confirmed — ${formatMoney(payment.amount)} · ${booking.id}`
  const html = brandedEmail(
    'Payment Confirmation',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We have confirmed receipt of your <strong>${payment.type}</strong> payment. This email serves as your payment confirmation.</p>
      ${paymentDetailsTable(booking, payment)}
      <div style="background-color: #EEF0FF; padding: 14px; border-left: 3px solid #0500D0; margin-top: 16px;">
        <p style="margin: 0; font-size: 12px; color: #5A5A8A;">A separate <strong>Official Receipt</strong> for this transaction will follow in another email. Please keep both for your records.</p>
      </div>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: String(booking.customerEmail), subject, html })
}

/** Official receipt — sent per transaction after verification or in-studio payment. */
export async function sendTransactionReceiptEmail(booking: Record<string, unknown>, payment: PaymentRecord) {
  const rcpNo = receiptNumber(String(booking.id), payment.id)
  const verifiedLabel =
    payment.type === 'Deposit' ? 'Deposit Verified by FICO MANA Studio' : 'Payment Recorded'
  const subject = `Official Receipt ${rcpNo} — ${booking.id}`
  const html = brandedEmail(
    'Official Payment Receipt',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>This is your official receipt for the verified transaction below. Please save or print this email and present it at the studio if requested.</p>

      <div style="background: linear-gradient(135deg, #EEF0FF 0%, #F8FAFC 100%); border: 2px solid #0500D0; padding: 20px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Official Receipt</p>
        <p style="margin: 10px 0 4px; font-size: 22px; font-weight: bold; font-family: monospace; color: #0500D0;">${rcpNo}</p>
        <p style="margin: 0; font-size: 11px; color: #16A34A; font-weight: bold;">${verifiedLabel}</p>
      </div>

      ${paymentDetailsTable(booking, payment)}

      <table style="width: 100%; font-size: 12px; margin-top: 8px; border-collapse: collapse; border-top: 1px dashed #D4D8F0; padding-top: 12px;">
        <tr><td style="padding: 4px 0; color: #5A5A8A; width: 40%;">Client</td><td style="padding: 4px 0; font-weight: bold;">${booking.customerName}</td></tr>
        <tr><td style="padding: 4px 0; color: #5A5A8A;">Package</td><td style="padding: 4px 0; font-weight: bold;">${booking.packageName}</td></tr>
        <tr><td style="padding: 4px 0; color: #5A5A8A;">Session Date</td><td style="padding: 4px 0; font-weight: bold;">${booking.bookingDate} · ${booking.bookingTime}</td></tr>
        <tr><td style="padding: 4px 0; color: #5A5A8A;">Booking Status</td><td style="padding: 4px 0; font-weight: bold; color: #16A34A;">${booking.bookingStatus === 'Confirmed' ? 'Confirmed' : booking.bookingStatus}</td></tr>
      </table>

      <p style="font-size: 11px; color: #5A5A8A; margin-top: 20px; font-style: italic; text-align: center;">
        Issued by FICO MANA Studio · Cabuyao Retail Plaza, Laguna<br />
        This document serves as proof of payment for the transaction listed above.
      </p>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: String(booking.customerEmail), subject, html })
}

export async function sendEmail({
  bookingId,
  to,
  subject,
  html,
}: {
  bookingId: string
  to: string
  subject: string
  html: string
}) {
  const recipient = to.trim()
  const from = getResendFromAddress()
  const resend = getResendClient()

  if (!recipient) {
    const errorMsg = 'Recipient email is empty'
    console.error('[Resend] blocked:', errorMsg)
    await persistEmailLog({
      bookingId,
      recipientEmail: recipient || '(empty)',
      subject,
      body: html,
      status: 'FAILED',
    })
    return { success: false, error: errorMsg }
  }

  if (!resend) {
    const errorMsg =
      'RESEND_API_KEY is not set at runtime. Add it in Vercel → Project → Settings → Environment Variables (Production + Preview), then redeploy.'
    console.error('[Resend] skipped — no API key', getResendDiagnostics())
    await persistEmailLog({
      bookingId,
      recipientEmail: recipient,
      subject,
      body: html,
      status: 'FAILED',
    })
    return { success: false, error: errorMsg }
  }

  try {
    const result = await resend.emails.send({
      from,
      to: [recipient],
      subject,
      html,
    })

    if (result.error) {
      const errorMsg = `${result.error.name}: ${result.error.message}${
        result.error.statusCode ? ` (${result.error.statusCode})` : ''
      }`
      console.error('[Resend] API error', {
        bookingId,
        to: recipient,
        from,
        name: result.error.name,
        message: result.error.message,
        statusCode: result.error.statusCode,
      })
      await persistEmailLog({
        bookingId,
        recipientEmail: recipient,
        subject,
        body: html,
        status: 'FAILED',
      })
      return { success: false, error: errorMsg }
    }

    if (!result.data?.id) {
      const errorMsg = 'Resend returned no email id'
      console.error('[Resend] unexpected response', { bookingId, result })
      await persistEmailLog({
        bookingId,
        recipientEmail: recipient,
        subject,
        body: html,
        status: 'FAILED',
      })
      return { success: false, error: errorMsg }
    }

    await persistEmailLog({
      bookingId,
      recipientEmail: recipient,
      subject,
      body: html,
      status: 'SENT',
    })

    return { success: true, resendId: result.data.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Resend error'
    console.error('[Resend] exception', { bookingId, to: recipient, from, error: errorMsg })
    await persistEmailLog({
      bookingId,
      recipientEmail: recipient,
      subject,
      body: html,
      status: 'FAILED',
    })
    return { success: false, error: errorMsg }
  }
}

export async function sendBookingCreatedEmail(booking: any) {
  const subject = `Booking Created - Reference: ${booking.id}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4D8F0;">
      <h2 style="color: #0500D0;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      <h3>Booking Submitted - Pending Deposit</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Thank you for submitting your booking request! To secure your slot, please complete your GCash deposit payment if you haven't already and upload your receipt on our portal.</p>
      
      <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Booking Reference:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0500D0;">${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Package:</td>
          <td style="padding: 6px 0; font-weight: bold;">${booking.packageName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Date & Time:</td>
          <td style="padding: 6px 0; font-weight: bold;">${booking.bookingDate} at ${booking.bookingTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Required Deposit:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0500D0;">₱${booking.depositAmount}</td>
        </tr>
      </table>

      <div style="background-color: #EEF0FF; padding: 15px; border-left: 3px solid #0500D0; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0500D0;">Important Note:</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #5A5A8A;">Your session slot is currently reserved for 2 hours. Bookings are only confirmed after manually verifying your GCash deposit receipt.</p>
      </div>

      <p style="font-size: 12px; color: #5A5A8A; margin-top: 30px;">Present your reference code or pass upon arrival. Thank you!</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendPaymentReceivedEmail(booking: any) {
  const subject = `Payment Uploaded - Pending Verification`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4D8F0;">
      <h2 style="color: #0500D0;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      <h3>Receipt Received</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We have successfully received your GCash payment receipt upload. Our studio staff are reviewing it to verify the transaction.</p>
      
      <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Booking Reference:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0500D0;">${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5A5A8A;">Uploaded Ref:</td>
          <td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${booking.transactionRef || 'None provided'}</td>
        </tr>
      </table>

      <p style="font-size: 12px; color: #5A5A8A; margin-top: 20px;">We will email you a digital pass once your booking status transitions to Confirmed.</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

/** Booking confirmation — sent when admin approves deposit. */
export async function sendPaymentApprovedEmail(
  booking: Record<string, unknown>,
  payment?: PaymentRecord,
) {
  const deposit = depositPayment(booking, payment)
  const remaining = remainingBalance(booking)
  const subject = `Booking Confirmed — ${booking.id}`
  const html = brandedEmail(
    'Your Booking is Confirmed',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Great news — we have verified your <strong>${deposit.method}</strong> deposit. Your studio session is now <strong style="color: #16A34A;">confirmed</strong>.</p>

      <div style="background: #ECFDF5; border: 1px solid #86EFAC; padding: 12px 16px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #166534;">Reservation Status</p>
        <p style="margin: 6px 0 0; font-size: 18px; font-weight: bold; color: #15803D;">CONFIRMED</p>
      </div>

      ${sessionDetailsTable(booking)}

      <table style="width: 100%; font-size: 13px; margin: 8px 0 16px; border-collapse: collapse; background: #F8FAFC; border: 1px solid #E2E8F0;">
        <tr>
          <td style="padding: 10px 12px; color: #5A5A8A; border-bottom: 1px solid #E2E8F0;">Package Total</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; border-bottom: 1px solid #E2E8F0;">${formatMoney(Number(booking.price ?? 0))}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; color: #5A5A8A; border-bottom: 1px solid #E2E8F0;">Deposit Paid (${deposit.method})</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; color: #16A34A; border-bottom: 1px solid #E2E8F0;">${formatMoney(deposit.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; color: #5A5A8A;">Balance Due at Studio</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; color: ${remaining > 0 ? '#DC2626' : '#16A34A'};">${formatMoney(remaining)}</td>
        </tr>
      </table>

      ${
        deposit.transactionRef
          ? `<p style="font-size: 12px; color: #5A5A8A; margin: 0 0 16px;">Verified transaction ref: <strong style="font-family: monospace;">${deposit.transactionRef}</strong></p>`
          : ''
      }

      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #B45309;">Before your session</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #92400E; line-height: 1.6;">
          Arrive <strong>10 minutes before</strong> your scheduled arrival time. Bring a valid ID and this booking reference (<strong>${booking.id}</strong>).
          ${remaining > 0 ? `The remaining balance of <strong>${formatMoney(remaining)}</strong> is payable in person at the studio.` : ''}
        </p>
      </div>

      <div style="border: 1px solid #D4D8F0; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0500D0;">Studio Location</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #5A5A8A; line-height: 1.6;">
          Cabuyao Retail Plaza, 4025 Cabuyao, Laguna<br />
          Phone: +63 49 576 5176
        </p>
      </div>

      <p style="font-size: 12px; color: #5A5A8A; margin-top: 16px;">Please save this email — it serves as both your <strong>booking confirmation</strong> and <strong>official deposit receipt</strong>.</p>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: String(booking.customerEmail), subject, html })
}

/** Single email on admin approve: confirmation + official receipt (Resend free-tier friendly). */
export async function sendDepositApprovedEmails(booking: Record<string, unknown>, payment: PaymentRecord) {
  const customerEmail = String(booking.customerEmail ?? '').trim()
  if (!customerEmail) {
    return { success: false, error: 'No customer email on booking' }
  }

  const deposit = depositPayment(booking, payment)
  const remaining = remainingBalance(booking)
  const rcpNo = receiptNumber(String(booking.id), deposit.id)
  const subject = `Confirmed & Receipt — ${booking.id}`
  const html = brandedEmail(
    'Booking Confirmed & Official Receipt',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Your <strong>${deposit.method}</strong> deposit is verified. Your session is <strong style="color: #16A34A;">confirmed</strong> — save this email as your confirmation and official receipt.</p>

      <div style="background: #ECFDF5; border: 1px solid #86EFAC; padding: 12px 16px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #166534;">Status</p>
        <p style="margin: 6px 0 0; font-size: 18px; font-weight: bold; color: #15803D;">CONFIRMED</p>
      </div>

      <div style="background: linear-gradient(135deg, #EEF0FF 0%, #F8FAFC 100%); border: 2px solid #0500D0; padding: 16px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Official Receipt No.</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0500D0;">${rcpNo}</p>
      </div>

      ${sessionDetailsTable(booking)}
      ${paymentDetailsTable(booking, deposit)}

      <table style="width: 100%; font-size: 13px; margin: 0 0 16px; border-collapse: collapse; background: #F8FAFC; border: 1px solid #E2E8F0;">
        <tr>
          <td style="padding: 10px 12px; color: #5A5A8A; border-bottom: 1px solid #E2E8F0;">Balance Due at Studio</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; color: ${remaining > 0 ? '#DC2626' : '#16A34A'};">${formatMoney(remaining)}</td>
        </tr>
      </table>

      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #B45309;">Before your session</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #92400E; line-height: 1.6;">
          Arrive <strong>10 minutes before</strong> your arrival time. Present reference <strong>${booking.id}</strong> at reception.
          ${remaining > 0 ? ` Balance of <strong>${formatMoney(remaining)}</strong> is payable in person.` : ''}
        </p>
      </div>

      <p style="font-size: 12px; color: #5A5A8A; margin: 0;">
        Cabuyao Retail Plaza, 4025 Cabuyao, Laguna · +63 49 576 5176
      </p>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: customerEmail, subject, html })
}

/** Single email when customer submits booking + receipt upload. */
export async function sendBookingSubmittedEmail(booking: Record<string, unknown>) {
  const customerEmail = String(booking.customerEmail ?? '').trim()
  if (!customerEmail) {
    return { success: false, error: 'No customer email on booking' }
  }

  const subject = `Booking Received — ${booking.id}`
  const html = brandedEmail(
    'Booking Received — Pending Verification',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We received your booking request and payment receipt. Our team will verify your deposit shortly.</p>

      <table style="width: 100%; font-size: 13px; margin: 16px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Reference</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0500D0; font-family: monospace; border-bottom: 1px solid #EEF0FF;">${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Package</td>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${booking.packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #5A5A8A; border-bottom: 1px solid #EEF0FF;">Session</td>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #EEF0FF;">${booking.bookingDate} · ${booking.bookingTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #5A5A8A;">Transaction Ref</td>
          <td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${booking.transactionRef || '—'}</td>
        </tr>
      </table>

      <div style="background-color: #EEF0FF; padding: 14px; border-left: 3px solid #0500D0; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; color: #5A5A8A; line-height: 1.6;">
          Your slot is reserved while we review your receipt. You will receive <strong>one confirmation email</strong> once payment is approved.
        </p>
      </div>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: customerEmail, subject, html })
}

export async function sendFinalOfficialReceiptEmail(booking: any) {
  const subject = `Final Official Receipt - Booking: ${booking.id}`
  const paymentRows = (booking.paymentHistory || []).map((pay: any) => `
    <tr style="border-bottom: 1px solid #EEF0FF;">
      <td style="padding: 10px 0; color: #5A5A8A;">${new Date(pay.date).toLocaleDateString()}</td>
      <td style="padding: 10px 0; font-weight: bold;">${pay.type}</td>
      <td style="padding: 10px 0;">${pay.method} ${pay.transactionRef ? `(${pay.transactionRef})` : ''}</td>
      <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0500D0;">₱${pay.amount.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #0500D0;">
      <h2 style="color: #0500D0; text-align: center;">FICO MANA RECEIPT</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A; text-align: center;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      
      <h3 style="color: green; text-align: center; margin-bottom: 20px;">Fully Paid Receipt</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Thank you for your final payment! Your session is now fully paid. Below is the official receipt showing your complete payment history.</p>
      
      <div style="background-color: #F8FAFC; padding: 20px; border: 1px solid #E2E8F0; margin: 25px 0;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Booking Code:</td>
            <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0500D0; font-size: 16px;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Package Name:</td>
            <td style="padding: 6px 0; font-weight: bold;">${booking.packageName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Total Package Price:</td>
            <td style="padding: 6px 0; font-weight: bold;">₱${booking.price.toFixed(2)}</td>
          </tr>
        </table>

        <h4 style="text-transform: uppercase; font-size: 10px; tracking-wider: 0.1em; color: #5A5A8A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-top: 20px;">Payment Ledger</h4>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #D4D8F0; text-align: left; font-size: 10px; color: #5A5A8A; text-transform: uppercase;">
              <th style="padding-bottom: 8px;">Date</th>
              <th style="padding-bottom: 8px;">Type</th>
              <th style="padding-bottom: 8px;">Method</th>
              <th style="padding-bottom: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows}
            <tr>
              <td colspan="3" style="padding-top: 15px; font-weight: bold; text-align: right; color: #5A5A8A;">Remaining Balance:</td>
              <td style="padding-top: 15px; font-weight: bold; text-align: right; color: green; font-size: 14px;">₱0.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style="font-size: 11px; color: #5A5A8A; text-align: center; margin-top: 30px;">Thank you for shooting with FICO MANA! We hope to see you again soon.</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendPaymentRejectedEmail(
  booking: Record<string, unknown>,
  reason: string,
  reasonId?: string,
) {
  const customerEmail = String(booking.customerEmail ?? '').trim()
  if (!customerEmail) {
    return { success: false, error: 'No customer email on booking' }
  }

  const forged = isForgedRejection(reasonId ?? '', reason)
  const subject = forged
    ? `Invalid Receipt — Upload Genuine Payment Proof · ${booking.id}`
    : `Payment Verification Failed — ${booking.id}`

  const html = brandedEmail(
    forged ? 'Receipt Rejected — Genuine Proof Required' : 'Payment Verification Unsuccessful',
    forged
      ? `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We reviewed the file uploaded for booking <strong>${booking.id}</strong>. It <strong style="color: #DC2626;">cannot be accepted</strong> as proof of payment.</p>

      <div style="background: #FEF2F2; border: 2px solid #DC2626; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 11px; font-weight: bold; color: #DC2626; text-transform: uppercase; letter-spacing: 0.1em;">Why it was rejected</p>
        <p style="margin: 0; font-size: 13px; color: #5A5A8A; line-height: 1.6;">${reason}</p>
      </div>

      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px; margin: 16px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #B45309;">What to upload</p>
        <ul style="margin: 8px 0 0; padding-left: 18px; font-size: 12px; color: #92400E; line-height: 1.7;">
          <li>A <strong>real GCash or BPI screenshot</strong> from your transaction history</li>
          <li>Must show <strong>₱500.00</strong> sent to the official FICO MANA account</li>
          <li>Must show your <strong>transaction reference number</strong></li>
          <li>Do not upload studio photos, sample images, or edited screenshots</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #5A5A8A;">Your slot may still be held briefly. Upload valid proof below to continue verification.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${resubmitBookingUrl(String(booking.id))}" style="background-color: #0500D0; color: white; padding: 14px 28px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block;">
          Upload Genuine Receipt
        </a>
      </div>

      <p style="font-size: 11px; color: #5A5A8A; text-align: center;">
        Reference: <strong>${booking.id}</strong> · Use the same email you booked with.<br />
        Questions? +63 49 576 5176
      </p>
    `
      : `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We reviewed the payment receipt for booking <strong>${booking.id}</strong> but could not verify your deposit.</p>

      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; font-size: 13px;">
        <p style="margin: 0; font-weight: bold; color: #DC2626;">Reason:</p>
        <p style="margin: 8px 0 0; color: #5A5A8A; line-height: 1.6;">${reason}</p>
      </div>

      <p style="font-size: 13px; color: #5A5A8A;">Your booking is back to <strong>Pending Payment</strong>. Please upload a clear GCash or BPI screenshot.</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${resubmitBookingUrl(String(booking.id))}" style="background-color: #0500D0; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">
          Upload New Receipt
        </a>
      </div>

      <p style="font-size: 11px; color: #5A5A8A; text-align: center;">
        Or visit our site → <strong>Resubmit Your Receipt</strong> · Ref <strong>${booking.id}</strong>
      </p>
    `,
  )
  return sendEmail({ bookingId: String(booking.id), to: customerEmail, subject, html })
}

export async function sendBookingCancelledEmail(booking: any) {
  const subject = `Booking Cancelled - Reference: ${booking.id}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4D8F0;">
      <h2 style="color: #0500D0;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      <h3>Booking Cancellation Confirmation</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Your booking reservation with Reference <strong>${booking.id}</strong> has been cancelled.</p>
      <p>If this was not done by you or if you have questions regarding refunds/rescheduling, please contact us at +63 49 576 5176.</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendBookingRescheduledEmail(booking: any, rebookingFee: number) {
  const subject = `Booking Rescheduled - Reference: ${booking.id}`
  const remainingBalance = booking.price - (booking.paymentHistory || []).reduce((acc: number, pay: any) => acc + pay.amount, 0)
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #F59E0B;">
      <h2 style="color: #0500D0;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      
      <h3>Booking Schedule Updated</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Your studio booking schedule has been updated by our administrator.</p>
      
      <div style="background-color: #FFFBEB; padding: 20px; border: 1px solid #FDE68A; margin: 25px 0;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Booking Code:</td>
            <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0500D0; font-size: 16px;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">New Date:</td>
            <td style="padding: 6px 0; font-weight: bold;">${booking.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">New Time Slot:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0500D0;">${booking.bookingTime}</td>
          </tr>
          ${rebookingFee > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Rebooking Fee Applied:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #DC2626;">₱${rebookingFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Total Package Price:</td>
            <td style="padding: 6px 0; font-weight: bold;">₱${booking.price.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Remaining Balance to Pay:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #DC2626; font-size: 14px;">₱${remainingBalance.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${rebookingFee > 0 ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; font-size: 12px; color: #B45309;">
        <p style="margin: 0; font-weight: bold;">Rebooking Fee Notice:</p>
        <p style="margin: 5px 0 0 0; line-height: 1.5;">
          A <strong>₱500.00</strong> rebooking fee has been applied to this schedule change as per studio policy. The remaining balance of <strong>₱${remainingBalance.toFixed(2)}</strong> (including the rebooking fee) is to be paid at the studio on the day of your shoot.
        </p>
      </div>
      ` : ''}

      <p style="font-size: 12px; color: #5A5A8A; margin-top: 20px;">Please arrive 10 minutes prior to your new slot. We look forward to hosting your session!</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendGalleryLinkEmail(booking: any, driveLink: string) {
  const submitUrl = submitRawPhotoUrl(booking.id)
  const subject = `Your Raw Photos Are Ready — Choose Your Edit - Booking: ${booking.id}`
  const html = brandedEmail(
    'Your Raw Photos Are Ready',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Your session raw photos are now uploaded. Browse your gallery, pick the <strong>5 raw photos</strong> you want us to edit, then follow the steps below to submit your selection.</p>

      <div style="background-color: #EEF0FF; padding: 20px; border: 1px solid #D4D8F0; margin: 25px 0; text-align: center;">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #0500D0;">Step 1 — Browse Your Raw Photos</p>
        <a href="${driveLink}" target="_blank" rel="noopener noreferrer" style="background-color: #0500D0; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; margin-bottom: 12px;">
          Open Google Drive Gallery
        </a>
        <p style="font-size: 12px; color: #5A5A8A; margin: 16px 0 4px;"><strong>Step 2</strong> — Create a folder in <strong>your own Google Drive</strong>, copy your 5 chosen photos into it, and set the folder sharing to <strong>"Anyone with the link"</strong>.</p>
        <p style="font-size: 12px; color: #5A5A8A; margin: 12px 0 12px;"><strong>Step 3</strong> — Submit your folder link using the button below.</p>
        <a href="${submitUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #111111; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; border: 2px solid #0500D0;">
          Submit Your 5 Chosen Photos
        </a>
      </div>

      <p style="font-size: 12px; color: #5A5A8A; line-height: 1.6;">
        Use the <strong>original, unedited</strong> files — not cropped or filtered versions. Our editors will review your selection and email you once it is approved for editing.
      </p>
      <p style="font-size: 12px; color: #5A5A8A;">Booking reference: <strong>${booking.id}</strong></p>
    `,
  )
  await sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
  await sendEmail({ bookingId: booking.id, to: 'supplier@ficomana.studio', subject: `[Supplier Copy] Raw Gallery Ready - ${booking.id}`, html })
}

export async function sendBookingReminderEmail(booking: Record<string, unknown>) {
  const template = getServerEmailTemplate('booking_reminder')
  const { subject, body } = renderTemplate(template, templateVars(booking))
  return sendEmail({
    bookingId: String(booking.id),
    to: String(booking.customerEmail),
    subject,
    html: body,
  })
}

export async function sendRawPhotoApprovedEmail(booking: any) {
  const subject = `Raw Photo Selection Approved - Booking: ${booking.id}`
  const html = brandedEmail(
    'Raw Photo Selection Approved',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Great news! Your chosen raw photo selection for booking reference <strong>${booking.id}</strong> has been approved for editing.</p>
      <p>Our editors have received your folder link and are now processing your photos. We will send you another email with a Google Drive download link once the final edited versions are ready.</p>
      <div style="background-color: #EEF0FF; padding: 15px; border-left: 4px solid #0500D0; margin: 20px 0; font-size: 13px;">
        <strong>Details:</strong><br/>
        Booking Code: ${booking.id}<br/>
        Package: ${booking.packageName}<br/>
        Submitted Photos: <a href="${booking.rawPhotoLink}" target="_blank" style="color: #0500D0; word-break: break-all;">Open Submitted Folder</a>
      </div>
      <p style="font-size: 12px; color: #5A5A8A;">No action is required from you. Thank you for choosing FICO MANA!</p>
    `
  )
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendRawPhotoRejectedEmail(booking: any, reason: string, customDetails?: string) {
  const subject = `Action Required: Raw Photo Selection Rejected - Booking: ${booking.id}`
  const url = submitRawPhotoUrl(booking.id)
  const html = brandedEmail(
    'Raw Photo Selection Rejected',
    `
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We reviewed your submitted raw photo Google Drive folder for booking reference <strong>${booking.id}</strong>, and unfortunately, it was rejected by our editors.</p>
      
      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; font-size: 13px; color: #991B1B;">
        <p style="margin: 0; font-weight: bold;">Rejection Reason:</p>
        <p style="margin: 5px 0 0 0; font-style: italic;">${reason}</p>
        ${customDetails ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #7F1D1D;"><strong>Editor Notes:</strong> ${customDetails}</p>` : ''}
      </div>

      <p>Please update your folder with 5 raw photos that meet our studio guidelines (make sure they are <strong>not blurry</strong> and <strong>not already edited/filtered</strong>), confirm the folder is shared with <strong>"Anyone with the link"</strong>, and resubmit.</p>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="background-color: #0500D0; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
          Resubmit Photo Folder Link
        </a>
      </div>

      <p style="font-size: 12px; color: #5A5A8A;">If you have any questions, please feel free to reply to this email or contact us at +63 49 576 5176.</p>
    `
  )
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

