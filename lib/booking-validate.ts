import type { Booking } from '@/lib/data-store'
import { usesMakeupSlots } from '@/lib/booking-packages'
import {
  isActiveBooking,
  isDateFullForPackage,
  isSlotTaken,
} from '@/lib/booking-slots'

type AvailabilityBooking = Pick<
  Booking,
  'id' | 'bookingDate' | 'slotId' | 'packageId' | 'bookingStatus' | 'bookingTime'
>

/** Server-side slot / capacity check before accepting a booking. */
export function validateBookingAvailability(
  booking: AvailabilityBooking,
  existing: AvailabilityBooking[],
  options?: { isUpdate?: boolean },
): { ok: true } | { ok: false; error: string } {
  if (booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'Rejected') {
    return { ok: true }
  }

  const others = existing.filter(
    (b) => b.id !== booking.id && isActiveBooking(b as Booking),
  )

  if (isDateFullForPackage(others as Booking[], booking.bookingDate, booking.packageId)) {
    return { ok: false, error: 'This date is fully booked for the selected package.' }
  }

  if (usesMakeupSlots(booking.packageId)) {
    const slotId = booking.slotId
    if (!slotId) {
      return { ok: false, error: 'A session slot is required for this package.' }
    }
    if (isSlotTaken(others as Booking[], booking.bookingDate, slotId)) {
      return { ok: false, error: 'This session slot is no longer available.' }
    }
  }

  if (options?.isUpdate) return { ok: true }

  return { ok: true }
}
