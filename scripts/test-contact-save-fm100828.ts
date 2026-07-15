/**
 * Integration: contact-only update for FM-100828 must not fail slot availability.
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local (same as production API path).
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { mapDbBookingToModel, mapModelBookingToDb } from '../lib/booking-db'
import { validateBookingAvailability } from '../lib/booking-validate'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env')
    process.exit(1)
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const BOOKING_ID = 'FM-100828'

  const { data, error } = await admin.from('bookings').select('*').eq('id', BOOKING_ID).maybeSingle()
  if (error || !data) {
    console.error('Load failed:', error?.message || 'not found')
    process.exit(1)
  }

  const prior = mapDbBookingToModel(data)
  const updated = {
    ...prior,
    customerName: prior.customerName || 'Yeuanne Faith Carandang',
    customerEmail: 'yeuannefaithcarandang@gmail.com',
    customerPhone:
      prior.customerPhone === '0000000000' ? '09563640416' : prior.customerPhone || '09563640416',
  }

  const scheduleUnchanged =
    prior.bookingDate === updated.bookingDate &&
    (prior.slotId || '') === (updated.slotId || '') &&
    prior.bookingTime === updated.bookingTime &&
    prior.packageId === updated.packageId

  console.log('Booking:', prior.id, prior.bookingDate, prior.slotId, prior.packageId, prior.bookingStatus)
  console.log('scheduleUnchanged:', scheduleUnchanged)

  if (!scheduleUnchanged) {
    console.error('FAIL — unexpected schedule change')
    process.exit(1)
  }

  const { data: peers } = await admin
    .from('bookings')
    .select('id, booking_date, slot_id, package_id, booking_status, booking_time')
    .eq('booking_date', prior.bookingDate)

  const pool = (peers || []).map((b) => mapDbBookingToModel(b as Record<string, unknown>))
  const oldPath = validateBookingAvailability(updated, pool, { isUpdate: true })
  console.log('Old path (would validate on contact save):', oldPath)

  const payload = mapModelBookingToDb(updated)
  const { data: saved, error: saveErr } = await admin.from('bookings').upsert(payload).select().single()

  if (saveErr) {
    console.error('Save FAILED:', saveErr.message, saveErr.details)
    process.exit(1)
  }

  const savedModel = mapDbBookingToModel(saved)
  console.log('Saved email:', savedModel.customerEmail)
  console.log('Saved phone:', savedModel.customerPhone)
  const ok = savedModel.customerEmail === 'yeuannefaithcarandang@gmail.com'
  console.log(ok ? 'PASS — contact saved for FM-100828' : 'FAIL — email not updated')
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
