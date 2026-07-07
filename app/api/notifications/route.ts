import { NextResponse } from 'next/server'
import { addServerNotification, listNotifications } from '@/lib/server-store'
import { requireStaffAuth } from '@/lib/auth-api'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { listNotificationsFromDb, addNotificationToDb } from '@/lib/supabase-store'
import type { Notification } from '@/lib/data-store'

function mergeNotifications(primary: Notification[], secondary: Notification[]) {
  const map = new Map<string, Notification>()
  for (const n of [...primary, ...secondary]) {
    const key = `${n.bookingId}:${n.type}:${n.message.slice(0, 40)}`
    if (!map.has(key)) map.set(key, n)
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function GET() {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const fileNotifications = await listNotifications()

    if (isSupabaseConfigured()) {
      const db = await createSupabaseServerClient()
      const fromDb = await listNotificationsFromDb(db)
      if (fromDb) {
        return NextResponse.json(mergeNotifications(fromDb, fileNotifications))
      }
    }

    return NextResponse.json(fileNotifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const body = await request.json()
    const { bookingId, type, message } = body as {
      bookingId: string
      type: Notification['type']
      message: string
    }

    const admin = getSupabaseAdmin()
    if (isSupabaseConfigured() && admin) {
      const saved = await addNotificationToDb(admin, bookingId, type, message)
      if (saved) return NextResponse.json(saved, { status: 201 })
    }

    const notification = await addServerNotification(bookingId, type, message)
    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
