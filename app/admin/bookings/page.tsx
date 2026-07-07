'use client'

import { useEffect, useState } from 'react'
import { getBookings, saveBooking, getBookingPackages, Booking, PaymentRecord } from '@/lib/data-store'
import { dispatchEmail } from '@/lib/email-dispatch'
import { GraduationSessionDetails } from '@/components/graduation-session-details'
import { usesMakeupSlots } from '@/lib/booking-packages'
import {
  ALL_MANA_SLOTS,
  FICO_ARRIVAL_LABEL,
  FICO_BOOKING_TIME_LABEL,
  formatSlotBookingTime,
  getSlotById,
} from '@/lib/booking-slots'
import { generateBookingId } from '@/lib/booking-id'
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit,
  ArrowUpRight,
  X,
  Save,
  Check,
  FileText
} from 'lucide-react'
import Image from 'next/image'
import {
  adminPage,
  adminTitle,
  adminSubtitle,
  adminInput,
  adminLabel,
  adminBtnPrimary,
  adminTableWrap,
  adminTableHead,
  adminTableRow,
  adminSpinnerWrap,
  adminSpinner,
  adminOverlay,
  adminDrawer,
  bookingStatusBadge,
  paymentStatusBadge,
} from '@/lib/admin-ui'

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [packageFilter, setPackageFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')

  // Selected Booking Drawer/Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStaffNotes, setEditStaffNotes] = useState('')
  const [chargeRebookingFee, setChargeRebookingFee] = useState(false)
  const [editDriveLink, setEditDriveLink] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // In-studio Payment states
  const [studioPayMethod, setStudioPayMethod] = useState<'Cash' | 'GCash' | 'Card' | 'Maya' | 'Bank Transfer'>('Cash')
  const [studioPayAmount, setStudioPayAmount] = useState<number>(0)
  const [studioPayRef, setStudioPayRef] = useState('')

  const [showWalkIn, setShowWalkIn] = useState(false)
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInDate, setWalkInDate] = useState('')
  const [walkInPackage, setWalkInPackage] = useState<'fico-package' | 'mana-makeup'>('fico-package')
  const [walkInSlotId, setWalkInSlotId] = useState('')
  const [walkInSaving, setWalkInSaving] = useState(false)
  const [packageOptions, setPackageOptions] = useState<Array<{ id: string; title: string }>>([])

  const fetchBookings = async () => {
    try {
      const data = await getBookings()
      setBookings(data)
      setFilteredBookings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
    getBookingPackages().then((pkgs) => setPackageOptions(pkgs.map((p) => ({ id: p.id, title: p.title }))))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setSearchTerm(ref)
  }, [])

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkInName || !walkInPhone || !walkInDate) return
    if (walkInPackage === 'mana-makeup' && !walkInSlotId) return

    setWalkInSaving(true)
    try {
      const slot = walkInSlotId ? getSlotById(walkInSlotId) : undefined
      const id = generateBookingId(bookings.map((b) => b.id))
      await saveBooking({
        id,
        customerName: walkInName,
        customerEmail: 'walkin@ficomana.local',
        customerPhone: walkInPhone,
        customerFbLink: '',
        customerFbName: walkInName,
        packageId: walkInPackage,
        packageName: walkInPackage === 'fico-package' ? 'FICO PACKAGE' : 'MANA PACKAGE',
        bookingDate: walkInDate,
        bookingTime: slot ? formatSlotBookingTime(slot) : FICO_BOOKING_TIME_LABEL,
        slotId: slot?.id,
        arrivalTime: slot?.arrivalTime ?? FICO_ARRIVAL_LABEL,
        shootTime: slot?.shootTime ?? 'Flexible (before 4:00 PM)',
        isWalkIn: true,
        depositAmount: 500,
        price: walkInPackage === 'fico-package' ? 3000 : 6000,
        bookingStatus: 'Confirmed',
        paymentStatus: 'Paid Deposit',
        createdAt: new Date().toISOString(),
        paymentHistory: [],
      })
      setWalkInName('')
      setWalkInPhone('')
      setWalkInDate('')
      setWalkInSlotId('')
      setShowWalkIn(false)
      await fetchBookings()
    } catch (err) {
      console.error(err)
      alert('Failed to save walk-in booking.')
    } finally {
      setWalkInSaving(false)
    }
  }

  // Apply filters in real time
  useEffect(() => {
    let result = [...bookings]

    // 1. Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(b => 
        b.customerName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        b.customerPhone.includes(term) ||
        b.customerEmail.toLowerCase().includes(term)
      )
    }

    // 2. Status filter
    if (statusFilter !== 'All') {
      result = result.filter(b => b.bookingStatus === statusFilter)
    }

    // 3. Payment filter
    if (paymentFilter !== 'All') {
      result = result.filter(b => b.paymentStatus === paymentFilter)
    }

    // 4. Package filter
    if (packageFilter !== 'All') {
      result = result.filter(b => b.packageId === packageFilter)
    }

    // 5. Date filter
    if (dateFilter) {
      result = result.filter(b => b.bookingDate === dateFilter)
    }

    setFilteredBookings(result)
  }, [searchTerm, statusFilter, paymentFilter, packageFilter, dateFilter, bookings])

  const handleOpenDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditDate(booking.bookingDate)
    setEditTime(booking.bookingTime)
    setEditStaffNotes(booking.staffNotes || '')
    setChargeRebookingFee(false)
    setEditDriveLink(booking.driveLink || '')
    setIsEditing(false)

    const paidSum = (booking.paymentHistory || []).reduce((acc, pay) => acc + pay.amount, 0)
    setStudioPayAmount(booking.price - paidSum)
    setStudioPayRef('')
    setStudioPayMethod('Cash')
  }

  const handleRecordStudioPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    const paidSumBefore = (selectedBooking.paymentHistory || []).reduce((acc, pay) => acc + pay.amount, 0)
    const maxAllowed = selectedBooking.price - paidSumBefore

    if (studioPayAmount <= 0) {
      alert('Payment amount must be greater than zero.')
      return
    }
    if (studioPayAmount > maxAllowed) {
      alert(`Payment amount cannot exceed the remaining balance of ₱${maxAllowed.toFixed(2)}.`)
      return
    }

    setSaveLoading(true)
    try {
      const newRecord: PaymentRecord = {
        id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
        amount: studioPayAmount,
        method: studioPayMethod,
        type: 'Balance Payment',
        transactionRef: studioPayRef || undefined,
        date: new Date().toISOString()
      }

      const updatedHistory = [...(selectedBooking.paymentHistory || []), newRecord]
      const totalPaid = updatedHistory.reduce((acc, pay) => acc + pay.amount, 0)
      const isFullyPaid = totalPaid >= selectedBooking.price

      const updatedBooking: Booking = {
        ...selectedBooking,
        paymentStatus: isFullyPaid ? 'Paid Full' : 'Paid Deposit',
        bookingStatus: isFullyPaid ? 'Completed' : selectedBooking.bookingStatus,
        paymentHistory: updatedHistory
      }

      await saveBooking(updatedBooking)
      setSelectedBooking(updatedBooking)
      fetchBookings()

      await dispatchEmail({ action: 'transaction_both', booking: updatedBooking, payment: newRecord })

      if (isFullyPaid) {
        await dispatchEmail({ action: 'final_receipt', booking: updatedBooking })
        alert('Payment recorded. Confirmation, receipt, and final summary emailed to customer.')
      } else {
        alert(`Payment of ₱${studioPayAmount.toFixed(2)} recorded. Confirmation and receipt emailed. Balance: ₱${(selectedBooking.price - totalPaid).toFixed(2)}`)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to record payment.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    setSaveLoading(true)
    try {
      const dateChanged = editDate !== selectedBooking.bookingDate || editTime !== selectedBooking.bookingTime
      const addedFee = (dateChanged && chargeRebookingFee) ? 500 : 0
      const driveLinkChanged = editDriveLink !== (selectedBooking.driveLink || '')

      const updatedBooking: Booking = {
        ...selectedBooking,
        bookingDate: editDate,
        bookingTime: editTime,
        staffNotes: editStaffNotes,
        price: selectedBooking.price + addedFee,
        driveLink: editDriveLink || undefined
      }
      
      await saveBooking(updatedBooking)
      setSelectedBooking(updatedBooking)
      setIsEditing(false)
      fetchBookings()

      // Send emails
      if (dateChanged) {
        await dispatchEmail({ action: 'booking_rescheduled', booking: updatedBooking, rebookingFee: addedFee })
      }

      if (driveLinkChanged && editDriveLink) {
        await dispatchEmail({ action: 'gallery_link', booking: updatedBooking, driveLink: editDriveLink })
        alert('Booking details updated. Drive link saved and emails dispatched.')
      } else {
        alert('Booking details updated successfully.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save details.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleUpdateStatus = async (booking: Booking, status: Booking['bookingStatus']) => {
    const confirmMsg = `Are you sure you want to update Booking ${booking.id} status to ${status}?`
    if (!window.confirm(confirmMsg)) return

    try {
      let payStatus = booking.paymentStatus
      if (status === 'Completed') {
        payStatus = 'Paid Full'
      } else if (status === 'Cancelled') {
        payStatus = 'Refunded'
      }

      const updatedBooking: Booking = {
        ...booking,
        bookingStatus: status,
        paymentStatus: payStatus
      }

      await saveBooking(updatedBooking)
      
      if (selectedBooking && selectedBooking.id === booking.id) {
        setSelectedBooking(updatedBooking)
      }

      // If Cancelled, email customer
      if (status === 'Cancelled') {
        await dispatchEmail({ action: 'booking_cancelled', booking: updatedBooking })
      }

      fetchBookings()
      alert(`Booking status changed to ${status}.`)
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    }
  }

  const getStatusBadgeClass = bookingStatusBadge
  const getPaymentBadgeClass = paymentStatusBadge

  if (loading) {
    return (
      <div className={adminSpinnerWrap}>
        <div className={adminSpinner} />
      </div>
    )
  }

  return (
    <div className={adminPage}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminTitle}>Booking Management</h1>
          <p className={adminSubtitle}>Search, filter, edit, reschedule, or cancel client portrait appointments.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowWalkIn((v) => !v)}
          className="bg-primary text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#03008F]"
        >
          {showWalkIn ? 'Close Walk-in' : '+ Walk-in Booking'}
        </button>
      </div>

      {showWalkIn && (
        <div className="border border-white/10 bg-[#0A0A0F] p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">In-Studio Walk-in</h2>
          <form onSubmit={handleWalkInSubmit} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input required value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Client name" className="border border-white/10 p-3 text-xs" />
            <input required value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="Phone" className="border border-white/10 p-3 text-xs" />
            <input required type="date" value={walkInDate} onChange={(e) => setWalkInDate(e.target.value)} className="border border-white/10 p-3 text-xs" />
            <select
              value={walkInPackage}
              onChange={(e) => {
                setWalkInPackage(e.target.value as 'fico-package' | 'mana-makeup')
                setWalkInSlotId('')
              }}
              className="border border-white/10 p-3 text-xs"
            >
              <option value="fico-package">FICO (No Makeup — no time slot)</option>
              <option value="mana-makeup">MANA (Makeup — pick session slot)</option>
            </select>
            {walkInPackage === 'mana-makeup' && (
              <select
                required
                value={walkInSlotId}
                onChange={(e) => setWalkInSlotId(e.target.value)}
                className="border border-white/10 p-3 text-xs sm:col-span-2"
              >
                <option value="">Select MANA slot</option>
                {ALL_MANA_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.blockLabel} · {slot.slotLabel}
                  </option>
                ))}
              </select>
            )}
            <button type="submit" disabled={walkInSaving} className="bg-primary text-white p-3 text-[10px] font-bold uppercase tracking-wider sm:col-span-2 lg:col-span-1">
              {walkInSaving ? 'Saving...' : 'Save Walk-in'}
            </button>
          </form>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="border border-white/10 bg-[#0A0A0F] p-5 shadow-sm space-y-4">
        {/* Search & Date */}
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, reference code, phone number, email address..."
              className="w-full bg-black/40 border border-white/10 focus:border-primary focus:outline-none p-3 pl-11 text-xs font-semibold"
            />
          </div>
          <div className="md:col-span-4 relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-primary focus:outline-none p-3 pl-11 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid sm:grid-cols-3 gap-4 border-t border-white/10 pt-4 flex-wrap">
          {/* Status */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Booking Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-3.5 text-xs font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>

          {/* Payment */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Payment Status</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-3.5 text-xs font-semibold"
            >
              <option value="All">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Paid Deposit">Paid Deposit</option>
              <option value="Paid Full">Paid Full</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Package */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Package Type</span>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-3.5 text-xs font-semibold"
            >
              <option value="All">All Packages</option>
              {packageOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-white/10 bg-white/[0.02] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10 text-[10px] font-bold tracking-widest text-white/40 uppercase">
              <th className="p-4 pl-6">Reference</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Package</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Deposit</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-white/45 font-semibold">
                  No bookings matching current search criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.03]/50 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-primary">{b.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{b.customerName}</div>
                    <div className="text-[10px] text-white/45 mt-0.5">{b.customerEmail}</div>
                  </td>
                  <td className="p-4 font-semibold text-white/90">{b.packageName}</td>
                  <td className="p-4">
                    <div>{b.bookingDate}</div>
                    <div className="text-[10px] text-white/45 font-mono mt-0.5">{b.bookingTime.split(' - ')[0]}</div>
                  </td>
                  <td className="p-4 text-right font-bold">₱{b.price.toFixed(2)}</td>
                  <td className="p-4 text-right text-white/50">₱{b.depositAmount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${getPaymentBadgeClass(b.paymentStatus)}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${getStatusBadgeClass(b.bookingStatus)}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <button
                      onClick={() => handleOpenDetails(b)}
                      className="p-1.5 hover:bg-primary/5 rounded-full text-white/50 hover:text-primary transition-colors inline-flex"
                      title="View details & Manage"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. CUSTOMER DETAILS DRAWER / MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
          <div className="bg-[#0A0A0F] border-l border-white/10 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/[0.03]">
              <div>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Customer Details</span>
                <h3 className="text-base font-bold text-white mt-1">{selectedBooking.customerName}</h3>
                <p className="text-[10px] font-mono text-white/40 mt-0.5">Ref: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-white/10 rounded text-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact Info Card */}
              <div className="border border-white/10 p-4 space-y-2">
                <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase border-b border-white/10 pb-1.5">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                     <p className="text-white/40 font-medium">Email Address</p>
                     <p className="font-semibold mt-0.5">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                     <p className="text-white/40 font-medium">Phone Number</p>
                     <p className="font-semibold mt-0.5">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium">Facebook Name</p>
                    <p className="font-semibold mt-0.5">{selectedBooking.customerFbName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium">Facebook Profile</p>
                    {selectedBooking.customerFbLink ? (
                      <a 
                        href={selectedBooking.customerFbLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline font-bold mt-0.5 flex items-center gap-1.5"
                      >
                        View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="text-white/50 italic mt-0.5">No link provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Info Card */}
              <form onSubmit={handleSaveDetails} className="border border-white/10 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    Session & Schedule Details
                  </h4>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] text-primary font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Reschedule
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-xs">
                  <div>
                    <p className="text-white/40 font-medium">Package</p>
                    <p className="font-semibold text-primary mt-0.5">{selectedBooking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium">Price / Balance</p>
                    <p className="font-semibold mt-0.5">
                      ₱{selectedBooking.price.toFixed(2)} / <span className="text-white/40">Bal: ₱{(selectedBooking.price - selectedBooking.depositAmount).toFixed(2)}</span>
                    </p>
                  </div>
                  
                  {isEditing ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/45 uppercase">Date</label>
                        <input
                          type="date"
                          required
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/45 uppercase">Time Slot</label>
                        <select
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                        >
                          {(usesMakeupSlots(selectedBooking.packageId)
                            ? ALL_MANA_SLOTS.map((slot) => formatSlotBookingTime(slot))
                            : [FICO_BOOKING_TIME_LABEL]
                          ).map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5">
                        <input
                          id="chargeFee"
                          type="checkbox"
                          checked={chargeRebookingFee}
                          onChange={(e) => setChargeRebookingFee(e.target.checked)}
                          className="w-3.5 h-3.5 text-primary border-white/20 focus:ring-primary"
                        />
                        <label htmlFor="chargeFee" className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide cursor-pointer select-none">
                          Apply ₱500.00 Rebooking Fee (Reschedule charges)
                        </label>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label htmlFor="editDrive" className="text-[10px] font-bold text-white/45 uppercase">Google Drive Gallery Link</label>
                        <input
                          id="editDrive"
                          type="url"
                          value={editDriveLink}
                          onChange={(e) => setEditDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <p className="text-white/40 font-medium">Appointment Time</p>
                        <p className="font-semibold text-white/90 mt-0.5">
                          {selectedBooking.bookingDate} at {selectedBooking.bookingTime}
                        </p>
                      </div>
                      {selectedBooking.driveLink && (
                        <div className="col-span-2 border-t border-white/10 pt-2 mt-1">
                          <p className="text-white/40 font-medium">Google Drive Gallery Link</p>
                          <a 
                            href={selectedBooking.driveLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-green-400 font-semibold hover:underline mt-0.5 flex items-center gap-1 text-[11px]"
                          >
                            Open Drive Gallery <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </>
                  )}

                  <GraduationSessionDetails booking={selectedBooking} />

                  {selectedBooking.note && (
                    <div className="col-span-2">
                      <p className="text-white/40 font-medium mb-1">Pre-Shoot Request Note</p>
                      <p className="bg-white/[0.03] p-2 border border-white/10 rounded leading-relaxed text-[11px] italic">
                        "{selectedBooking.note}"
                      </p>
                    </div>
                  )}

                  {/* Staff Notes input */}
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="staffNotes" className="text-[10px] font-bold text-white/45 uppercase">
                      Internal Staff Notes
                    </label>
                    <textarea
                      id="staffNotes"
                      rows={3}
                      disabled={!isEditing}
                      value={editStaffNotes}
                      onChange={(e) => setEditStaffNotes(e.target.value)}
                      placeholder="Add private staff notes, backdrop choices, or check-in records here..."
                      className="w-full bg-black/40 border border-white/10 p-2.5 text-xs font-semibold focus:border-primary focus:outline-none resize-none leading-relaxed disabled:opacity-80"
                    />
                  </div>

                  {isEditing && (
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#03008F] flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  )}
                </div>
            </form>

            {/* Payment History Ledger */}
            <div className="border border-white/10 p-4 space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase border-b border-white/10 pb-1.5">
                Payment History Ledger
              </h4>
              {(selectedBooking.paymentHistory || []).length === 0 ? (
                <p className="text-xs text-white/40">No transactions recorded.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {(selectedBooking.paymentHistory || []).map((pay, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.03] p-2.5 border border-white/10">
                      <div>
                        <p className="font-semibold text-white/90">{pay.type}</p>
                        <p className="text-[9px] text-white/40 font-mono mt-0.5">{new Date(pay.date).toLocaleDateString()} via {pay.method}</p>
                        {pay.transactionRef && (
                          <p className="text-[9px] text-white/40 font-mono mt-0.5">Ref: {pay.transactionRef}</p>
                        )}
                      </div>
                      <span className="font-bold text-white">₱{pay.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between items-center font-bold text-xs">
                    <span>Total Paid:</span>
                    <span className="text-green-400">₱{(selectedBooking.paymentHistory || []).reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Record Studio Payment Form */}
            {(() => {
              const paidSum = (selectedBooking.paymentHistory || []).reduce((acc, pay) => acc + pay.amount, 0)
              const outstanding = selectedBooking.price - paidSum
              
              if (outstanding <= 0 || selectedBooking.bookingStatus === 'Cancelled') return null
              
              return (
                <form onSubmit={handleRecordStudioPayment} className="border border-white/10 p-4 space-y-4">
                  <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase border-b border-white/10 pb-1.5">
                    Record Studio Payment
                  </h4>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-300">
                    Outstanding Balance: <strong className="text-sm font-bold text-amber-400">₱{outstanding.toFixed(2)}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/45 uppercase">Payment Method</label>
                      <select
                        value={studioPayMethod}
                        onChange={(e) => setStudioPayMethod(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Card">Card</option>
                        <option value="Maya">Maya</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/45 uppercase">Amount Received</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={outstanding}
                        value={studioPayAmount}
                        onChange={(e) => setStudioPayAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-bold text-white/45 uppercase">Transaction Reference (Optional)</label>
                    <input
                      type="text"
                      value={studioPayRef}
                      onChange={(e) => setStudioPayRef(e.target.value)}
                      placeholder="e.g. GCash Ref / Card Slip Code"
                      className="w-full bg-black/40 border border-white/10 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-3 hover:bg-[#03008F]"
                  >
                    Record In-Studio Payment
                  </button>
                </form>
              )
            })()}

            {/* Receipt Preview if exists */}
              {selectedBooking.receiptUrl && (
                <div className="border border-white/10 p-4 space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase border-b border-white/10 pb-1.5">
                    Uploaded GCash Receipt
                  </h4>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-white/[0.05] border border-white/10 relative overflow-hidden flex-shrink-0">
                      {selectedBooking.receiptUrl.endsWith('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                          <FileText className="w-8 h-8" />
                        </div>
                      ) : (
                        <Image
                          src={selectedBooking.receiptUrl}
                          alt="Receipt thumbnail"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-white/90">GCash Deposit Verification</p>
                      <p className="font-mono text-[10px] text-white/45">Ref: {selectedBooking.transactionRef || 'N/A'}</p>
                      <a
                        href={selectedBooking.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                      >
                        View Full Screen <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 bg-white/[0.03] border-t border-white/10 space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Complete */}
                <button
                  onClick={() => handleUpdateStatus(selectedBooking, 'Completed')}
                  disabled={selectedBooking.bookingStatus === 'Completed' || selectedBooking.bookingStatus === 'Cancelled'}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                </button>
                {/* Cancel */}
                <button
                  onClick={() => handleUpdateStatus(selectedBooking, 'Cancelled')}
                  disabled={selectedBooking.bookingStatus === 'Cancelled' || selectedBooking.bookingStatus === 'Completed'}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
