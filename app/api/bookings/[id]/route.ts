import { NextResponse } from 'next/server'
import { getBookingById, upsertBooking } from '@/lib/server-store'
import type { Booking } from '@/lib/data-store'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { supabase } from '@/lib/supabase'
import { requireStaffAuth } from '@/lib/auth-api'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getBookingFromDb, saveBookingToDb } from '@/lib/supabase-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { user, error: authError } = await requireStaffAuth()
    const isStaff = !!user && !authError
    const db = isStaff ? await createSupabaseServerClient() : supabase

    if (isSupabaseConfigured()) {
      const booking = await getBookingFromDb(db, id)
      if (booking) {
        if (isStaff) return NextResponse.json(booking)
        return NextResponse.json({
          id: booking.id,
          bookingStatus: booking.bookingStatus,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          packageName: booking.packageName,
        })
      }
    }

    const booking = await getBookingById(id)
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isStaff) return NextResponse.json(booking)
    return NextResponse.json({
      id: booking.id,
      bookingStatus: booking.bookingStatus,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      packageName: booking.packageName,
    })
  } catch (error) {
    console.error('GET /api/bookings/[id]', error)
    return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireStaffAuth()
    if (authError) return authError

    const { id } = await params
    const booking = (await request.json()) as Booking
    if (booking.id !== id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 })
    }

    if (isSupabaseConfigured()) {
      const db = await createSupabaseServerClient()
      const saved = await saveBookingToDb(db, booking)
      if (saved) {
        await upsertBooking(saved)
        return NextResponse.json(saved)
      }
    }

    const saved = await upsertBooking(booking)
    return NextResponse.json(saved)
  } catch (error) {
    console.error('PUT /api/bookings/[id]', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
