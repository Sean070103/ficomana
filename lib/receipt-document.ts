import type { Booking, PaymentRecord } from '@/lib/data-store'

export function formatReceiptNumber(bookingId: string, paymentId: string) {
  return `FM-RCP-${bookingId.replace('FM-', '')}-${paymentId.replace('PAY-', '')}`
}

function formatMoney(amount: number) {
  return `₱${amount.toFixed(2)}`
}

function totalPaid(booking: Booking) {
  return (booking.paymentHistory || []).reduce((sum, payment) => sum + payment.amount, 0)
}

export function buildOfficialReceiptHtml(booking: Booking, payment: PaymentRecord) {
  const receiptNo = formatReceiptNumber(booking.id, payment.id)
  const price = booking.price
  const paid = totalPaid(booking)
  const remaining = Math.max(0, price - paid)
  const verifiedLabel =
    payment.type === 'Deposit' ? 'Deposit Verified by FICO MANA Studio' : 'Payment Recorded'
  const paidAt = new Date(payment.date).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Official Receipt ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      background: #fff;
    }
    .wrap {
      max-width: 640px;
      margin: 0 auto;
      border: 2px solid #0500D0;
      padding: 24px;
    }
    .brand {
      text-align: center;
      margin-bottom: 20px;
    }
    .brand h1 {
      margin: 0;
      color: #0500D0;
      font-size: 28px;
      letter-spacing: 0.08em;
    }
    .brand p {
      margin: 4px 0 0;
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #5A5A8A;
    }
    .receipt-box {
      border: 2px solid #0500D0;
      background: linear-gradient(135deg, #EEF0FF 0%, #F8FAFC 100%);
      padding: 20px;
      text-align: center;
      margin: 16px 0 20px;
    }
    .receipt-box .label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #5A5A8A;
      margin: 0;
    }
    .receipt-box .number {
      margin: 10px 0 4px;
      font-size: 24px;
      font-weight: bold;
      font-family: monospace;
      color: #0500D0;
    }
    .receipt-box .status {
      margin: 0;
      font-size: 12px;
      color: #16A34A;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 8px;
    }
    td {
      padding: 8px 0;
      border-bottom: 1px solid #EEF0FF;
      vertical-align: top;
    }
    td:first-child {
      color: #5A5A8A;
      width: 42%;
    }
    td:last-child {
      font-weight: bold;
      text-align: right;
    }
    .amount {
      color: #0500D0;
      font-size: 18px;
    }
    .remaining-danger { color: #DC2626; }
    .remaining-clear { color: #16A34A; }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #D4D8F0;
      font-size: 11px;
      color: #5A5A8A;
      text-align: center;
      font-style: italic;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; }
      .wrap { border-width: 1px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <h1>FICO MANA</h1>
      <p>Self Portrait Studio</p>
    </div>

    <h2 style="margin: 0 0 12px; color: #0500D0; font-size: 18px;">Official Payment Receipt</h2>
    <p style="margin: 0 0 16px; font-size: 14px;">Hello <strong>${booking.customerName}</strong>, this document serves as proof of payment for the transaction below.</p>

    <div class="receipt-box">
      <p class="label">Official Receipt</p>
      <p class="number">${receiptNo}</p>
      <p class="status">${verifiedLabel}</p>
    </div>

    <table>
      <tr><td>Booking Reference</td><td>${booking.id}</td></tr>
      <tr><td>Transaction ID</td><td>${payment.id}</td></tr>
      <tr><td>Payment Type</td><td>${payment.type}</td></tr>
      <tr><td>Payment Method</td><td>${payment.method}</td></tr>
      <tr><td>Transaction Ref</td><td>${payment.transactionRef || 'N/A'}</td></tr>
      <tr><td>Date</td><td>${paidAt}</td></tr>
      <tr><td>Amount Paid</td><td class="amount">${formatMoney(payment.amount)}</td></tr>
      <tr><td>Package</td><td>${booking.packageName}</td></tr>
      <tr><td>Session Date</td><td>${booking.bookingDate} · ${booking.bookingTime}</td></tr>
      <tr><td>Package Total</td><td>${formatMoney(price)}</td></tr>
      <tr>
        <td>Remaining Balance</td>
        <td class="${remaining > 0 ? 'remaining-danger' : 'remaining-clear'}">${formatMoney(remaining)}</td>
      </tr>
      <tr><td>Booking Status</td><td>${booking.bookingStatus}</td></tr>
    </table>

    <div class="footer">
      Issued by FICO MANA Studio · Cabuyao Retail Plaza, Laguna · +63 49 576 5176<br />
      Please save or print this receipt and present it at the studio if requested.
    </div>
  </div>
</body>
</html>`
}

export function printOfficialReceipt(booking: Booking, payment: PaymentRecord): boolean {
  if (typeof document === 'undefined') return false

  const html = buildOfficialReceiptHtml(booking, payment)
  const iframe = document.createElement('iframe')
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;',
  )
  iframe.setAttribute('title', 'Receipt print frame')
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = frameWindow?.document
  if (!frameWindow || !frameDoc) {
    iframe.remove()
    return false
  }

  let printed = false

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1500)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      frameWindow.focus()
      frameWindow.print()
      cleanup()
    } catch {
      iframe.remove()
    }
  }

  frameDoc.open()
  frameDoc.write(html)
  frameDoc.close()

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 150)
  } else {
    iframe.addEventListener('load', () => window.setTimeout(triggerPrint, 150), { once: true })
  }

  return true
}
