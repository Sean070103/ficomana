'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { Booking } from '@/lib/data-store'
import { bookingStatusBadge } from '@/lib/admin-ui'

type Props = {
  bookings: Booking[]
  selectedDate?: string
  onSelectDate: (date: string) => void
  className?: string
  compact?: boolean
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayKey() {
  const now = new Date()
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

export default function AdminBookingCalendar({
  bookings,
  selectedDate,
  onSelectDate,
  className = '',
  compact = false,
}: Props) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(
    selectedDate ? Number(selectedDate.split('-')[0]) : now.getFullYear(),
  )
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? Number(selectedDate.split('-')[1]) - 1 : now.getMonth(),
  )

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of bookings) {
      if (!b.bookingDate || b.bookingStatus === 'Cancelled') continue
      map.set(b.bookingDate, (map.get(b.bookingDate) ?? 0) + 1)
    }
    return map
  }, [bookings])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: compact ? 'short' : 'long',
    year: 'numeric',
  })

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: Array<{ date: string; day: number } | null> = []

    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: toDateKey(viewYear, viewMonth, day), day })
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  const monthTotal = useMemo(() => {
    let total = 0
    countsByDate.forEach((count, date) => {
      const [y, m] = date.split('-').map(Number)
      if (y === viewYear && m === viewMonth + 1) total += count
    })
    return total
  }, [countsByDate, viewYear, viewMonth])

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const labels = compact ? WEEKDAYS_SHORT : WEEKDAYS
  const cellH = compact ? 'h-8' : 'h-10'

  return (
    <div
      className={`border border-white/10 bg-white/[0.02] p-4 ${compact ? 'max-w-[252px]' : 'max-w-sm w-full'} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">Schedule</p>
          <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{monthLabel}</p>
        </div>
        <div className="flex items-center border border-white/10">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date()
              setViewYear(t.getFullYear())
              setViewMonth(t.getMonth())
              onSelectDate(todayKey())
            }}
            className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/50 hover:text-white border-x border-white/10"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {labels.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className={`font-medium text-white/30 text-center ${compact ? 'text-[8px]' : 'text-[9px]'}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className={cellH} />
          }

          const count = countsByDate.get(cell.date) ?? 0
          const isToday = cell.date === todayKey()
          const isSelected = cell.date === selectedDate
          const hasBookings = count > 0

          return (
            <button
              key={cell.date}
              type="button"
              title={hasBookings ? `${count} booking${count === 1 ? '' : 's'}` : undefined}
              onClick={() => onSelectDate(isSelected ? '' : cell.date)}
              className={`relative ${cellH} flex flex-col items-center justify-center rounded-sm transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-[0_0_12px_rgba(5,0,208,0.25)]'
                  : isToday
                    ? 'bg-primary/10 text-white ring-1 ring-inset ring-primary/35'
                    : hasBookings
                      ? 'text-white bg-white/[0.03] hover:bg-primary/10'
                      : 'text-white/35 hover:bg-white/[0.04] hover:text-white/55'
              }`}
            >
              <span className={`font-medium leading-none tabular-nums ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {cell.day}
              </span>
              {hasBookings && (
                <span
                  className={`absolute bottom-1 text-[7px] font-bold leading-none tabular-nums ${
                    isSelected ? 'text-white/85' : 'text-primary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between gap-2 text-[9px] text-white/40">
        <span>
          <span className="text-white/70 font-semibold tabular-nums">{monthTotal}</span> sessions this month
        </span>
        {selectedDate && (
          <button
            type="button"
            onClick={() => onSelectDate('')}
            className="text-primary font-semibold hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminDaySessions({
  bookings,
  date,
}: {
  bookings: Booking[]
  date: string
}) {
  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.bookingDate === date && b.bookingStatus !== 'Cancelled')
        .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime)),
    [bookings, date],
  )

  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!date) {
    return (
      <div className="border border-white/10 bg-[#0A0A0F] p-8 text-center text-white/40 text-xs">
        Select a date on the calendar to view scheduled sessions.
      </div>
    )
  }

  return (
    <div className="border border-white/10 bg-[#0A0A0F] flex flex-col min-h-[320px]">
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">Day overview</p>
          <p className="text-sm font-semibold text-white">{label}</p>
        </div>
        <Link
          href={`/admin/bookings?date=${date}`}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
        >
          Open in list <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 divide-y divide-white/5 overflow-y-auto max-h-[420px]">
        {dayBookings.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40">No sessions on this date.</p>
        ) : (
          dayBookings.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings?search=${encodeURIComponent(b.id)}`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02] transition-colors text-xs"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{b.customerName}</p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {b.bookingTime} · {b.packageName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-[10px] text-primary">{b.id}</span>
                <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${bookingStatusBadge(b.bookingStatus)}`}>
                  {b.bookingStatus}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {dayBookings.length > 0 && (
        <div className="p-3 border-t border-white/10 text-[10px] text-white/40 text-center">
          {dayBookings.length} session{dayBookings.length === 1 ? '' : 's'} scheduled
        </div>
      )}
    </div>
  )
}
