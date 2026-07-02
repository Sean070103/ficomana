'use client'

import { useState, useRef } from 'react'
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
  Bookmark,
  Upload,
  Copy,
  AlertCircle,
  FileText
} from 'lucide-react'
import SectionHeader from '@/components/section-header'
import { saveBooking, addNotification, uploadReceipt } from '@/lib/data-store'
import { sendBookingCreatedEmail, sendPaymentReceivedEmail } from '@/lib/email'

interface SessionType {
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
    description: 'Perfect for professional portraits, creative expressions, or milestones.',
    features: ['1 Person', '1 Background color', '1 Print copy & digital copy', 'All raw files included'],
    icon: User,
  },
  {
    id: 'couple',
    title: 'Couple Session',
    price: '₱1,800',
    duration: '35 mins (20m shoot / 15m select)',
    description: 'Capture your connection, friendships, or milestones together.',
    features: ['2 Persons', '1 Background color', '2 Print copies & digital copies', 'All raw files included'],
    icon: Heart,
  },
  {
    id: 'family',
    title: 'Family Session',
    price: '₱2,500',
    duration: '45 mins (30m shoot / 15m select)',
    description: 'Create lasting memories with your household or group.',
    features: ['3-5 Persons', '2 Background colors', '4 Print copies & digital copies', 'All raw files included'],
    icon: Users,
  },
  {
    id: 'fur-babies',
    title: 'With Fur Babies',
    price: '₱2,000',
    duration: '35 mins (20m shoot / 15m select)',
    description: 'Bring your pets along for a memorable portrait session.',
    features: ['2 Persons + up to 2 pets', '1 Background color', '2 Print copies & digital copies', 'All raw files included'],
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
  
  // Payment Receipt states
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [transactionRef, setTransactionRef] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [copiedText, setCopiedText] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedDate || !selectedTimeSlot || !name || !email || !phone) return
    setStep(4)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession || !selectedDate || !selectedTimeSlot || !name || !email || !phone || !receiptFile) return

    setIsSubmitting(true)
    
    try {
      const generatedId = 'FM-' + Math.floor(100000 + Math.random() * 900000)
      setBookingId(generatedId)
      
      // Upload the receipt
      const uploadedUrl = await uploadReceipt(generatedId, receiptFile)
      setReceiptUrl(uploadedUrl)
      
      const priceVal = parseFloat(selectedSession.price.replace(/[^0-9]/g, ''))
      
      const newBooking: any = {
        id: generatedId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        packageId: selectedSession.id,
        packageName: selectedSession.title,
        bookingDate: selectedDate.toISOString().split('T')[0],
        bookingTime: selectedTimeSlot,
        note: note,
        depositAmount: 500,
        price: priceVal,
        transactionRef: transactionRef,
        bookingStatus: 'Pending Verification',
        paymentStatus: 'Pending Verification',
        createdAt: new Date().toISOString(),
        receiptUrl: uploadedUrl
      }
      
      // Save record in data store
      await saveBooking(newBooking)
      
      // Alert staff via notifications
      await addNotification(
        generatedId,
        'RECEIPT_UPLOAD',
        `${name} submitted a GCash receipt for booking ${generatedId}.`
      )
      
      // Send emails
      await sendBookingCreatedEmail(newBooking)
      await sendPaymentReceivedEmail(newBooking)
      
      setStep(5)
    } catch (error) {
      console.error('Error submitting booking:', error)
    } finally {
      setIsSubmitting(false)
    }
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
    setReceiptFile(null)
    setTransactionRef('')
    setReceiptUrl('')
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

  // Copy utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFile(file)) {
        setReceiptFile(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFile(file)) {
        setReceiptFile(file)
      }
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPG, PNG, or PDF.')
      return false
    }
    if (file.size > maxSize) {
      alert('File size exceeds the 10MB limit.')
      return false
    }
    return true
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
          description="Select your session, choose a slot on our interactive calendar, upload your GCash deposit receipt, and await verification."
          align="center"
        />

        {/* Progress Bar */}
        {step < 5 && (
          <div className="max-w-xl mx-auto mb-12 relative flex justify-between items-center">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-border -translate-y-1/2 z-0" />
            <div 
              className="absolute left-0 top-1/2 h-[1px] bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            {[1, 2, 3, 4].map((s) => (
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

            {/* STEP 2: DATE & TIME */}
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
                  {/* CALENDAR */}
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

                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {calendarCells.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} />
                        }
                        const isPast = isPastDate(currentMonth, day)
                        const isSelected = isSameDay(selectedDate, currentMonth, day)
                        return (
                          <button
                            key={`day-${day}`}
                            type="button"
                            disabled={isPast}
                            onClick={() => handleDateSelect(day)}
                            className={`aspect-square flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground scale-105 font-bold shadow-md shadow-primary/20'
                                : isPast
                                ? 'text-muted-foreground/30 cursor-not-allowed line-through'
                                : 'text-foreground hover:border-primary hover:text-primary border border-transparent'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* TIME SLOTS */}
                  <div className="lg:col-span-5 border border-border p-6 bg-card space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold tracking-[0.15em] uppercase border-b border-border pb-3 mb-4">
                        Available Time Slots
                      </h4>
                      {selectedDate ? (
                        <p className="text-xs text-muted-foreground">
                          Showing slots for <span className="font-semibold text-foreground">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Please select a date on the calendar first.</p>
                      )}
                    </div>

                    {selectedDate && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {timeSlots.map((slot) => {
                          const dateStr = selectedDate.toDateString()
                          const isBooked = isSlotBooked(dateStr, slot)
                          const isSelected = selectedTimeSlot === slot
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isBooked}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`p-3.5 text-left text-xs font-semibold border flex flex-col justify-between h-[80px] transition-all duration-300 ${
                                isSelected
                                  ? 'border-primary bg-primary/[0.02] text-primary shadow-sm shadow-primary/10'
                                  : isBooked
                                  ? 'border-border bg-secondary/50 text-muted-foreground/40 cursor-not-allowed line-through'
                                  : 'border-border bg-card text-foreground hover:border-primary/40'
                              }`}
                            >
                              <span className="font-mono text-[10px]">{slot.split(' - ')[0]}</span>
                              <span className={`text-[9px] uppercase tracking-wider ${
                                isSelected ? 'text-primary' : isBooked ? 'text-muted-foreground/30' : 'text-muted-foreground'
                              }`}>
                                {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/60">
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

            {/* STEP 3: CONTACT DETAILS */}
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
                  {/* SUMMARY */}
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

                  {/* FORM */}
                  <form onSubmit={handleDetailsSubmit} className="lg:col-span-8 space-y-6">
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
                        disabled={!name || !email || !phone}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F]"
                      >
                        Proceed to Payment <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* STEP 4: GCASH MANUAL DEPOSIT */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="heading-md mb-2">4. Secure Your Booking</h3>
                  <p className="text-sm text-muted-foreground">Scan or pay the deposit via GCash and upload your payment receipt below.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* GCASH QR & DETAILS */}
                  <div className="lg:col-span-5 border border-border p-6 bg-card space-y-6 flex flex-col items-center">
                    <h4 className="text-xs font-semibold tracking-[0.15em] uppercase border-b border-border pb-3 w-full text-center">
                      GCash Payment Instructions
                    </h4>

                    {/* QR Mockup */}
                    <div className="w-[180px] h-[180px] bg-secondary border border-border flex flex-col items-center justify-center p-4 relative shadow-inner">
                      {/* GCash logo header */}
                      <div className="absolute top-2 left-2 right-2 text-center text-[10px] font-sans font-bold text-primary">
                        GCash Official QR
                      </div>
                      
                      {/* Stylized QR patterns */}
                      <div className="w-28 h-28 border-2 border-primary flex items-center justify-center p-1.5 bg-white">
                        <svg className="w-full h-full text-foreground fill-current" viewBox="0 0 24 24">
                          <path d="M0 0h6v6H0zM2 2h2v2H2zM8 0h6v1H8zM18 0h6v6h-6zM20 2h2v2h-2zM0 8h1v6H0zM3 10h3v2H3zM9 8h2v2H9zM15 8h3v3h-3zM0 18h6v6H0zM2 20h2v2H2zM10 18h2v3h-2zM14 20h2v4h-2zM18 18h6v6h-6zM20 20h2v2h-2z" />
                          <circle cx="12" cy="12" r="2" className="text-primary fill-current" />
                        </svg>
                      </div>
                    </div>

                    <div className="w-full space-y-4 text-xs">
                      <div className="bg-secondary/40 p-3.5 border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account Name:</span>
                          <span className="font-semibold">FICO MANA Studio</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">GCash Number:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                            <span>0917 123 4567</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('09171234567')}
                              className="p-1 hover:bg-primary/5 rounded transition-colors"
                              title="Copy number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/60 pt-2 mt-2">
                          <span className="text-muted-foreground font-semibold">Deposit Required:</span>
                          <span className="font-bold text-sm text-primary">₱500.00</span>
                        </div>
                      </div>

                      {copiedText && (
                        <p className="text-[10px] text-green-600 font-semibold text-center uppercase tracking-wider animate-pulse">
                          GCash Number copied to clipboard!
                        </p>
                      )}

                      <ol className="list-decimal pl-4 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                        <li>Scan the QR code above or send deposit to the GCash number.</li>
                        <li>Pay the required deposit of <strong>₱500.00</strong>.</li>
                        <li>Save a screenshot of your successful transaction.</li>
                        <li>Upload your payment receipt screenshot below.</li>
                      </ol>
                    </div>
                  </div>

                  {/* FILE UPLOAD & SUBMIT */}
                  <form onSubmit={handleBookingSubmit} className="lg:col-span-7 space-y-6">
                    <h4 className="text-xs font-semibold tracking-[0.15em] uppercase border-b border-border pb-3">
                      Upload Receipt
                    </h4>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
                        dragActive
                          ? 'border-primary bg-primary/[0.02]'
                          : receiptFile
                          ? 'border-green-500 bg-green-500/[0.01]'
                          : 'border-border hover:border-primary/40 bg-card'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {receiptFile ? (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-green-100 border border-green-200 flex items-center justify-center text-green-600 mx-auto rounded-full">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold truncate max-w-[280px]">{receiptFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(receiptFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setReceiptFile(null)
                            }}
                            className="text-[10px] text-red-500 font-semibold uppercase hover:underline"
                          >
                            Remove and select another
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mx-auto rounded-full">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">Drag & drop your GCash receipt here, or <span className="text-primary hover:underline">browse</span></p>
                            <p className="text-[10px] text-muted-foreground mt-1">Supports JPG, PNG, and PDF (Max 1MB for local storage mode, up to 10MB default)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="refNumber" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Transaction Reference Number (Optional)
                      </label>
                      <input
                        id="refNumber"
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 5012 345 6789"
                        className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none p-3.5 text-xs font-medium font-mono"
                      />
                    </div>

                    {/* Notice Banner */}
                    <div className="bg-primary/5 border border-primary/10 p-4 flex gap-3 text-xs text-primary/80">
                      <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Important:</strong> Bookings are reserved only after payment receipt verification by our studio staff. You will receive an email update within 1-2 hours.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 hover:border-primary/40 hover:text-primary"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !receiptFile}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            Submit Booking <Bookmark className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PENDING VERIFICATION / CONFIRMATION RECEIPT */}
            {step === 5 && (
              <motion.div
                key="step5"
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
                    <h3 className="heading-md text-primary mb-1">Booking Submitted!</h3>
                    <p className="text-sm text-muted-foreground">Your request has been saved. Please review your pending digital studio pass.</p>
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
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-primary bg-secondary px-2.5 py-1 border border-primary/20">
                          {bookingId}
                        </span>
                        {/* Status Badge */}
                        <span className="text-[8px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200">
                          Pending Verification
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
                      <div className="bg-yellow-50 text-yellow-800 border border-yellow-100 p-3 text-[10px] text-left leading-relaxed">
                        <strong>Receipt Uploaded:</strong> Our staff is checking your deposit transaction ref. You will receive your confirmed ticket via email at <strong>{email}</strong> once payment is approved.
                      </div>
                      
                      {/* Barcode representation */}
                      <div className="flex flex-col items-center justify-center space-y-1 opacity-50">
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

                {/* Reset */}
                <div className="flex justify-center gap-3 pt-4">
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
