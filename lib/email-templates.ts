export type EmailTemplateId =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'payment_received'
  | 'payment_approved'

export type EmailTemplate = {
  id: EmailTemplateId
  name: string
  subject: string
  body: string
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Booking Confirmed — {{bookingId}}',
    body: `<h2>FICO MANA</h2>
<p>Hello <strong>{{customerName}}</strong>,</p>
<p>Your booking is confirmed. Please review your schedule below.</p>
<table>
<tr><td>Reference</td><td><strong>{{bookingId}}</strong></td></tr>
<tr><td>Package</td><td><strong>{{packageName}}</strong></td></tr>
<tr><td>Date</td><td><strong>{{bookingDate}}</strong></td></tr>
<tr><td>Arrival Time</td><td><strong>{{arrivalTime}}</strong></td></tr>
<tr><td>Shoot Time</td><td><strong>{{shootTime}}</strong></td></tr>
<tr><td>Deposit</td><td><strong>₱{{depositAmount}}</strong></td></tr>
</table>
<p><strong>Preparation:</strong> Arrive on time, bring valid ID, and come photo-ready. Late arrivals beyond 15 minutes may incur a ₱500 fee.</p>
<p>{{lateFeePolicy}}</p>`,
  },
  {
    id: 'booking_reminder',
    name: 'Session Reminder',
    subject: 'Reminder — Your FICO MANA Session on {{bookingDate}}',
    body: `<h2>FICO MANA</h2>
<p>Hello <strong>{{customerName}}</strong>,</p>
<p>This is a friendly reminder for your upcoming session.</p>
<table>
<tr><td>Reference</td><td><strong>{{bookingId}}</strong></td></tr>
<tr><td>Package</td><td><strong>{{packageName}}</strong></td></tr>
<tr><td>Date</td><td><strong>{{bookingDate}}</strong></td></tr>
<tr><td>Arrival Time</td><td><strong>{{arrivalTime}}</strong></td></tr>
<tr><td>Shoot Time</td><td><strong>{{shootTime}}</strong></td></tr>
</table>
<p><strong>Please note:</strong> Arrival time and shoot time are different. Arrive at <strong>{{arrivalTime}}</strong> so your shoot can begin at <strong>{{shootTime}}</strong>.</p>
<p>{{lateFeePolicy}}</p>`,
  },
  {
    id: 'payment_received',
    name: 'Payment Received',
    subject: 'Receipt Uploaded — {{bookingId}}',
    body: `<h2>FICO MANA</h2>
<p>Hello <strong>{{customerName}}</strong>,</p>
<p>We received your payment receipt and are verifying it now.</p>
<p>Reference: <strong>{{bookingId}}</strong></p>`,
  },
  {
    id: 'payment_approved',
    name: 'Payment Approved',
    subject: 'Booking Confirmed — {{bookingId}}',
    body: `<h2>FICO MANA</h2>
<p>Hello <strong>{{customerName}}</strong>,</p>
<p>Your deposit has been verified. Your booking is now <strong>confirmed</strong>.</p>
<p>Reference: <strong>{{bookingId}}</strong> · Package: <strong>{{packageName}}</strong></p>
<p>Session: <strong>{{bookingDate}}</strong> · Arrival <strong>{{arrivalTime}}</strong> · Shoot <strong>{{shootTime}}</strong></p>
<p>Deposit: <strong>₱{{depositAmount}}</strong></p>`,
  },
]

export function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string | number | undefined>,
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))

  return {
    subject: replace(template.subject),
    body: wrapEmailHtml(replace(template.body)),
  }
}

function wrapEmailHtml(inner: string): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0A0A0F;color:#F4F4F8;border:1px solid #1E1E2E;">${inner}</div>`
}

export function getServerEmailTemplate(id: EmailTemplateId): EmailTemplate {
  return DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === id)!
}
