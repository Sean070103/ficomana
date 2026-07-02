'use client'

import { useEffect, useState } from 'react'
import { getBookings, saveBooking, Booking, PaymentRecord } from '@/lib/data-store'
import { sendBookingCancelledEmail, sendPaymentApprovedEmail, sendFinalOfficialReceiptEmail } from '@/lib/email'
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
  const [saveLoading, setSaveLoading] = useState(false)

  // In-studio Payment states
  const [studioPayMethod, setStudioPayMethod] = useState<'Cash' | 'GCash' | 'Card' | 'Maya' | 'Bank Transfer'>('Cash')
  const [studioPayAmount, setStudioPayAmount] = useState<number>(0)
  const [studioPayRef, setStudioPayRef] = useState('')

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
  }, [])

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

      if (isFullyPaid) {
        await sendFinalOfficialReceiptEmail(updatedBooking)
        alert('Outstanding balance fully paid! Final Official Receipt emailed to customer.')
      } else {
        alert(`Payment of ₱${studioPayAmount.toFixed(2)} recorded. Outstanding balance: ₱${(selectedBooking.price - totalPaid).toFixed(2)}`)
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
      const updatedBooking: Booking = {
        ...selectedBooking,
        bookingDate: editDate,
        bookingTime: editTime,
        staffNotes: editStaffNotes
      }
      
      await saveBooking(updatedBooking)
      setSelectedBooking(updatedBooking)
      setIsEditing(false)
      fetchBookings()
      alert('Booking details updated successfully.')
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
        await sendBookingCancelledEmail(updatedBooking)
      }

      fetchBookings()
      alert(`Booking status changed to ${status}.`)
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    }
  }

  const getStatusBadgeClass = (status: Booking['bookingStatus']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-250'
      case 'Pending Payment':
        return 'bg-orange-100 text-orange-850 border border-orange-200'
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'No Show':
        return 'bg-gray-100 text-gray-800 border border-gray-200'
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200'
    }
  }

  const getPaymentBadgeClass = (status: Booking['paymentStatus']) => {
    switch (status) {
      case 'Paid Full':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'Paid Deposit':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-850 border border-yellow-200'
      case 'Unpaid':
        return 'bg-red-50 text-red-800 border border-red-100'
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#0500D0] border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Booking Management</h1>
        <p className="text-xs text-slate-500">Search, filter, edit, reschedule, or cancel client portrait appointments.</p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Search & Date */}
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, reference code, phone number, email address..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none p-3 pl-11 text-xs font-semibold"
            />
          </div>
          <div className="md:col-span-4 relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none p-3 pl-11 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 flex-wrap">
          {/* Status */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Booking Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs font-semibold"
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
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Payment Status</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs font-semibold"
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
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Package Type</span>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs font-semibold"
            >
              <option value="All">All Packages</option>
              <option value="solo">Solo Session</option>
              <option value="couple">Couple Session</option>
              <option value="family">Family Session</option>
              <option value="fur-babies">With Fur Babies</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
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
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-450 font-semibold">
                  No bookings matching current search criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-primary">{b.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{b.customerName}</div>
                    <div className="text-[10px] text-slate-450 mt-0.5">{b.customerEmail}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{b.packageName}</td>
                  <td className="p-4">
                    <div>{b.bookingDate}</div>
                    <div className="text-[10px] text-slate-450 font-mono mt-0.5">{b.bookingTime.split(' - ')[0]}</div>
                  </td>
                  <td className="p-4 text-right font-bold">₱{b.price.toFixed(2)}</td>
                  <td className="p-4 text-right text-slate-500">₱{b.depositAmount.toFixed(2)}</td>
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
                      className="p-1.5 hover:bg-primary/5 rounded-full text-slate-500 hover:text-primary transition-colors inline-flex"
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
        <div className="fixed inset-0 bg-slate-900/60 flex justify-end z-50 animate-fade-in">
          <div className="bg-white border-l border-slate-200 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer Details</span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{selectedBooking.customerName}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Ref: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact Info Card */}
              <div className="border border-slate-200 p-4 space-y-2">
                <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-1.5">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <p className="text-slate-400 font-medium">Email Address</p>
                    <p className="font-semibold mt-0.5">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Phone Number</p>
                    <p className="font-semibold mt-0.5">{selectedBooking.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info Card */}
              <form onSubmit={handleSaveDetails} className="border border-slate-200 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
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
                    <p className="text-slate-400 font-medium">Package</p>
                    <p className="font-semibold text-primary mt-0.5">{selectedBooking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Price / Balance</p>
                    <p className="font-semibold mt-0.5">
                      ₱{selectedBooking.price.toFixed(2)} / <span className="text-slate-400">Bal: ₱{(selectedBooking.price - selectedBooking.depositAmount).toFixed(2)}</span>
                    </p>
                  </div>
                  
                  {isEditing ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Date</label>
                        <input
                          type="date"
                          required
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Time Slot</label>
                        <select
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                        >
                          <option value="09:00 AM - 09:45 AM">09:00 AM - 09:45 AM</option>
                          <option value="10:30 AM - 11:15 AM">10:30 AM - 11:15 AM</option>
                          <option value="01:00 PM - 01:45 PM">01:00 PM - 01:45 PM</option>
                          <option value="02:30 PM - 03:15 PM">02:30 PM - 03:15 PM</option>
                          <option value="04:00 PM - 04:45 PM">04:00 PM - 04:45 PM</option>
                          <option value="05:30 PM - 06:15 PM">05:30 PM - 06:15 PM</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-slate-400 font-medium">Appointment Time</p>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {selectedBooking.bookingDate} at {selectedBooking.bookingTime}
                      </p>
                    </div>
                  )}

                  {selectedBooking.note && (
                    <div className="col-span-2">
                      <p className="text-slate-400 font-medium mb-1">Pre-Shoot Request Note</p>
                      <p className="bg-slate-50 p-2 border border-slate-100 rounded leading-relaxed text-[11px] italic">
                        "{selectedBooking.note}"
                      </p>
                    </div>
                  )}

                  {/* Staff Notes input */}
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="staffNotes" className="text-[10px] font-bold text-slate-450 uppercase">
                      Internal Staff Notes
                    </label>
                    <textarea
                      id="staffNotes"
                      rows={3}
                      disabled={!isEditing}
                      value={editStaffNotes}
                      onChange={(e) => setEditStaffNotes(e.target.value)}
                      placeholder="Add private staff notes, backdrop choices, or check-in records here..."
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-semibold focus:border-primary focus:outline-none resize-none leading-relaxed disabled:opacity-80"
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
            <div className="border border-slate-200 p-4 space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-1.5">
                Payment History Ledger
              </h4>
              {(selectedBooking.paymentHistory || []).length === 0 ? (
                <p className="text-xs text-slate-400">No transactions recorded.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {(selectedBooking.paymentHistory || []).map((pay, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-700">{pay.type}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(pay.date).toLocaleDateString()} via {pay.method}</p>
                        {pay.transactionRef && (
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {pay.transactionRef}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-800">₱{pay.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center font-bold text-xs">
                    <span>Total Paid:</span>
                    <span className="text-green-600">₱{(selectedBooking.paymentHistory || []).reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
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
                <form onSubmit={handleRecordStudioPayment} className="border border-slate-200 p-4 space-y-4">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-1.5">
                    Record Studio Payment
                  </h4>
                  
                  <div className="bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800">
                    Outstanding Balance: <strong className="text-sm font-bold text-amber-700">₱{outstanding.toFixed(2)}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Payment Method</label>
                      <select
                        value={studioPayMethod}
                        onChange={(e) => setStudioPayMethod(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Card">Card</option>
                        <option value="Maya">Maya</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Amount Received</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={outstanding}
                        value={studioPayAmount}
                        onChange={(e) => setStudioPayAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Transaction Reference (Optional)</label>
                    <input
                      type="text"
                      value={studioPayRef}
                      onChange={(e) => setStudioPayRef(e.target.value)}
                      placeholder="e.g. GCash Ref / Card Slip Code"
                      className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:border-primary focus:outline-none"
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
                <div className="border border-slate-200 p-4 space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-1.5">
                    Uploaded GCash Receipt
                  </h4>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-100 border border-slate-150 relative overflow-hidden flex-shrink-0">
                      {selectedBooking.receiptUrl.endsWith('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
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
                      <p className="font-semibold text-slate-700">GCash Deposit Verification</p>
                      <p className="font-mono text-[10px] text-slate-450">Ref: {selectedBooking.transactionRef || 'N/A'}</p>
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
            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
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
