'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Users, 
  Heart, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Printer, 
  RefreshCw, 
  ArrowRight,
  Bookmark
} from 'lucide-react'
import SectionHeader from '@/components/section-header'

// Define types
type SessionType = {
  id: string
  title: string
  price: string
  duration: string
  description: string
  features: string[]
  icon: any
}

const sessionTypes: SessionType[] = [
  {
    id: 'solo',
    title: 'Solo Session',
    price: '₱1,200',
    duration: '30 mins (15m shoot / 15m select)',
    description: 'A private space designed for self-expression, professional portraits, or graduation highlights.',
    features: ['1 High-resolution printed photo', 'All digital raw files included', '1 Professional digital edit', 'Private background choice'],
    icon: User,
  },
  {
    id: 'couple',
    title: 'Couple Session',
    price: '₱1,800',
    duration: '35 mins (20m shoot / 15m select)',
    description: 'Celebrate love, friendship, or partnership in an intimate, distraction-free environment.',
    features: ['2 High-resolution printed photos', 'All digital raw files included', '2 Professional digital edits', 'Private background choice'],
    icon: Heart,
  },
  {
    id: 'family',
    title: 'Family Session',
    price: '₱2,500',
    duration: '45 mins (30m shoot / 15m select)',
    description: 'Perfect for groups of 3 to 5. Capture authentic bonds and laughter without a photographer.',
    features: ['4 High-resolution printed photos', 'All digital raw files included', '4 Professional digital edits', 'Extended backdrop choices'],
    icon: Users,
  },
  {
    id: 'fur-babies',
    title: 'With Fur Babies',
    price: '₱2,000',
    duration: '35 mins (20m shoot / 15m select)',
    description: 'Capture special memories with your pets. Includes pet-friendly treats and extra studio care.',
    features: ['2 High-resolution printed photos', 'All digital raw files included', '2 Professional digital edits', 'Complimentary pet treats', 'Extra clean up fee covered'],
    icon: Sparkles,
  },
]

const timeSlots = [
  '09:00 AM - 09:45 AM',
  '10:30 AM - 11:15 AM',
  '01:00 PM - 01:45 PM',
  '02:30 PM - 03:15 PM',
  '04:00 PM - 04:45 PM',
  '05:30 PM - 06:15 PM',
]

// Helper to determine if a slot is booked based on a seed (to make it look realistic)
const isSlotBooked = (dateStr: string, slot: string) => {
  const seedStr = dateStr + slot
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % 3) === 0 // 1 in 3 chance of being booked
}

export default function Booking() {
  const [step, setStep] = useState(1)
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null)
  
  // Date & Time states
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  
  // Contact & Note states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState('')

  // Calendar logic
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const startDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isPastDate = (date: Date, day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date.getFullYear(), date.getMonth(), day)
    return checkDate < today
  }

  const isSameDay = (date1: Date | null, date2: Date, day: number) => {
    if (!date1) return false
    return (
      date1.getDate() === day &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    setSelectedTimeSlot('') // Reset time slot when date changes
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedDate || !selectedTimeSlot || !name || !email || !phone) return

    setIsSubmitting(true)
    
    // Simulate API request
    setTimeout(() => {
      const generatedId = 'FM-' + Math.floor(100000 + Math.random() * 900000)
      setBookingId(generatedId)
      setIsSubmitting(false)
      setStep(4)
    }, 1500)
  }

  const resetBooking = () => {
    setStep(1)
    setSelectedSession(null)
    setSelectedDate(null)
    setSelectedTimeSlot('')
    setName('')
    setEmail('')
    setPhone('')
    setNote('')
    setBookingId('')
  }

  const formatSelectedDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Generate calendar days
  const daysCount = daysInMonth(currentMonth)
  const startDay = startDayOfMonth(currentMonth)
  const blanks = Array(startDay).fill(null)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)
  const calendarCells = [...blanks, ...days]

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
  }

  return (
    <section id="booking" className="py-24 md:py-32 px-6 md:px-12 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Booking Portal"
          title="Reserve Your Session"
          description="Select your session, choose a slot on our interactive calendar, add special notes, and prepare for your creative photoshoot."
          align="center"
        />

        {/* Progress Bar */}
        {step < 4 && (
          <div className="max-w-xl mx-auto mb-12 relative flex justify-between items-center">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-border -translate-y-1/2 z-0" />
            <div 
              className="absolute left-0 top-1/2 h-[1px] bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                disabled={s > step && !selectedSession}
                onClick={() => setStep(s)}
                className={`w-8 h-8 flex items-center justify-center border font-sans text-xs font-semibold z-10 transition-all duration-500 ${
                  s < step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : s === step
                    ? 'bg-background border-primary text-primary shadow-sm shadow-primary/20 scale-110'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {s < step ? <Check className="w-3.5 h-3.5" /> : s}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-[500px] bg-card border border-border p-6 md:p-10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: SESSION SELECTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="heading-md mb-2">1. Choose a Session Type</h3>
                  <p className="text-sm text-muted-foreground">Select the photoshoot package that best matches your vision.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {sessionTypes.map((session) => {
                    const Icon = session.icon
                    const isSelected = selectedSession?.id === session.id
                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`group relative flex flex-col justify-between p-6 border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-primary bg-primary/[0.02] shadow-md shadow-primary/5'
                            : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                        }`}
                      >
                        <div>
                          <div className={`w-10 h-10 flex items-center justify-center mb-4 transition-colors duration-300 ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/5 text-primary group-hover:bg-primary/10'
                          }`}>
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                          
                          <h4 className="font-serif text-lg font-normal mb-1 group-hover:text-primary transition-colors">
                            {session.title}
                          </h4>
                          <p className="text-sm font-semibold text-primary mb-3">{session.price}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            {session.description}
                          </p>
                        </div>

                        <div className="border-t border-border/60 pt-4 mt-4 space-y-2">
                          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase mb-1">
                            Includes:
                          </p>
                          {session.features.map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs text-foreground/80">
                              <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={!selectedSession}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select Date & Time <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME (CALENDAR) */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="heading-md mb-2">2. Pick a Date & Time</h3>
                  <p className="text-sm text-muted-foreground">Select an available day on the calendar, then select a convenient time slot.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* CALENDAR COLUMN */}
                  <div className="lg:col-span-7 border border-border p-6 bg-card">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-semibold tracking-[0.15em] uppercase">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-2 border border-border hover:border-primary/40 hover:text-primary transition-colors duration-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-2 border border-border hover:border-primary/40 hover:text-primary transition-colors duration-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <span key={d} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
                          {d}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((cell, idx) => {
                        if (cell === null) {
                          return <div key={`blank-${idx}`} className="aspect-square" />
                        }

                        const disabled = isPastDate(currentMonth, cell)
                        const selected = isSameDay(selectedDate, currentMonth, cell)

                        return (
                          <button
                            key={`day-${cell}`}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDateSelect(cell)}
                            className={`aspect-square flex items-center justify-center font-sans text-xs border transition-all ${
                              selected
                                ? 'bg-primary border-primary text-primary-foreground font-semibold'
                                : disabled
                                ? 'text-muted-foreground/30 border-transparent cursor-not-allowed bg-transparent'
                                : 'border-transparent text-foreground hover:border-primary/30 hover:bg-secondary'
                            }`}
                          >
                            {cell}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* TIME SLOT COLUMN */}
                  <div className="lg:col-span-5 border border-border p-6 bg-card flex flex-col h-full min-h-[300px]">
                    <h4 className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" /> Available Slots
                    </h4>

                    {selectedDate ? (
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-muted-foreground mb-4">
                          Showing slots for <span className="font-semibold text-foreground">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                        <div className="grid gap-2">
                          {timeSlots.map((slot) => {
                            const dateStr = selectedDate.toDateString()
                            const booked = isSlotBooked(dateStr, slot)
                            const isSelected = selectedTimeSlot === slot

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={booked}
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`w-full py-3 px-4 border text-left text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : booked
                                    ? 'bg-secondary/40 border-border/40 text-muted-foreground/40 cursor-not-allowed line-through'
                                    : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{slot}</span>
                                  {booked ? (
                                    <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground/50 bg-secondary px-2 py-0.5 border border-border/40">Booked</span>
                                  ) : isSelected ? (
                                    <span className="text-[10px] tracking-wider uppercase font-semibold text-primary-foreground">Selected</span>
                                  ) : (
                                    <span className="text-[10px] tracking-wider uppercase font-semibold text-primary/70">Available</span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border">
                        <CalendarIcon className="w-8 h-8 text-muted-foreground/40 mb-3" strokeWidth={1} />
                        <p className="text-xs text-muted-foreground">Please select a date on the calendar to view available time slots.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 hover:border-primary/40 hover:text-primary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDate || !selectedTimeSlot}
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS & NOTE */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="heading-md mb-2">3. Complete Your Booking</h3>
                  <p className="text-sm text-muted-foreground">Provide your contact info and any special instructions/preferences for the shoot.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* SUMMARY PANEL */}
                  <div className="lg:col-span-4 border border-border p-6 bg-secondary/30 space-y-5">
                    <h4 className="text-xs font-semibold tracking-[0.15em] uppercase border-b border-border pb-3">
                      Booking Summary
                    </h4>

                    {selectedSession && (
                      <div className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Package</p>
                          <p className="font-semibold text-sm text-primary">{selectedSession.title}</p>
                          <p className="text-muted-foreground">{selectedSession.price} &bull; {selectedSession.duration}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Date</p>
                          <p className="font-medium text-foreground">{formatSelectedDate(selectedDate)}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Time Slot</p>
                          <p className="font-medium text-foreground">{selectedTimeSlot}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FORM PANEL */}
                  <form onSubmit={handleBookingSubmit} className="lg:col-span-8 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Full Name *
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Juan Dela Cruz"
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none p-3.5 text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phoneNumber" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Phone Number *
                        </label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+63 917 123 4567"
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none p-3.5 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emailAddress" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Email Address *
                      </label>
                      <input
                        id="emailAddress"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan.delacruz@gmail.com"
                        className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none p-3.5 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="shootNote" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Pre-Shoot Note / Special Requests
                        </label>
                        <span className="text-[9px] text-muted-foreground font-semibold text-primary uppercase">Requested before shoot</span>
                      </div>
                      <textarea
                        id="shootNote"
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Please request any background colors, props, lighting style adjustments, or pet details you would like before the shoot..."
                        className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none p-3.5 text-xs font-medium resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal italic">
                        Tip: You can request details such as background choice, specific lighting, props, or pet treats in this note before the shoot.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 hover:border-primary/40 hover:text-primary"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !name || !email || !phone}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            Confirm Booking <Bookmark className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* STEP 4: TICKET / RECEIPT CONFIRMATION */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-bounce">
                    <Check className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                  <div className="max-w-lg mx-auto">
                    <h3 className="heading-md text-primary mb-1">Booking Confirmed!</h3>
                    <p className="text-sm text-muted-foreground">Your private self-portrait session has been reserved. Please keep a screenshot of your digital studio pass.</p>
                  </div>
                </div>

                {/* DIGITAL PASS TICKET */}
                <div className="max-w-md mx-auto bg-card border-2 border-primary overflow-hidden relative shadow-lg">
                  {/* Perforated Top border detail */}
                  <div className="absolute top-0 left-0 right-0 h-1 flex justify-between px-2 overflow-hidden select-none pointer-events-none opacity-80">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full bg-background border border-primary -mt-1.5 flex-shrink-0" />
                    ))}
                  </div>

                  <div className="p-8 space-y-6 pt-10">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                      <div>
                        <p className="font-serif text-lg font-bold tracking-tight text-primary">FICO MANA</p>
                        <p className="text-[8px] font-medium tracking-[0.25em] text-muted-foreground uppercase">Self Portrait Studio</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-primary bg-secondary px-2.5 py-1 border border-primary/20">
                          {bookingId}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-4 text-xs font-sans">
                      <div>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-0.5">Guest</p>
                        <p className="font-semibold text-foreground truncate">{name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-0.5">Phone</p>
                        <p className="font-medium text-foreground">{phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-0.5">Package</p>
                        <p className="font-semibold text-primary">{selectedSession?.title}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-0.5">Price</p>
                        <p className="font-semibold text-foreground">{selectedSession?.price}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-0.5">Date & Time</p>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {selectedTimeSlot}
                        </p>
                      </div>

                      {/* Shoot note details */}
                      {note && (
                        <div className="col-span-2 border-t border-border pt-3 mt-1 bg-secondary/20 p-2.5 border-dashed">
                          <p className="text-muted-foreground font-medium uppercase tracking-wider text-[8px] mb-1">Pre-shoot Request Note</p>
                          <p className="text-[11px] text-foreground font-medium leading-relaxed italic break-words">
                            "{note}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer instructions */}
                    <div className="border-t border-dashed border-border pt-4 text-center space-y-4">
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Please arrive 10 minutes before your slot. Present this pass upon arrival.
                      </p>
                      
                      {/* Barcode representation */}
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="h-10 w-full bg-foreground flex justify-between items-stretch px-1">
                          {Array.from({ length: 42 }).map((_, i) => (
                            <span 
                              key={i} 
                              className="bg-background flex-shrink-0" 
                              style={{ width: `${(i % 3 === 0 ? 2 : i % 5 === 0 ? 4 : 1)}px` }} 
                            />
                          ))}
                        </div>
                        <p className="text-[8px] font-mono tracking-widest text-muted-foreground">*{bookingId}*</p>
                      </div>
                    </div>
                  </div>

                  {/* Perforated bottom border detail */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-between px-2 overflow-hidden select-none pointer-events-none opacity-80">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full bg-background border border-primary -mb-1.5 flex-shrink-0" />
                    ))}
                  </div>
                </div>

                {/* Print or Reset */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 hover:border-primary/40 hover:text-primary"
                  >
                    Print / Save Pass <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetBooking}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F]"
                  >
                    Book Another Session <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
