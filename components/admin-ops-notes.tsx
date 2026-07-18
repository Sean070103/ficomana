'use client'

import { HardDrive } from 'lucide-react'
import { adminCard } from '@/lib/admin-ui'
import { EMAIL_STORAGE_SUB, getEmailStoragePeriod } from '@/lib/ops-subscriptions'

/** Staff ops notes shown across admin — billing / infra reminders. */
export default function AdminOpsNotes() {
  const period = getEmailStoragePeriod()
  const endLabel = period.periodEnd.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const warn = period.shouldNotify
  const urgent = period.daysLeft <= 3

  return (
    <div
      className={`${adminCard} p-4 flex gap-3 items-start ${
        urgent
          ? 'border-red-500/30 bg-red-500/[0.08]'
          : warn
            ? 'border-amber-500/25 bg-amber-500/[0.07]'
            : 'border-amber-500/20 bg-amber-500/[0.05]'
      }`}
      role="note"
    >
      <div
        className={`rounded-lg border p-2 shrink-0 ${
          urgent
            ? 'border-red-500/30 bg-red-500/15 text-red-300'
            : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
        }`}
      >
        <HardDrive className="w-4 h-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <p
          className={`text-[10px] font-bold tracking-widest uppercase ${
            urgent ? 'text-red-300/90' : 'text-amber-300/90'
          }`}
        >
          Ops note
          {warn ? ' · renewal soon' : ''}
        </p>
        <p className="text-sm font-semibold text-white">{EMAIL_STORAGE_SUB.label}</p>
        <p className="text-[12px] text-white/65 leading-relaxed">
          Availed on <strong className="text-white/85">July 17, 2026</strong>. Current period ends{' '}
          <strong className="text-white/85">{endLabel}</strong>
          {period.daysLeft >= 0 ? (
            <>
              {' '}
              (<strong className="text-white/85">{period.daysLeft} day{period.daysLeft === 1 ? '' : 's'}</strong> left).
            </>
          ) : (
            <> — <strong className="text-red-300">past due / renew now</strong>.</>
          )}{' '}
          Staff get a notification in the bell menu starting{' '}
          <strong className="text-white/85">{EMAIL_STORAGE_SUB.warnDaysBefore} days</strong> before renewal.
        </p>
      </div>
    </div>
  )
}
