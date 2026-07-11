/**
 * Wipe all bookings, notifications, and email logs from Supabase + local JSON.
 * Usage: node scripts/clear-all-bookings.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

async function deleteAll(table, idCol = 'id') {
  const { data, error } = await db.from(table).select(idCol)
  if (error) {
    console.error(`  ${table}: fetch ERROR —`, error.message)
    return 0
  }
  const rows = data ?? []
  let deleted = 0
  for (const row of rows) {
    const id = row[idCol]
    const { error: delErr } = await db.from(table).delete().eq(idCol, id)
    if (delErr) console.error(`  ${table} ${id}:`, delErr.message)
    else deleted++
  }
  console.log(`  ${table}: deleted ${deleted} rows`)
  return deleted
}

console.log('Clearing Supabase booking data…')

// Bookings first — cascades receipts, payments, linked notifications/email_logs
await deleteAll('bookings', 'id')
// Orphans
await deleteAll('notifications', 'id')
await deleteAll('email_logs', 'id')

const { count: bookingsLeft } = await db.from('bookings').select('*', { count: 'exact', head: true })
const { count: notifsLeft } = await db.from('notifications').select('*', { count: 'exact', head: true })

writeFileSync(
  resolve(process.cwd(), 'data', 'ficomana-store.json'),
  JSON.stringify({ bookings: [], notifications: [] }, null, 2) + '\n',
)
writeFileSync(resolve(process.cwd(), 'data', 'email-logs.json'), '[]\n')

console.log(`\nDone. Bookings: ${bookingsLeft ?? 0}, Notifications: ${notifsLeft ?? 0}`)
console.log('Local data/ficomana-store.json and data/email-logs.json cleared.')
