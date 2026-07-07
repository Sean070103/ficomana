'use client'

import { cn } from '@/lib/utils'
import { MANA_SESSION_BLOCKS, type SessionSlot } from '@/lib/booking-slots'

type Props = {
  selectedSlotId: string
  onSelect: (slotId: string) => void
  isSlotTaken: (slotId: string) => boolean
}

function SlotButton({
  slot,
  selected,
  taken,
  onSelect,
}: {
  slot: SessionSlot
  selected: boolean
  taken: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={taken}
      onClick={onSelect}
      className={cn(
        'w-full h-full min-h-[52px] sm:min-h-[58px] px-1.5 sm:px-2 py-2 border text-center transition-all duration-200 flex flex-col items-center justify-center gap-0.5',
        selected && 'border-primary bg-primary/20 text-primary ring-1 ring-primary/40',
        !selected &&
          !taken &&
          'border-white/12 bg-white/[0.03] text-foreground hover:border-primary/45 hover:bg-primary/5',
        taken && 'border-white/5 bg-white/[0.02] text-muted-foreground/35 cursor-not-allowed',
      )}
    >
      <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.12em] uppercase leading-none">
        {slot.slotLabel}
      </span>
      <span className="text-[7px] sm:text-[8px] text-muted-foreground leading-tight">
        {slot.arrivalTime} → {slot.shootTime}
      </span>
      <span
        className={cn(
          'text-[7px] uppercase tracking-wider font-semibold leading-none mt-0.5',
          taken ? 'text-red-400/80' : selected ? 'text-primary' : 'text-emerald-400/90',
        )}
      >
        {taken ? 'Booked' : selected ? 'Selected' : 'Open'}
      </span>
    </button>
  )
}

export default function BookingSlotPicker({ selectedSlotId, onSelect, isSlotTaken }: Props) {
  return (
    <div className="flex flex-col min-h-0 -mx-1 sm:mx-0">
      <div className="overflow-x-auto pb-1 -webkit-overflow-scrolling-touch">
        <div className="min-w-[260px] sm:min-w-0">
          <div className="grid grid-cols-[minmax(0,1.15fr)_1fr_1fr] gap-1 sm:gap-1.5 mb-1.5 shrink-0">
            <div className="text-[8px] font-semibold tracking-[0.14em] uppercase text-white/30 px-1">
              Session
            </div>
            <div className="text-center text-[8px] font-bold tracking-[0.14em] uppercase py-1.5 border-b-2 text-primary border-primary">
              Slot 1
            </div>
            <div className="text-center text-[8px] font-bold tracking-[0.14em] uppercase py-1.5 border-b-2 text-primary border-primary">
              Slot 2
            </div>
          </div>

          <div className="space-y-1.5 overflow-y-auto pr-0.5 min-h-0 flex-1 [scrollbar-width:thin]">
            {MANA_SESSION_BLOCKS.map((block) => {
              const sessionFull = block.slots.every((slot) => isSlotTaken(slot.id))
              return (
                <div
                  key={block.sessionId}
                  className={cn(
                    'grid grid-cols-[minmax(0,1.15fr)_1fr_1fr] gap-1 sm:gap-1.5 items-stretch',
                    sessionFull && 'opacity-60',
                  )}
                >
                  <div className="flex flex-col justify-center px-1 sm:px-1.5 py-2 border border-white/8 bg-white/[0.02]">
                    <p className="text-[8px] sm:text-[9px] font-medium leading-snug text-white/75 tracking-wide">
                      {block.timeLabel.replace(' - ', ' – ')}
                    </p>
                    {sessionFull && (
                      <p className="text-[7px] uppercase tracking-wider text-red-400/80 mt-1 font-semibold">
                        Session full
                      </p>
                    )}
                  </div>
                  {block.slots.map((slot) => (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      selected={selectedSlotId === slot.id}
                      taken={isSlotTaken(slot.id)}
                      onSelect={() => onSelect(slot.id)}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          <p className="text-[9px] text-white/40 leading-snug border-t border-white/8 pt-2 mt-2 shrink-0">
            With makeup · 2 slots per 2-hour session · Arrive 15 min early
          </p>
        </div>
      </div>
    </div>
  )
}
