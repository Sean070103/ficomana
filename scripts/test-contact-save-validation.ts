import { validateBookingAvailability } from '../lib/booking-validate'
import { usesMakeupSlots } from '../lib/booking-packages'
import { ALL_MANA_SLOTS } from '../lib/booking-slots'

const slotId = ALL_MANA_SLOTS[0]?.id
if (!slotId) throw new Error('No MANA slots defined')

const occupying = {
  id: 'FM-100001',
  bookingDate: '2026-07-17',
  slotId,
  packageId: 'mana-makeup',
  bookingStatus: 'Confirmed' as const,
  bookingTime: 'Slot test',
}

const target = {
  id: 'FM-100828',
  bookingDate: '2026-07-17',
  slotId,
  packageId: 'mana-makeup',
  bookingStatus: 'Confirmed' as const,
  bookingTime: 'Slot test',
}

function scheduleUnchanged(prior: typeof target, booking: typeof target) {
  return (
    prior.bookingDate === booking.bookingDate &&
    (prior.slotId || '') === (booking.slotId || '') &&
    prior.bookingTime === booking.bookingTime &&
    prior.packageId === booking.packageId
  )
}

const createCheck = validateBookingAvailability(target, [occupying, target], { isUpdate: false })
const updateValidated = validateBookingAvailability(target, [occupying, target], { isUpdate: true })
const prior = { ...target }
const contactSave = scheduleUnchanged(prior, target)
  ? ({ ok: true } as const)
  : updateValidated

console.log('slotId:', slotId)
console.log('usesMakeupSlots(mana-makeup):', usesMakeupSlots('mana-makeup'))
console.log('create against taken slot:', createCheck)
console.log('update with validation still on:', updateValidated)
console.log('contact save (schedule unchanged skip):', contactSave)

const reschedule = { ...target, bookingDate: '2026-07-18' }
const rescheduleCheck = scheduleUnchanged(prior, reschedule)
  ? ({ ok: true } as const)
  : validateBookingAvailability(reschedule, [occupying, target], { isUpdate: true })
console.log('reschedule to empty date:', rescheduleCheck)

const pass =
  contactSave.ok === true &&
  createCheck.ok === false &&
  (createCheck as { error?: string }).error === 'This session slot is no longer available.' &&
  rescheduleCheck.ok === true

console.log(pass ? '\nPASS — contact save bypass works' : '\nFAIL')
process.exit(pass ? 0 : 1)
