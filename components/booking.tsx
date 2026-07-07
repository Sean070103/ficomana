'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { User, Users, GraduationCap, ChevronLeft, ChevronRight, Check, RefreshCw, Upload, Copy, ArrowRight } from 'lucide-react'
import SectionHeader from '@/components/section-header'
import SectionShell from '@/components/section-shell'
import BookingSlotPicker from '@/components/booking-slot-picker'
import BookingGraduationPreview from '@/components/booking-graduation-preview'
import BookingSummarySidebar from '@/components/booking-summary'
import { saveBooking, uploadReceipt, getBookingsForAvailability, getBooking, getBookingPackages } from '@/lib/data-store'
import { dispatchEmail } from '@/lib/email-dispatch'
import { getBookingPackage, usesMakeupSlots, parsePackagePrice, type BookingPackage, type BookingPackageCategory } from '@/lib/booking-packages'
import {
  GRADUATION_TOGA_NOTE,
  HOOD_COLOR_GRID,
  STUDIO_BACKGROUNDS,
  TASSEL_COLORS,
  TOGA_COLORS,
} from '@/lib/graduation-booking-options'
import {
  formatDateKey,
  FICO_ARRIVAL_LABEL,
  FICO_BOOKING_TIME_LABEL,
  FICO_DAILY_LIMIT,
  formatSlotBookingTime,
  getFicoRemainingCapacity,
  getSlotById,
  isDateFullForPackage,
  isFicoDateFull,
  isSlotTaken as checkSlotTaken,
} from '@/lib/booking-slots'
import { generateBookingId } from '@/lib/booking-id'

function getPackageIcon(pkg: BookingPackage) {
  if (pkg.category === 'graduation' && pkg.slotType === 'makeup') return GraduationCap
  if (pkg.id.startsWith('mana') || pkg.id.startsWith('creative')) return Users
  return User
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STEP_LABELS = ['Package', 'Date & Slot', 'Details', 'Your Info', 'Deposit']

const inputClass =
  'w-full border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30'

const labelClass = 'text-[10px] font-bold tracking-[0.12em] uppercase text-primary'

const cardClass = 'border border-white/10 bg-white/[0.02] backdrop-blur-sm'

const btnBackClass =
  'w-full sm:w-auto border border-white/10 px-6 py-3 text-xs uppercase text-white/70 hover:border-white/30 hover:text-white text-center'

const btnPrimaryClass =
  'w-full sm:w-auto inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3 text-xs uppercase font-semibold disabled:opacity-40'

const stepNavClass =
  'flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-white/10'

function StepProgress({ step, isGraduation }: { step: number; isGraduation: boolean }) {
  const steps = isGraduation ? [1, 2, 3, 4, 5] : [1, 2, 4, 5]
  const labels = isGraduation ? STEP_LABELS : ['Package', 'Date & Slot', 'Your Info', 'Deposit']

  return (
    <div className="mb-6 sm:mb-10 px-1">
      <div className="flex items-center justify-center max-w-2xl mx-auto overflow-x-auto pb-1">
        {steps.map((num, i) => {
          const done = step > num
          const active = step === num
          return (
            <div key={num} className="flex items-center flex-1 min-w-[2.5rem] last:flex-none">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center text-xs sm:text-sm font-semibold border-2 transition-colors ${
                  done
                    ? 'bg-primary border-primary text-primary-foreground'
                    : active
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : num}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 min-w-[0.5rem] ${step > num ? 'bg-primary' : 'bg-white/10'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="hidden sm:flex justify-center gap-2 sm:gap-4 mt-3 flex-wrap px-2">
        {labels.map((l) => (
          <span key={l} className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/40">
            {l}
          </span>
        ))}
      </div>
      <p className="sm:hidden text-center text-[9px] uppercase tracking-wider text-white/50 mt-2">
        Step {steps.indexOf(step) + 1} of {steps.length}
        {steps.includes(step) && labels[steps.indexOf(step)] ? ` · ${labels[steps.indexOf(step)]}` : ''}
      </p>
    </div>
  )
}

function BookingForm() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedSession, setSelectedSession] = useState<BookingPackage | null>(null)
  const [activeCategory, setActiveCategory] = useState<BookingPackageCategory>('graduation')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fbName, setFbName] = useState('')
  const [fbLink, setFbLink] = useState('')
  const [note, setNote] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [course, setCourse] = useState('')
  const [hoodColor, setHoodColor] = useState('')
  const [togaColor, setTogaColor] = useState('Plain Black Toga')
  const [tasselColor, setTasselColor] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('Gray')
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'BPI'>('GCash')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [transactionRef, setTransactionRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [packages, setPackages] = useState<BookingPackage[]>([])
  const [copiedText, setCopiedText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getBookingsForAvailability().then(setAllBookings).catch(console.error)
    getBookingPackages().then(setPackages).catch(console.error)
  }, [])

  useEffect(() => {
    const packageId = searchParams.get('package')
    if (!packageId) return
    const pkg = getBookingPackage(packageId)
    if (!pkg) return
    setSelectedSession(pkg)
    setActiveCategory(pkg.category === 'creative' ? 'creative' : pkg.category)
    setStep(2)
  }, [searchParams])

  const isGraduationPackage = selectedSession?.category === 'graduation'
  const isMakeupPackage = selectedSession ? usesMakeupSlots(selectedSession.id) : false
  const dateKey = selectedDate ? formatDateKey(selectedDate) : ''
  const ficoRemaining = selectedDate && !isMakeupPackage ? getFicoRemainingCapacity(allBookings, dateKey) : null
  const filteredPackages = packages.filter((p) => p.category === activeCategory)
  const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const startDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay()
  const isPast = (day: number) => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < t
  }
  const isSame = (day: number) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === currentMonth.getMonth() &&
    selectedDate.getFullYear() === currentMonth.getFullYear()
  const isDayFull = (day: number) =>
    selectedSession
      ? isDateFullForPackage(allBookings, formatDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)), selectedSession.id)
      : false
  const isSlotTaken = (slotId: string) => (dateKey ? checkSlotTaken(allBookings, dateKey, slotId) : false)
  const canProceedDate = !!selectedDate && (isMakeupPackage ? !!selectedSlotId : (ficoRemaining ?? 0) > 0)

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay(currentMonth); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth(currentMonth); d++) cells.push(d)

  const pickDate = (day: number) => {
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    setSelectedSlotId('')
    setSelectedTimeSlot(isMakeupPackage ? '' : FICO_BOOKING_TIME_LABEL)
  }

  const goAfterDate = () => (isGraduationPackage ? setStep(3) : setStep(4))
  const goBackFromContact = () => (isGraduationPackage ? setStep(3) : setStep(2))

  const validateGraduationStep = () => {
    if (!schoolName || !course) {
      alert('Please enter your school name and course.')
      return false
    }
    if (!hoodColor || !togaColor || !tasselColor || !backgroundColor) {
      alert('Please select hood, toga, tassel, and background.')
      return false
    }
    return true
  }

  const validateContactStep = () => {
    if (!name || !email || !phone || !fbName || !fbLink) {
      alert('Please fill in all required contact fields.')
      return false
    }
    return true
  }

  const graduationSummary = isGraduationPackage
    ? { schoolName, course, hoodColor, togaColor, tasselColor, backgroundColor }
    : undefined

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedDate || !receiptFile || (isMakeupPackage && !selectedSlotId)) return
    setIsSubmitting(true)
    try {
      const latest = await getBookingsForAvailability()
      const dk = formatDateKey(selectedDate)
      if (!isMakeupPackage && isFicoDateFull(latest, dk)) {
        alert('Date fully booked.')
        return
      }
      if (isMakeupPackage && selectedSlotId && checkSlotTaken(latest, dk, selectedSlotId)) {
        alert('Slot taken.')
        return
      }
      const id = generateBookingId(latest.map((b) => b.id))
      const slot = isMakeupPackage ? getSlotById(selectedSlotId) : undefined
      const receiptUrl = await uploadReceipt(id, receiptFile, email)
      const graduationNote = isGraduationPackage
        ? [
            note,
            `School: ${schoolName}`,
            `Course: ${course}`,
            `Hood: ${hoodColor}`,
            `Toga: ${togaColor}`,
            `Tassel: ${tasselColor}`,
            `Background: ${backgroundColor}`,
          ]
            .filter(Boolean)
            .join(' · ')
        : note

      const booking = {
        id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerFbLink: fbLink,
        customerFbName: fbName,
        packageId: selectedSession.id,
        packageName: selectedSession.title,
        bookingDate: dk,
        bookingTime: slot ? formatSlotBookingTime(slot) : FICO_BOOKING_TIME_LABEL,
        slotId: slot?.id,
        arrivalTime: slot?.arrivalTime ?? FICO_ARRIVAL_LABEL,
        shootTime: slot?.shootTime ?? 'Flexible (before 4:00 PM)',
        note: graduationNote || undefined,
        schoolName: isGraduationPackage ? schoolName : undefined,
        course: isGraduationPackage ? course : undefined,
        hoodColor: isGraduationPackage ? hoodColor : undefined,
        togaColor: isGraduationPackage ? togaColor : undefined,
        tasselColor: isGraduationPackage ? tasselColor : undefined,
        backgroundColor: isGraduationPackage ? backgroundColor : undefined,
        depositAmount: 500,
        price: parsePackagePrice(selectedSession.price),
        transactionRef,
        bookingStatus: 'Pending Verification' as const,
        paymentStatus: 'Pending Verification' as const,
        createdAt: new Date().toISOString(),
        receiptUrl,
        paymentHistory: [
          {
            id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
            amount: 500,
            method: paymentMethod,
            type: 'Deposit' as const,
            transactionRef: transactionRef || undefined,
            date: new Date().toISOString(),
          },
        ],
      }
      const saved = await saveBooking(booking)
      await dispatchEmail({ action: 'booking_created', booking: saved })
      await dispatchEmail({ action: 'payment_received', booking: saved })
      setBookingId(id)
      setStep(6)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Submit failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBooking = () => {
    setStep(1)
    setSelectedSession(null)
    setSelectedDate(null)
    setSelectedSlotId('')
    setName('')
    setEmail('')
    setPhone('')
    setFbName('')
    setFbLink('')
    setNote('')
    setSchoolName('')
    setCourse('')
    setHoodColor('')
    setTogaColor('Plain Black Toga')
    setTasselColor('')
    setBackgroundColor('Gray')
    setReceiptFile(null)
    setTransactionRef('')
  }

  return (
    <SectionShell id="booking" variant="elevated">
      <SectionHeader
        eyebrow="Booking Portal"
        title="Reserve Your Session"
        description="Select your session, choose a slot on our interactive calendar, upload your GCash deposit receipt, and await verification."
        align="center"
      />

      <div className={`max-w-6xl mx-auto ${cardClass} p-4 sm:p-6 md:p-10`}>
        {step < 6 && <StepProgress step={step} isGraduation={!!isGraduationPackage} />}

        {/* Step 1 — Package */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-white">1. Select Your Package</h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {(['graduation', 'self-portrait', 'creative'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-wider border rounded-sm ${
                    activeCategory === c ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {c === 'self-portrait' ? 'Self Portrait' : c}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredPackages.map((pkg) => {
                const Icon = getPackageIcon(pkg)
                const selected = selectedSession?.id === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedSession(pkg)}
                    className={`text-left p-5 border rounded-sm transition-colors ${
                      selected ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-primary' : 'text-white/40'}`} />
                    <p className="font-semibold text-sm text-white">{pkg.title}</p>
                    <p className="text-primary font-medium mt-1">{pkg.price}</p>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                disabled={!selectedSession}
                onClick={() => setStep(2)}
                className={btnPrimaryClass}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Date */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-white">2. Date{isMakeupPackage ? ' & Time Slot' : ''}</h3>
            <p className="text-sm text-center text-muted-foreground">
              {isMakeupPackage ? 'MANA: 2 slots per 2-hour session.' : `FICO: max ${FICO_DAILY_LIMIT}/day, arrive before 4PM.`}
            </p>
            <div className={`grid gap-4 sm:gap-6 ${isMakeupPackage ? 'lg:grid-cols-2' : 'max-w-md mx-auto w-full'}`}>
              <div className={`${cardClass} p-4`}>
                <div className="flex justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider font-semibold text-white/70">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="text-[10px] text-white/40 py-1">{d}</span>
                  ))}
                  {cells.map((day, idx) =>
                    day === null ? (
                      <div key={idx} className="h-9" />
                    ) : (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast(day) || isDayFull(day)}
                        onClick={() => pickDate(day)}
                        className={`h-9 text-xs rounded-sm ${
                          isSame(day)
                            ? 'bg-primary text-primary-foreground font-bold'
                            : isPast(day) || isDayFull(day)
                              ? 'text-white/20 line-through'
                              : 'hover:bg-white/10 text-white/80'
                        }`}
                      >
                        {day}
                      </button>
                    ),
                  )}
                </div>
              </div>
              {isMakeupPackage && selectedDate && (
                <div className={`${cardClass} p-4`}>
                  <BookingSlotPicker selectedSlotId={selectedSlotId} onSelect={(id) => {
                    setSelectedSlotId(id)
                    const s = getSlotById(id)
                    if (s) setSelectedTimeSlot(formatSlotBookingTime(s))
                  }} isSlotTaken={isSlotTaken} />
                </div>
              )}
              {!isMakeupPackage && selectedDate && (
                <div className={`${cardClass} p-5 text-center`}>
                  <p className="text-sm font-medium text-white">{FICO_BOOKING_TIME_LABEL}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {(ficoRemaining ?? 0) > 0 ? `${ficoRemaining} of ${FICO_DAILY_LIMIT} spots left` : 'Fully booked'}
                  </p>
                </div>
              )}
            </div>
            <div className={stepNavClass}>
              <button type="button" onClick={() => setStep(1)} className={btnBackClass}>
                Back
              </button>
              <button type="button" disabled={!canProceedDate} onClick={goAfterDate} className={btnPrimaryClass}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Graduation session details (mockup layout) */}
        {step === 3 && isGraduationPackage && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!validateGraduationStep()) return
              setStep(4)
            }}
            className="space-y-6"
          >
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-white">3. Details</h3>
              <p className="text-sm text-muted-foreground">Select the color of your hood and background.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              {/* Form — below preview on mobile */}
              <div className="space-y-5 sm:space-y-6 order-2 md:order-1">
                <div>
                  <p className="font-serif text-lg sm:text-xl text-white mb-3 sm:mb-4">Details</p>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>School Name</label>
                      <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={inputClass} placeholder="Enter school name" />
                    </div>
                    <div>
                      <label className={labelClass}>Course</label>
                      <input required value={course} onChange={(e) => setCourse(e.target.value)} className={inputClass} placeholder="Enter course" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className={labelClass + ' mb-3'}>Hood Color</p>
                  <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {HOOD_COLOR_GRID.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setHoodColor(color)
                          if (!tasselColor) setTasselColor(color)
                        }}
                        className={`py-2.5 px-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide border transition-colors ${
                          hoodColor === color
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-black border-white/20 text-white hover:border-primary/50'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                  <div>
                    <p className={labelClass + ' mb-2'}>Toga</p>
                    <div className="flex flex-col gap-2">
                      {TOGA_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTogaColor(c)}
                          className={`py-2 text-[10px] uppercase border rounded-sm ${
                            togaColor === c ? 'border-primary bg-primary/20 text-primary font-semibold' : 'border-white/10 text-white/60 hover:border-white/30'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={labelClass + ' mb-2'}>Tassel</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TASSEL_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTasselColor(c)}
                          className={`px-2.5 py-1.5 text-[9px] uppercase border rounded-sm ${
                            tasselColor === c ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-primary/80 leading-relaxed">{GRADUATION_TOGA_NOTE}</p>
              </div>

              {/* Preview — shown first on mobile */}
              <div className="space-y-4 order-1 md:order-2 md:sticky md:top-4">
                <BookingGraduationPreview
                  hoodColor={hoodColor}
                  tasselColor={tasselColor}
                  togaColor={togaColor}
                />

                <div>
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary mb-3">
                    Background Color Available
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    {STUDIO_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setBackgroundColor(bg.label)}
                        className={`relative aspect-square sm:w-20 sm:h-20 md:w-24 md:h-24 overflow-hidden border-2 transition-all ${
                          backgroundColor === bg.label ? 'border-primary ring-2 ring-primary/40' : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <Image src={bg.image} alt={bg.label} fill className="object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] uppercase py-0.5 text-center">
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={stepNavClass}>
              <button type="button" onClick={() => setStep(2)} className={btnBackClass}>
                Back
              </button>
              <button type="submit" className={btnPrimaryClass + ' gap-2'}>
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 4 — Contact (mockup with sidebar) */}
        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!validateContactStep()) return
              setStep(5)
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">{isGraduationPackage ? '4. Your Information' : '3. Your Information'}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Provide your contact info and any special instructions or preferences for the shoot.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,240px)_1fr] gap-6 lg:gap-8">
              <BookingSummarySidebar
                packageInfo={selectedSession}
                bookingDate={selectedDate}
                timeSlot={selectedTimeSlot}
                graduation={graduationSummary}
              />

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Facebook Profile Name *</label>
                    <input required value={fbName} onChange={(e) => setFbName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Facebook Profile Link *</label>
                    <input required value={fbLink} onChange={(e) => setFbLink(e.target.value)} className={inputClass} placeholder="https://facebook.com/..." />
                  </div>
                </div>
                <div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between mb-1.5">
                    <label className={labelClass}>Pre-Shoot Note / Special Requests</label>
                    <span className="text-[8px] uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 border border-primary/30 w-fit">Requested before shoot</span>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Request background colors, props, or lighting adjustments..."
                    className={inputClass + ' resize-none'}
                  />
                </div>
              </div>
            </div>

            <div className={`${stepNavClass} mt-6 sm:mt-8`}>
              <button type="button" onClick={goBackFromContact} className={btnBackClass}>
                Back
              </button>
              <button type="submit" className={btnPrimaryClass + ' gap-2'}>
                Proceed to Payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 5 — Deposit */}
        {step === 5 && (
          <form onSubmit={submitBooking} className="w-full max-w-lg mx-auto space-y-5 sm:space-y-6 px-1 sm:px-0">
            <h3 className="text-lg font-semibold text-center text-white">Deposit — PHP 500</h3>
            <p className="text-sm text-center text-muted-foreground">Upload your GCash or BPI payment receipt to complete your booking.</p>
            <div className="flex gap-2 justify-center">
              {(['GCash', 'BPI'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-6 py-2 text-xs uppercase border rounded-sm font-semibold ${
                    paymentMethod === m ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Transaction reference (optional)" className={inputClass} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 p-6 sm:p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-white/[0.03] transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-white/70">{receiptFile?.name || 'Click to upload receipt *'}</p>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setReceiptFile(e.target.files[0])} />
            </div>
            <div className={stepNavClass}>
              <button type="button" onClick={() => setStep(4)} className={btnBackClass}>
                Back
              </button>
              <button type="submit" disabled={!receiptFile || isSubmitting} className={btnPrimaryClass}>
                {isSubmitting ? 'Submitting...' : 'Submit Booking'}
              </button>
            </div>
          </form>
        )}

        {/* Step 6 — Confirmation */}
        {step === 6 && (
          <div className="max-w-md mx-auto text-center space-y-5 py-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto border border-primary/30">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white">Booking Submitted</h3>
            <p className="text-sm text-muted-foreground">Your deposit is pending verification. You will receive a confirmation email once approved.</p>
            <div className="border border-primary/30 bg-primary/10 p-6">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Tracking No.</p>
              <p className="text-2xl font-bold text-primary font-mono mt-1">{bookingId}</p>
              <button type="button" onClick={() => { navigator.clipboard.writeText(bookingId); setCopiedText(true) }} className="text-[10px] text-primary mt-3 inline-flex items-center gap-1">
                <Copy className="w-3 h-3" /> {copiedText ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button type="button" onClick={resetBooking} className={btnBackClass + ' inline-flex items-center gap-2'}>
              <RefreshCw className="w-3.5 h-3.5" /> New Booking
            </button>
          </div>
        )}
      </div>
    </SectionShell>
  )
}

export default function Booking() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-white">Loading...</div>}>
      <BookingForm />
    </Suspense>
  )
}
