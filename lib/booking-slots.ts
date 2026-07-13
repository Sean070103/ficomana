import type { Booking } from '@/lib/data-store'
import type { BlockedSlot } from '@/lib/blocked-slots'
import { isSlotBlocked } from '@/lib/blocked-slots'
import type { FicoSpotBlock } from '@/lib/fico-spot-blocks'
import { getFicoBookableLimit } from '@/lib/fico-spot-blocks'
import { usesMakeupSlots } from '@/lib/booking-packages'

export const FICO_DAILY_LIMIT = 10
export const MAKEUP_SLOTS_PER_SESSION = 2
export const ARRIVAL_CUTOFF = '4:00 PM'
export const ARRIVAL_BUFFER_MINUTES = 15

export type SessionSlot = {
  id: string
  sessionId: string
  blockLabel: string
  slotLabel: string
  arrivalTime: string
  shootTime: string
  endTime: string
}

export type ManaSessionBlock = {
  timeLabel: string
  sessionId: string
  slots: [SessionSlot, SessionSlot]
}

function makeManaSlot(
  sessionId: string,
  blockLabel: string,
  slotNum: 1 | 2,
  arrivalTime: string,
  shootTime: string,
  endTime: string,
): SessionSlot {
  return {
    id: `m-${sessionId}-s${slotNum}`,
    sessionId,
    blockLabel,
    slotLabel: `SLOT ${slotNum}`,
    arrivalTime,
    shootTime,
    endTime,
  }
}

export const MANA_SESSION_BLOCKS: ManaSessionBlock[] = [
  {
    timeLabel: '8:00 AM - 10:00 AM',
    sessionId: '08-10',
    slots: [
      makeManaSlot('08-10', '8:00 AM - 10:00 AM', 1, '7:45 AM', '8:00 AM', '10:00 AM'),
      makeManaSlot('08-10', '8:00 AM - 10:00 AM', 2, '7:45 AM', '8:00 AM', '10:00 AM'),
    ],
  },
  {
    timeLabel: '10:00 AM - 12:00 PM',
    sessionId: '10-12',
    slots: [
      makeManaSlot('10-12', '10:00 AM - 12:00 PM', 1, '9:45 AM', '10:00 AM', '12:00 PM'),
      makeManaSlot('10-12', '10:00 AM - 12:00 PM', 2, '9:45 AM', '10:00 AM', '12:00 PM'),
    ],
  },
  {
    timeLabel: '1:00 PM - 3:00 PM',
    sessionId: '13-15',
    slots: [
      makeManaSlot('13-15', '1:00 PM - 3:00 PM', 1, '12:45 PM', '1:00 PM', '3:00 PM'),
      makeManaSlot('13-15', '1:00 PM - 3:00 PM', 2, '12:45 PM', '1:00 PM', '3:00 PM'),
    ],
  },
  {
    timeLabel: '3:00 PM - 5:00 PM',
    sessionId: '15-17',
    slots: [
      makeManaSlot('15-17', '3:00 PM - 5:00 PM', 1, '2:45 PM', '3:00 PM', '5:00 PM'),
      makeManaSlot('15-17', '3:00 PM - 5:00 PM', 2, '2:45 PM', '3:00 PM', '5:00 PM'),
    ],
  },
]

export const ALL_MANA_SLOTS: SessionSlot[] = MANA_SESSION_BLOCKS.flatMap((b) => [...b.slots])

/** @deprecated use ALL_MANA_SLOTS */
export const ALL_SLOTS = ALL_MANA_SLOTS

/** @deprecated use MANA_SESSION_BLOCKS */
export const SLOT_BLOCKS = MANA_SESSION_BLOCKS

/** @deprecated use ALL_MANA_SLOTS */
export const MAKEUP_SLOTS = ALL_MANA_SLOTS

export type MakeupSlot = SessionSlot

export const FICO_BOOKING_TIME_LABEL = `Operating hours · Arrive before ${ARRIVAL_CUTOFF}`
export const FICO_ARRIVAL_LABEL = `Arrive anytime before ${ARRIVAL_CUTOFF}`

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isActiveBooking(booking: Booking): boolean {
  return booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Rejected'
}

export function getBookingsForDate(bookings: Booking[], dateKey: string): Booking[] {
  return bookings.filter((b) => b.bookingDate === dateKey && isActiveBooking(b))
}

export function getSlotId(booking: Booking): string | null {
  if (booking.slotId) return booking.slotId
  const match = ALL_MANA_SLOTS.find(
    (slot) =>
      booking.bookingTime.includes(slot.blockLabel) &&
      booking.bookingTime.includes(slot.slotLabel),
  )
  return match?.id ?? null
}

/** @deprecated use getSlotId */
export function getMakeupSlotId(booking: Booking): string | null {
  return getSlotId(booking)
}

export function getFicoBookingCount(bookings: Booking[], dateKey: string): number {
  return getBookingsForDate(bookings, dateKey).filter((b) => !usesMakeupSlots(b.packageId)).length
}

export function getFicoRemainingCapacity(
  bookings: Booking[],
  dateKey: string,
  ficoSpotBlocks: FicoSpotBlock[] = [],
): number {
  const limit = getFicoBookableLimit(ficoSpotBlocks, dateKey)
  return Math.max(0, limit - getFicoBookingCount(bookings, dateKey))
}

export function isFicoDateFull(
  bookings: Booking[],
  dateKey: string,
  ficoSpotBlocks: FicoSpotBlock[] = [],
): boolean {
  return getFicoRemainingCapacity(bookings, dateKey, ficoSpotBlocks) <= 0
}

export function getMakeupBookingsCount(bookings: Booking[], dateKey: string): number {
  return getBookingsForDate(bookings, dateKey).filter((b) => usesMakeupSlots(b.packageId)).length
}

export function isMakeupDateFull(bookings: Booking[], dateKey: string): boolean {
  return ALL_MANA_SLOTS.every((slot) => isMakeupSlotTaken(bookings, dateKey, slot.id))
}

export function isDateFullForPackage(
  bookings: Booking[],
  dateKey: string,
  packageId: string,
  ficoSpotBlocks: FicoSpotBlock[] = [],
): boolean {
  return usesMakeupSlots(packageId)
    ? isMakeupDateFull(bookings, dateKey)
    : isFicoDateFull(bookings, dateKey, ficoSpotBlocks)
}

export function getMakeupSlotBookingCount(
  bookings: Booking[],
  dateKey: string,
  slotId: string,
): number {
  return getBookingsForDate(bookings, dateKey).filter(
    (b) => usesMakeupSlots(b.packageId) && getSlotId(b) === slotId,
  ).length
}

export function isMakeupSlotTaken(bookings: Booking[], dateKey: string, slotId: string): boolean {
  return getMakeupSlotBookingCount(bookings, dateKey, slotId) >= 1
}

export function getSessionBlockById(sessionId: string): ManaSessionBlock | undefined {
  return MANA_SESSION_BLOCKS.find((block) => block.sessionId === sessionId)
}

export function getSessionBlockForSlot(slotId: string): ManaSessionBlock | undefined {
  const slot = getSlotById(slotId)
  if (!slot) return undefined
  return getSessionBlockById(slot.sessionId)
}

export function isMakeupSessionFull(
  bookings: Booking[],
  dateKey: string,
  sessionId: string,
): boolean {
  const block = getSessionBlockById(sessionId)
  if (!block) return false
  return block.slots.every((slot) => isMakeupSlotTaken(bookings, dateKey, slot.id))
}

export function isSlotTaken(bookings: Booking[], dateKey: string, slotId: string): boolean {
  return isMakeupSlotTaken(bookings, dateKey, slotId)
}

/** Booked or admin-blocked — slot cannot be selected. */
export function isSlotUnavailable(
  bookings: Booking[],
  blockedSlots: BlockedSlot[],
  dateKey: string,
  slotId: string,
): boolean {
  return isSlotTaken(bookings, dateKey, slotId) || isSlotBlocked(blockedSlots, dateKey, slotId)
}

export function getSlotById(slotId: string): SessionSlot | undefined {
  return ALL_MANA_SLOTS.find((slot) => slot.id === slotId)
}

/** @deprecated use getSlotById */
export function getMakeupSlotById(slotId: string): SessionSlot | undefined {
  return getSlotById(slotId)
}

export function formatSlotBookingTime(slot: SessionSlot): string {
  return `${slot.blockLabel} · ${slot.slotLabel}`
}

/** @deprecated use formatSlotBookingTime */
export function formatMakeupBookingTime(slot: SessionSlot): string {
  return formatSlotBookingTime(slot)
}

export const LATE_FEE_AMOUNT = 500
export const LATE_FEE_POLICY =
  'Clients arriving more than 15 minutes after their scheduled arrival time may incur a ₱500 late fee or forfeit their slot at staff discretion.'
