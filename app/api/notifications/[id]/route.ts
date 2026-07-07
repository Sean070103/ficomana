import { NextResponse } from 'next/server'
import { markServerNotificationRead } from '@/lib/server-store'
import { requireStaffAuth } from '@/lib/auth-api'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const { id } = await params

    if (isSupabaseConfigured()) {
      const db = await createSupabaseServerClient()
      const { error } = await db.from('notifications').update({ is_read: true }).eq('id', id)
      if (!error) return NextResponse.json({ ok: true })
    }

    await markServerNotificationRead(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
