import { HardDrive } from 'lucide-react'
import { adminCard } from '@/lib/admin-ui'

/** Staff ops notes shown across admin — billing / infra reminders. */
export default function AdminOpsNotes() {
  return (
    <div
      className={`${adminCard} border-amber-500/25 bg-amber-500/[0.07] p-4 flex gap-3 items-start`}
      role="note"
    >
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 p-2 text-amber-300 shrink-0">
        <HardDrive className="w-4 h-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-bold tracking-widest uppercase text-amber-300/90">Ops note</p>
        <p className="text-sm font-semibold text-white">Monthly storage subscription (email)</p>
        <p className="text-[12px] text-white/65 leading-relaxed">
          We availed the <strong className="text-white/85">monthly storage subscription for email</strong> on{' '}
          <strong className="text-white/85">July 17, 2026</strong>. Track renewal / billing under the email
          provider account so client gallery &amp; system emails keep sending without storage limits.
        </p>
      </div>
    </div>
  )
}
