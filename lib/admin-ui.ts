import type { Booking } from '@/lib/data-store'

export const adminPage = 'space-y-6 font-sans'
export const adminTitle = 'text-xl font-bold uppercase tracking-wider text-white'
export const adminSubtitle = 'text-xs text-white/50 mt-1'
export const adminCard = 'border border-white/10 bg-white/[0.02] backdrop-blur-sm'
export const adminPanel = 'border border-white/10 bg-[#0A0A0F]'
export const adminInput =
  'w-full bg-black/40 border border-white/10 text-white placeholder:text-white/30 p-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30'
export const adminSelect =
  'admin-select w-full bg-[#0A0A0F] border border-white/10 text-white p-3.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 [color-scheme:dark]'
export const adminLabel = 'text-[9px] font-bold tracking-widest text-primary uppercase'
export const adminSectionLabel = 'text-[10px] font-bold tracking-widest text-white/40 uppercase'
export const adminBtnPrimary =
  'bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-[#03008F] transition-colors disabled:opacity-50'
export const adminBtnGhost =
  'border border-white/10 text-white/70 hover:border-white/30 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors'
export const adminTableWrap = `${adminPanel} overflow-x-auto`
export const adminTableHead =
  'bg-white/[0.03] border-b border-white/10 text-[10px] font-bold tracking-widest text-white/40 uppercase'
export const adminTableRow = 'hover:bg-white/[0.03] transition-colors'
export const adminSpinnerWrap = 'flex items-center justify-center min-h-[400px]'
export const adminSpinner = 'w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full'
export const adminOverlay = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex z-50 animate-in fade-in duration-200'
export const adminDrawer =
  'bg-[#0A0A0F] border-l border-white/10 w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300'
export const adminModal =
  'bg-[#0A0A0F] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200'

export const adminActionSuccess = 'ring-2 ring-green-500/50 scale-[1.02] transition-all duration-300'
export const adminCardHover = 'hover:border-primary/30 hover:shadow-[0_0_24px_rgba(5,0,208,0.12)] transition-all duration-300'

export function bookingStatusBadge(status: Booking['bookingStatus']) {
  switch (status) {
    case 'Confirmed':
      return 'bg-green-500/15 text-green-400 border border-green-500/30'
    case 'Pending Verification':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'Pending Payment':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
    case 'Completed':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
    case 'Cancelled':
      return 'bg-red-500/15 text-red-400 border border-red-500/30'
    case 'No Show':
      return 'bg-white/10 text-white/50 border border-white/20'
    default:
      return 'bg-white/5 text-white/60 border border-white/10'
  }
}

export function paymentStatusBadge(status: Booking['paymentStatus']) {
  switch (status) {
    case 'Paid Full':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    case 'Paid Deposit':
      return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    case 'Pending Verification':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'Unpaid':
      return 'bg-red-500/15 text-red-400 border border-red-500/30'
    case 'Refunded':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
    default:
      return 'bg-white/5 text-white/60 border border-white/10'
  }
}

export function emailStatusBadge(status: 'SENT' | 'FAILED') {
  return status === 'SENT'
    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
    : 'bg-red-500/15 text-red-400 border border-red-500/30'
}

export function notificationTypeBadge(type: string) {
  switch (type) {
    case 'NEW_BOOKING':
      return 'text-primary'
    case 'RECEIPT_UPLOAD':
    case 'RESUBMITTED':
      return 'text-amber-400'
    case 'PAYMENT_REJECTED':
      return 'text-red-400'
    case 'CANCELLED':
      return 'text-white/40'
    default:
      return 'text-white/60'
  }
}