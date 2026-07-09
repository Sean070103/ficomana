import { config } from 'dotenv'
config({ path: '.env.local' })

const { sendPaymentRejectedEmail } = await import('../lib/email.ts')
const { getResendFromAddress } = await import('../lib/resend-config.ts')

const booking = {
  id: 'FM-TEST-REJECT',
  customerName: 'Sean Michael Andrew Mendoza',
  customerEmail: 'mendozaseanmichaelandrewb2345@gmail.com',
  packageName: 'MANA PACKAGE',
  bookingDate: '2026-07-18',
  bookingTime: '1:00 PM',
}

console.log('FROM:', getResendFromAddress())
const result = await sendPaymentRejectedEmail(
  booking,
  'The uploaded image does not appear to be a genuine GCash or BPI payment screenshot.',
  'forged',
)
console.log('RESULT:', JSON.stringify(result, null, 2))
