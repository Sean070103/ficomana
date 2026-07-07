'use client'

import { useEffect, useState } from 'react'
import { getBookings, saveBooking, addNotification, Booking } from '@/lib/data-store'
import { dispatchEmail } from '@/lib/email-dispatch'
import { GraduationSessionDetails } from '@/components/graduation-session-details'
import { 
  Check, 
  X, 
  Mail, 
  Download, 
  FileText, 
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { adminPage, adminTitle, adminSubtitle, adminSpinnerWrap, adminSpinner, adminOverlay, adminModal, adminInput, adminLabel } from '@/lib/admin-ui'

export default function PaymentVerificationQueue() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('Unable to verify payment')
  const [customReason, setCustomReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchQueue = async () => {
    try {
      const data = await getBookings()
      // Filter only bookings that are pending payment verification
      const queue = data.filter(b => b.bookingStatus === 'Pending Verification')
      setBookings(queue)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleApprove = async (booking: Booking) => {
    const confirmApprove = window.confirm(`Are you sure you want to approve the payment for Booking ${booking.id}?`)
    if (!confirmApprove) return

    setActionLoading(true)
    try {
      const history = [...(booking.paymentHistory || [])]
      if (history.length === 0) {
        history.push({
          id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
          amount: booking.depositAmount,
          method: 'GCash',
          type: 'Deposit',
          transactionRef: booking.transactionRef,
          date: new Date().toISOString()
        })
      }

      const updatedBooking: Booking = {
        ...booking,
        bookingStatus: 'Confirmed',
        paymentStatus: 'Paid Deposit',
        paymentHistory: history
      }

      // 1. Save updated booking
      await saveBooking(updatedBooking)
      
      // 2. Add notification log
      await addNotification(
        booking.id,
        'NEW_BOOKING',
        `Payment for Booking ${booking.id} has been approved.`
      )

      // 3. Send booking confirmation + per-transaction confirmation & receipt
      const depositPayment = history[history.length - 1]
      await dispatchEmail({ action: 'payment_approved', booking: updatedBooking })
      if (depositPayment) {
        await dispatchEmail({ action: 'transaction_both', booking: updatedBooking, payment: depositPayment })
      }

      alert(`Booking ${booking.id} confirmed! Confirmation and receipt emails sent.`)
      setShowReceiptModal(false)
      setSelectedBooking(null)
      fetchQueue()
    } catch (err) {
      console.error(err)
      alert('Failed to approve payment.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason
    if (!finalReason) {
      alert('Please enter a rejection reason.')
      return
    }

    setActionLoading(true)
    try {
      const updatedBooking: Booking = {
        ...selectedBooking,
        bookingStatus: 'Pending Payment', // returns to pending payment
        paymentStatus: 'Unpaid',
        rejectionReason: finalReason
      }

      // 1. Save updated booking
      await saveBooking(updatedBooking)

      // 2. Add notification log
      await addNotification(
        selectedBooking.id,
        'CANCELLED',
        `Payment receipt for Booking ${selectedBooking.id} was rejected. Reason: ${finalReason}`
      )

      // 3. Send email to upload new receipt
      await dispatchEmail({ action: 'payment_rejected', booking: updatedBooking, reason: finalReason })

      alert(`Booking ${selectedBooking.id} payment rejected. Customer notified via email.`)
      setShowRejectModal(false)
      setShowReceiptModal(false)
      setSelectedBooking(null)
      setCustomReason('')
      fetchQueue()
    } catch (err) {
      console.error(err)
      alert('Failed to reject payment.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={adminSpinnerWrap}>
        <div className={adminSpinner} />
      </div>
    )
  }

  return (
    <div className={adminPage}>
      <div>
        <h1 className={adminTitle}>Payment Verification</h1>
        <p className={adminSubtitle}>Review uploaded GCash screenshots and approve or reject sessions.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-white/10 bg-[#0A0A0F] p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 rounded-full mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Verification Queue Empty</h3>
          <p className="text-xs text-white/40 mt-1">All booking deposits have been verified. Excellent job!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((booking) => (
            <div key={booking.id} className="border border-white/10 bg-white/[0.02] flex flex-col justify-between overflow-hidden">
              {/* Receipt Preview Thumbnail */}
              <div 
                className="h-48 bg-white/[0.05] relative overflow-hidden group cursor-pointer border-b border-white/10"
                onClick={() => {
                  setSelectedBooking(booking)
                  setShowReceiptModal(true)
                }}
              >
                {booking.receiptUrl ? (
                  booking.receiptUrl.endsWith('.pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
                      <FileText className="w-12 h-12 text-[#0500D0]/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">PDF Receipt Document</span>
                    </div>
                  ) : (
                    <Image
                      src={booking.receiptUrl}
                      alt="Receipt preview"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    No receipt image
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold uppercase tracking-widest">
                  View Large Receipt
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-semibold text-white">{booking.customerName}</h3>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{booking.id}</p>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase">
                    {booking.packageName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <p className="text-white/40 font-medium text-[9px] uppercase tracking-wider">Date & Time</p>
                    <p className="font-semibold text-white/90">{booking.bookingDate}</p>
                    <p className="text-white/50 text-[10px] mt-0.5">{booking.bookingTime}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[9px] uppercase tracking-wider">GCash Transaction Ref</p>
                    <p className="font-mono font-bold text-white/90">{booking.transactionRef || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white/40 font-medium">Deposit Amount:</span>
                      <span className="font-bold text-[#0500D0]">₱{booking.depositAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white/[0.03] px-5 py-3 border-t border-white/10 flex gap-2">
                <button
                  onClick={() => handleApprove(booking)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedBooking(booking)
                    setShowRejectModal(true)
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. RECEIPT VIEWER MODAL */}
      {showReceiptModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="border border-white/10 bg-[#0A0A0F] shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            {/* Receipt Preview Panel */}
            <div className="md:w-1/2 bg-white/[0.05] border-r border-white/10 relative min-h-[300px] flex items-center justify-center">
              {selectedBooking.receiptUrl ? (
                selectedBooking.receiptUrl.endsWith('.pdf') ? (
                  <div className="p-12 text-center text-white/50 space-y-4">
                    <FileText className="w-20 h-20 text-[#0500D0]/50 mx-auto" />
                    <p className="text-sm font-semibold uppercase tracking-wider">PDF Receipt Attachment</p>
                    <a 
                      href={selectedBooking.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs text-[#0500D0] font-bold hover:underline"
                    >
                      Open PDF in new tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full relative aspect-square md:aspect-auto">
                    <Image
                      src={selectedBooking.receiptUrl}
                      alt="GCash Receipt Large"
                      fill
                      className="object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="text-white/40">No receipt file uploaded</div>
              )}
            </div>

            {/* Receipt Details Panel */}
            <div className="md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Verification Details</span>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedBooking.customerName}</h2>
                    <p className="text-xs font-mono text-white/40 mt-0.5">Reference: {selectedBooking.id}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowReceiptModal(false)
                      setSelectedBooking(null)
                    }}
                    className="p-1.5 hover:bg-white/[0.05] rounded text-white/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-xs">
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Email</p>
                    <p className="font-semibold text-white/90">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Phone</p>
                    <p className="font-semibold text-white/90">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Facebook Name</p>
                    <p className="font-semibold text-white/90">{selectedBooking.customerFbName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Facebook Link</p>
                    {selectedBooking.customerFbLink ? (
                      <a 
                        href={selectedBooking.customerFbLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0500D0] hover:underline font-semibold flex items-center gap-1 mt-0.5"
                      >
                        Visit Profile <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="text-white/50 italic mt-0.5">No link provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Package / Session</p>
                    <p className="font-semibold text-[#0500D0]">{selectedBooking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Date & Time</p>
                    <p className="font-semibold text-white/90">{selectedBooking.bookingDate} at {selectedBooking.bookingTime}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">GCash Transaction Ref</p>
                    <p className="font-mono font-bold text-white/90 bg-black/40 border border-white/10 px-2 py-0.5 inline-block">{selectedBooking.transactionRef || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Total Package Price</p>
                    <p className="font-bold text-white/90">₱{selectedBooking.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Required Deposit</p>
                    <p className="font-bold text-green-400">₱{selectedBooking.depositAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider">Remaining Balance</p>
                    <p className="font-bold text-red-500">₱{(selectedBooking.price - selectedBooking.depositAmount).toFixed(2)}</p>
                  </div>
                  <GraduationSessionDetails booking={selectedBooking} />
                  {selectedBooking.note && (
                    <div className="col-span-2 border-t border-white/10 pt-3">
                      <p className="text-white/40 font-medium text-[8px] uppercase tracking-wider mb-1">Pre-shoot Request Note</p>
                      <p className="bg-white/[0.03] p-3 border border-white/10 rounded text-white/70 leading-relaxed italic">
                        "{selectedBooking.note}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedBooking)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve Payment
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject Receipt
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs">
                  {selectedBooking.receiptUrl && (
                    <a
                      href={selectedBooking.receiptUrl}
                      download={`receipt-${selectedBooking.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/50 hover:text-white flex items-center gap-1 hover:underline"
                    >
                      <Download className="w-4 h-4" /> Download Receipt
                    </a>
                  )}
                  <a
                    href={`mailto:${selectedBooking.customerEmail}?subject=FICO MANA Booking: ${selectedBooking.id}`}
                    className="text-white/50 hover:text-white flex items-center gap-1 hover:underline"
                  >
                    <Mail className="w-4 h-4" /> Contact Customer
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECT PAYMENT MODAL */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-55 animate-fade-in">
          <form 
            onSubmit={handleRejectSubmit} 
            className="border border-white/10 bg-[#0A0A0F] shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5"
          >
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white">Reject Payment Receipt</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Booking ID: {selectedBooking.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 hover:bg-white/[0.05] rounded text-white/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 p-3 text-xs text-red-800 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Rejecting this payment will email the client with the specified reason and instructions to re-upload. The booking status will return to <strong>Pending Payment</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Rejection Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-primary focus:outline-none p-3 text-xs font-semibold"
                >
                  <option value="Unable to verify payment">Unable to verify payment</option>
                  <option value="Incorrect amount">Incorrect amount</option>
                  <option value="Duplicate receipt">Duplicate receipt</option>
                  <option value="Blurry image">Blurry image</option>
                  <option value="Other">Other (Write Custom Reason)</option>
                </select>
              </div>

              {rejectionReason === 'Other' && (
                <div className="space-y-2">
                  <label htmlFor="customReason" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Custom Reason Details
                  </label>
                  <textarea
                    id="customReason"
                    required
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter specific reason details so the customer understands what was wrong with their upload..."
                    className="w-full bg-black/40 border border-white/10 focus:border-primary focus:outline-none p-3 text-xs font-semibold resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-white/10 text-white/90 text-xs font-bold uppercase tracking-wider py-3 hover:bg-white/[0.03]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-1 transition-colors"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
