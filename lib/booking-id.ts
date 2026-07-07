const BOOKING_ID_PATTERN = /^FM-\d{6}$/

export function isValidBookingId(id: string): boolean {
  return BOOKING_ID_PATTERN.test(id)
}

/** Generates a unique FM-XXXXXX reference checked against existing booking IDs. */
export function generateBookingId(existingIds: string[] = []): string {
  const taken = new Set(existingIds)

  for (let attempt = 0; attempt < 100; attempt++) {
    const id = `FM-${Math.floor(100000 + Math.random() * 900000)}`
    if (!taken.has(id)) return id
  }

  // Extremely unlikely fallback — still matches FM-XXXXXX format
  let fallback = `FM-${Date.now().toString().slice(-6)}`
  while (taken.has(fallback)) {
    fallback = `FM-${Math.floor(100000 + Math.random() * 900000)}`
  }
  return fallback
}
