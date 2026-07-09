/** Public site URL for emails and deep links (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production') return 'https://ficomana.studio'
  return 'http://localhost:3000'
}

export function resubmitBookingUrl(bookingId: string): string {
  return `${getSiteUrl()}/?booking=${encodeURIComponent(bookingId)}#resubmit`
}
