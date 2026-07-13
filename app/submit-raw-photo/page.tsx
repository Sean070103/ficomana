'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Check, RefreshCw, Upload, Image, ExternalLink } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import SectionHeader from '@/components/section-header'
import SectionShell from '@/components/section-shell'

const inputClass =
  'w-full border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30'

const labelClass = 'text-[10px] font-bold tracking-[0.12em] uppercase text-white'

const cardClass = 'border border-white/10 bg-white/[0.02] backdrop-blur-sm'

const btnPrimaryClass =
  'w-full sm:w-auto inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3 text-xs uppercase font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors'

type BookingInfo = {
  id: string
  customerName: string
  packageName: string
  bookingDate: string
  bookingTime: string
  bookingStatus: string
  driveLink: string
  rawPhotoLink: string
  rawPhotoStatus: string
  rawPhotoNotes: string
}

function SubmitRawPhotoForm() {
  const searchParams = useSearchParams()

  const [bookingId, setBookingId] = useState('')
  const [email, setEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [booking, setBooking] = useState<BookingInfo | null>(null)

  const [rawPhotoLink, setRawPhotoLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fromUrl = searchParams.get('booking')?.trim()
    if (fromUrl) setBookingId(fromUrl)
  }, [searchParams])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupLoading(true)
    setLookupError('')
    setBooking(null)
    setSubmitted(false)

    try {
      const res = await fetch('/api/bookings/lookup-raw-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId.trim(), email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to find booking.')
      }

      setBooking(data as BookingInfo)
      setRawPhotoLink(data.rawPhotoLink || '')
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !rawPhotoLink.trim()) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch(`/api/bookings/${booking.id}/submit-raw-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), rawPhotoLink: rawPhotoLink.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit raw photo link.')
      }

      setSubmitted(true)
      // Refresh current local state
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              rawPhotoLink: rawPhotoLink.trim(),
              rawPhotoStatus: 'Pending Review',
              rawPhotoNotes: '',
            }
          : null
      )
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setBooking(null)
    setSubmitted(false)
    setLookupError('')
    setSubmitError('')
    setRawPhotoLink('')
    setBookingId('')
    setEmail('')
  }

  return (
    <div className="max-w-xl mx-auto">
      {submitted ? (
        <div className={`text-center space-y-4 py-8 px-6 ${cardClass}`}>
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto border border-primary/30">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Selection Submitted</h3>
          <p className="text-sm text-white/70">
            Your folder with 5 chosen photos for booking <span className="font-mono text-white">{booking?.id}</span> has been submitted to the editors.
          </p>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            We will check that the photos are original and not blurry. You will receive an email confirmation once your selection is approved or if it needs resubmission.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="border border-white/10 hover:border-white/20 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              View Submission Status
            </button>
            <button type="button" onClick={resetForm} className={btnPrimaryClass + ' gap-2'}>
              <RefreshCw className="w-3.5 h-3.5" /> Look Up Another Booking
            </button>
          </div>
        </div>
      ) : !booking ? (
        <form onSubmit={handleLookup} className={`space-y-4 p-6 sm:p-8 ${cardClass}`}>
          <div>
            <label className={labelClass}>Booking Reference</label>
            <input
              required
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value.toUpperCase())}
              placeholder="FM-123456"
              className={inputClass + ' font-mono mt-1.5'}
            />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Same email used when booking"
              className={inputClass + ' mt-1.5'}
            />
          </div>

          {lookupError && (
            <div className="flex gap-2 items-start border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{lookupError}</p>
            </div>
          )}

          <button type="submit" disabled={lookupLoading} className={btnPrimaryClass + ' w-full mt-2'}>
            {lookupLoading ? 'Finding booking...' : 'Find My Booking'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Booking Summary Box */}
          <div className={`border border-white/10 bg-black/40 p-5 space-y-3.5 text-sm`}>
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <p className="text-white font-semibold text-base">{booking.customerName}</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Reference: {booking.id}</p>
              </div>
              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase">
                {booking.packageName}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 text-xs text-white/80">
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Shoot Date</p>
                <p className="font-semibold mt-0.5">{booking.bookingDate}</p>
              </div>
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Session Time</p>
                <p className="font-semibold mt-0.5">{booking.bookingTime}</p>
              </div>
            </div>

            {/* Gallery Access Section */}
            <div className="border-t border-white/10 pt-4 mt-3 bg-white/[0.01] p-3 border border-white/5 rounded-sm">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-primary" /> 1. View Your Raw Photos
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                Click below to open your Google Drive gallery and browse your session photos. Pick the <strong className="text-white">5 raw photos</strong> you want us to edit.
              </p>
              <a
                href={booking.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 border border-primary bg-primary/5 hover:bg-primary/15 text-primary text-xs font-semibold py-2.5 uppercase tracking-wider transition-colors"
              >
                Open Studio Gallery <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                  2. Create Your Selection Folder
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  In <strong className="text-white">your own Google Drive</strong>, create a new folder and copy your 5 chosen photos into it. Then right-click the folder, choose <strong className="text-white">Share</strong>, and set access to <strong className="text-white">&ldquo;Anyone with the link&rdquo;</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Submission Status Alerts */}
          {booking.rawPhotoStatus && (
            <div
              className={`p-4 border text-xs leading-relaxed ${
                booking.rawPhotoStatus === 'Approved'
                  ? 'border-green-500/20 bg-green-950/20 text-green-300'
                  : booking.rawPhotoStatus === 'Rejected'
                    ? 'border-red-500/20 bg-red-950/20 text-red-300'
                    : 'border-amber-500/20 bg-amber-950/20 text-amber-300'
              }`}
            >
              <div className="flex gap-2.5 items-start">
                {booking.rawPhotoStatus === 'Approved' ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] mb-1">
                    Submission Status: {booking.rawPhotoStatus}
                  </p>
                  {booking.rawPhotoStatus === 'Approved' && (
                    <p>Your photo selection is approved. Our editors are currently working on your portraits. You will receive an email once they are ready!</p>
                  )}
                  {booking.rawPhotoStatus === 'Pending Review' && (
                    <p>Your folder link is currently pending review. Our editors will verify that the photos are not blurry and not already edited.</p>
                  )}
                  {booking.rawPhotoStatus === 'Rejected' && (
                    <>
                      <p>Unfortunately, your photo selection could not be approved.</p>
                      {booking.rawPhotoNotes && (
                        <p className="mt-1.5 p-2 bg-red-900/40 border border-red-500/10 rounded font-semibold italic text-[11px]">
                          Reason: {booking.rawPhotoNotes}
                        </p>
                      )}
                      <p className="mt-2 text-white/50 text-[10px]">Please update your folder (or create a new one) and resubmit the link below.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {(!booking.rawPhotoStatus || booking.rawPhotoStatus === 'Rejected' || booking.rawPhotoStatus === 'Pending Review') && (
            <form onSubmit={handleSubmit} className={`p-6 sm:p-8 ${cardClass} space-y-4`}>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1 border-b border-white/10 pb-2">
                <Upload className="w-3.5 h-3.5 text-primary" /> {booking.rawPhotoStatus === 'Rejected' ? 'Resubmit Your Photo Folder Link' : '3. Submit Your Folder Link'}
              </p>
              
              <div>
                <label className={labelClass}>Google Drive Folder Link (5 Chosen Photos)</label>
                <input
                  required
                  type="url"
                  value={rawPhotoLink}
                  onChange={(e) => setRawPhotoLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className={inputClass + ' mt-1.5'}
                />
                <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
                  Paste the link to your own Google Drive folder containing your 5 chosen raw photos. Make sure sharing is set to &ldquo;Anyone with the link&rdquo; so our editors can open it.
                </p>
              </div>

              {submitError && (
                <div className="flex gap-2 items-start border border-red-500/20 bg-red-950/20 p-3.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
                >
                  ← Use different booking
                </button>
                <button type="submit" disabled={submitting || !rawPhotoLink.trim()} className={btnPrimaryClass}>
                  {submitting ? 'Submitting...' : booking.rawPhotoStatus === 'Rejected' ? 'Resubmit Folder Link' : 'Submit Folder Link'}
                </button>
              </div>
            </form>
          )}

          {booking.rawPhotoStatus === 'Approved' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors underline"
              >
                Look up a different booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SubmitRawPhotoPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-between">
      <Navbar />
      
      <SectionShell id="submit-raw-photo" className="pt-28 pb-16 flex-1 flex flex-col justify-center">
        <SectionHeader
          eyebrow="Client Portal"
          title="Submit Your 5 Chosen Photos"
          description="If you have already shot with us, look up your booking reference to view your Google Drive raw shots, then submit a folder link with the 5 photos you want us to edit."
          align="center"
        />
        
        <Suspense
          fallback={
            <div className="max-w-xl mx-auto border border-white/10 bg-white/[0.02] p-8 space-y-4">
              <div className="h-6 w-32 mx-auto bg-white/10 animate-pulse" />
              <div className="h-10 bg-white/[0.04] animate-pulse" />
              <div className="h-10 bg-white/[0.04] animate-pulse" />
            </div>
          }
        >
          <SubmitRawPhotoForm />
        </Suspense>
      </SectionShell>
      
      <Footer />
    </main>
  )
}
