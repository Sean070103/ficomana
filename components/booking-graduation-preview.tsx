'use client'

import Image from 'next/image'

/** Static reference photo — color picks are saved on the booking but do not alter this image. */
const SOURCE_IMAGE = '/booking_model_preview.jpg?v=41'

export default function BookingGraduationPreview() {
  return (
    <div className="relative w-full max-w-md mx-auto md:max-w-none aspect-[3/4] max-h-[min(72vw,420px)] sm:max-h-[380px] md:max-h-[480px] lg:max-h-[520px] overflow-hidden border border-white/10 bg-black">
      <Image
        src={SOURCE_IMAGE}
        alt="Graduation attire reference"
        fill
        className="object-contain object-center"
        sizes="(max-width: 768px) 90vw, 480px"
        priority
      />
    </div>
  )
}
