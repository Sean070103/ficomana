import { Resend } from 'resend'
import { addEmailLog } from './data-store'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')

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
  console.log(`[Email Automation] Sending Email to ${to} for Booking ${bookingId}: ${subject}`)
  
  let success = false
  let errorMsg = ''

  if (process.env.RESEND_API_KEY) {
    try {
      const data = await resend.emails.send({
        from: 'FICO MANA Studio <bookings@ficomana.com>',
        to: [to],
        subject,
        html,
      })
      if (data.error) {
        errorMsg = data.error.message
      } else {
        success = true;
      }
    } catch (err: any) {
      errorMsg = err?.message || 'Unknown Resend error'
    }
  } else {
    // Simulator Mode
    success = true
    errorMsg = 'Simulator mode: Resend API Key is missing. Email logged in dashboard.'
  }

  // Always log inside local database/store for tracking
  addEmailLog({
    bookingId,
    recipientEmail: to,
    subject,
    body: html,
    status: success ? 'SENT' : 'FAILED',
  })

  return { success, error: errorMsg }
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

export async function sendPaymentApprovedEmail(booking: any) {
  const remainingBalance = booking.price - booking.depositAmount
  const subject = `Reservation Confirmed - Reference: ${booking.id}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #0500D0;">
      <h2 style="color: #0500D0; text-align: center;">FICO MANA RESERVATION</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A; text-align: center;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      
      <h3 style="color: #0500D0; text-align: center; margin-bottom: 20px;">Reservation Confirmed!</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Good news! We have successfully verified your GCash deposit. Your studio reservation is now confirmed.</p>
      
      <div style="background-color: #EEF0FF; padding: 20px; border: 1px solid #D4D8F0; margin: 25px 0;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Booking Code:</td>
            <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0500D0; font-size: 16px;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Package:</td>
            <td style="padding: 6px 0; font-weight: bold;">${booking.packageName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Session Date:</td>
            <td style="padding: 6px 0; font-weight: bold;">${booking.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Session Time:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0500D0;">${booking.bookingTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Total Package Price:</td>
            <td style="padding: 6px 0; font-weight: bold;">₱${booking.price.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Reservation Deposit Paid:</td>
            <td style="padding: 6px 0; font-weight: bold; color: green; font-size: 14px;">₱${booking.depositAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Remaining Balance:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #DC2626; font-size: 14px;">₱${remainingBalance.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Payment Method:</td>
            <td style="padding: 6px 0; font-weight: bold;">GCash (Verified)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5A5A8A;">Payment Status:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #5A5A8A;">Reserved - Deposit Paid</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #B45309;">Important Notice:</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #B45309; line-height: 1.5;">
          This receipt confirms the **reservation deposit only**. The remaining outstanding balance of **₱${remainingBalance.toFixed(2)}** is to be paid in person at the studio on the day of your session.
        </p>
      </div>

      <div style="border: 1px solid #D4D8F0; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0500D0;">Studio Location & Guidelines:</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #5A5A8A; line-height: 1.6;">
          <strong>Location:</strong> Cabuyao Retail Plaza, 4025 Cabuyao, Laguna<br />
          <strong>Guidelines:</strong> Please arrive <strong>10 minutes before</strong> your scheduled slot. Present this receipt or your reference code to our receptionist.
        </p>
      </div>

      <p style="font-size: 12px; color: #5A5A8A; text-align: center; margin-top: 35px;">We look forward to hosting your session!</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
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

export async function sendPaymentRejectedEmail(booking: any, reason: string) {
  const subject = `Payment Verification Failed - Action Required`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DC2626;">
      <h2 style="color: #DC2626;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      
      <h3 style="color: #DC2626;">Payment Verification Unsuccessful</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>Our staff reviewed the GCash payment receipt uploaded for Booking Reference <strong>${booking.id}</strong>, but were unable to confirm the transaction.</p>
      
      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; font-size: 13px;">
        <p style="margin: 0; font-weight: bold; color: #DC2626;">Reason for Rejection:</p>
        <p style="margin: 5px 0 0 0; color: #5A5A8A; font-style: italic;">"${reason || 'Unable to verify payment details'}"</p>
      </div>

      <p>Your booking status has been set back to <strong>Pending Payment</strong>. To secure your slot, please verify the deposit payment and upload a valid, clear receipt.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="#booking" style="background-color: #0500D0; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">
          Upload New Receipt
        </a>
      </div>

      <p style="font-size: 12px; color: #5A5A8A;">If you believe this was an error, please contact us at +63 49 576 5176 or message us on our Facebook page.</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
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
          A **₱500.00** rebooking fee has been applied to this schedule change as per studio policy. The remaining balance of **₱${remainingBalance.toFixed(2)}** (including the rebooking fee) is to be paid at the studio on the day of your shoot.
        </p>
      </div>
      ` : ''}

      <p style="font-size: 12px; color: #5A5A8A; margin-top: 20px;">Please arrive 10 minutes prior to your new slot. We look forward to hosting your session!</p>
    </div>
  `
  return sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
}

export async function sendGalleryLinkEmail(booking: any, driveLink: string) {
  const subject = `Your Studio Portrait Gallery Link is Ready! - Booking: ${booking.id}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #0500D0;">
      <h2 style="color: #0500D0;">FICO MANA</h2>
      <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; color: #5A5A8A;">Self Portrait Studio</p>
      <hr style="border: 0; border-top: 1px dashed #D4D8F0; margin: 20px 0;" />
      
      <h3>Your Digital Portraits are Ready!</h3>
      <p>Hello <strong>${booking.customerName}</strong>,</p>
      <p>We are excited to share that your final digital portraits are processed and ready for download.</p>
      
      <div style="background-color: #EEF0FF; padding: 20px; border: 1px solid #D4D8F0; margin: 25px 0; text-align: center;">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #0500D0;">Access Your Google Drive Gallery</p>
        <a href="${driveLink}" target="_blank" rel="noopener noreferrer" style="background-color: #0500D0; color: white; padding: 12px 25px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
          Open Google Drive Folder
        </a>
      </div>

      <p style="font-size: 12px; color: #5A5A8A;">Please download and save your photos. This link will be active for 30 days. Thank you for shooting with us!</p>
    </div>
  `
  await sendEmail({ bookingId: booking.id, to: booking.customerEmail, subject, html })
  await sendEmail({ bookingId: booking.id, to: 'supplier@ficomana.studio', subject: `[Supplier Copy] Gallery Link Ready - ${booking.id}`, html })
}
