'use client'

import Image from 'next/image'

type Props = {
  hoodColor?: string
  tasselColor?: string
  togaColor?: string
}

export default function BookingGraduationPreview({
  hoodColor,
  tasselColor,
  togaColor,
}: Props) {
  const summary = [togaColor && `Toga: ${togaColor}`, hoodColor && `Hood: ${hoodColor}`, tasselColor && `Tassel: ${tasselColor}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="relative w-full max-w-md mx-auto md:max-w-none aspect-[3/4] max-h-[min(72vw,420px)] sm:max-h-[380px] md:max-h-[480px] lg:max-h-[520px] overflow-hidden border border-white/10 bg-black">
      <Image
        src="/booking_model1.jpg"
        alt="Graduation attire reference"
        fill
        sizes="(max-width: 768px) 90vw, 480px"
        className="object-contain object-center"
        priority
      />
      {summary && (
        <p className="absolute bottom-0 inset-x-0 text-[8px] sm:text-[9px] leading-snug text-white/80 bg-black/70 px-2 sm:px-3 py-2 text-center">
          {summary}
        </p>
      )}
    </div>
  )
}
