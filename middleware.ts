import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin',
    '/api/bookings',
    '/api/bookings/:path*',
    '/api/notifications',
    '/api/notifications/:path*',
    '/api/emails/logs',
    '/auth/callback',
  ],
}
