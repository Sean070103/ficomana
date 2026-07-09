import type { SupabaseClient } from '@supabase/supabase-js'
import type { Booking, Notification } from '@/lib/data-store'
import { listBookings, listNotifications } from '@/lib/server-store'
import {
  listBookingsFromDb,
  listNotificationsFromDb,
  saveBookingToDb,
  addNotificationToDb,
  syncPackagesToDb,
} from '@/lib/supabase-store'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export type DbSyncResult = {
  ok: boolean
  bookingsPushed: number
  bookingsUpdated: number
  notificationsPushed: number
  packagesSynced: boolean
  message?: string
}

function notificationKey(n: Notification) {
  return `${n.bookingId}:${n.type}:${n.message.slice(0, 60)}`
}

/** Push local file-store rows into Supabase (admin client, bypasses RLS). */
export async function syncStoreToDatabase(client?: SupabaseClient | null): Promise<DbSyncResult> {
  const empty: DbSyncResult = {
    ok: false,
    bookingsPushed: 0,
    bookingsUpdated: 0,
    notificationsPushed: 0,
    packagesSynced: false,
  }

  if (!isSupabaseConfigured()) {
    return { ...empty, ok: true, message: 'Supabase not configured — file store only.' }
  }

  const db = client ?? getSupabaseAdmin()
  if (!db) {
    return { ...empty, message: 'SUPABASE_SERVICE_ROLE_KEY required for automatic DB sync.' }
  }

  let bookingsPushed = 0
  let bookingsUpdated = 0
  let notificationsPushed = 0

  const fileBookings = await listBookings()
  const dbBookings = (await listBookingsFromDb(db)) ?? []
  const dbById = new Map(dbBookings.map((b) => [b.id, b]))

  for (const booking of fileBookings) {
    const existing = dbById.get(booking.id)
    if (!existing) {
      const saved = await saveBookingToDb(db, booking)
      if (saved) bookingsPushed++
    }
    // Never overwrite existing DB rows from the file store — staff actions save
    // directly to Supabase; on Vercel the file store is read-only and stays stale.
  }

  const fileNotifications = await listNotifications()
  const dbNotifications = (await listNotificationsFromDb(db)) ?? []
  const dbNotifKeys = new Set(dbNotifications.map(notificationKey))

  for (const notif of fileNotifications) {
    if (dbNotifKeys.has(notificationKey(notif))) continue
    const saved = await addNotificationToDb(db, notif.bookingId, notif.type, notif.message)
    if (saved) notificationsPushed++
  }

  const packagesSynced = await syncPackagesToDb(db)

  return {
    ok: true,
    bookingsPushed,
    bookingsUpdated,
    notificationsPushed,
    packagesSynced,
    message:
      bookingsPushed + bookingsUpdated + notificationsPushed > 0
        ? `Synced ${bookingsPushed + bookingsUpdated} booking(s), ${notificationsPushed} notification(s).`
        : 'Database is up to date.',
  }
}

/** Load bookings — Supabase is source of truth when configured. */
export async function loadSyncedBookings(client?: SupabaseClient | null): Promise<Booking[]> {
  const fileBookings = await listBookings()

  if (!isSupabaseConfigured()) return fileBookings

  const db = client ?? getSupabaseAdmin()
  if (!db) {
    return fileBookings
  }

  await syncStoreToDatabase(db)
  const fromDb = (await listBookingsFromDb(db)) ?? []
  return fromDb.length > 0 ? fromDb : fileBookings
}
