'use client'

import { useEffect, useRef, useState } from 'react'
import {
  recolorGraduationPreview,
  type GraduationPreviewMasks,
} from '@/lib/graduation-preview-recolor'

type Props = {
  hoodColor?: string
  tasselColor?: string
  togaColor?: string
}

/** Pre-cropped clean source (labels removed) + matching masks. */
const SOURCE_IMAGE = '/booking_model_preview.jpg?v=41'
const HOOD_MASK = '/booking_model-hood-mask.png?v=41'
const TASSEL_MASK = '/booking_model-tassel-mask.png?v=41'
const TOGA_MASK = '/booking_model-toga-mask.png?v=41'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function maskFromImage(img: HTMLImageElement, sw: number, sh: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Uint8ClampedArray(sw * sh)

  ctx.drawImage(img, 0, 0, sw, sh)
  const { data } = ctx.getImageData(0, 0, sw, sh)
  const mask = new Uint8ClampedArray(sw * sh)
  for (let i = 0, p = 0; p < mask.length; p++, i += 4) {
    mask[p] = data[i]
  }
  return mask
}

export default function BookingGraduationPreview({
  hoodColor,
  tasselColor,
  togaColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef<HTMLImageElement | null>(null)
  const masksRef = useRef<GraduationPreviewMasks | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      loadImage(SOURCE_IMAGE),
      loadImage(HOOD_MASK),
      loadImage(TASSEL_MASK),
      loadImage(TOGA_MASK),
    ])
      .then(([source, hoodMaskImg, tasselMaskImg, togaMaskImg]) => {
        if (cancelled) return

        const sw = source.naturalWidth
        const sh = source.naturalHeight

        sourceRef.current = source
        masksRef.current = {
          hood: maskFromImage(hoodMaskImg, sw, sh),
          tassel: maskFromImage(tasselMaskImg, sw, sh),
          toga: maskFromImage(togaMaskImg, sw, sh),
        }
        setReady(true)
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const img = sourceRef.current
    const masks = masksRef.current
    if (!canvas || !img || !masks || !ready) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const sw = img.naturalWidth
    const sh = img.naturalHeight
    canvas.width = sw
    canvas.height = sh

    ctx.drawImage(img, 0, 0, sw, sh)
    const base = ctx.getImageData(0, 0, sw, sh)
    const recolored = recolorGraduationPreview(
      base,
      { hoodColor, tasselColor, togaColor },
      masks,
    )
    ctx.putImageData(recolored, 0, 0)
  }, [ready, hoodColor, tasselColor, togaColor])

  return (
    <div className="relative w-full max-w-md mx-auto md:max-w-none aspect-[3/4] max-h-[min(72vw,420px)] sm:max-h-[380px] md:max-h-[480px] lg:max-h-[520px] overflow-hidden border border-white/10 bg-black">
      <canvas
        ref={canvasRef}
        className="h-full w-full object-contain object-center"
        aria-label="Graduation attire color preview"
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-[10px] uppercase tracking-widest text-white/50">
          Loading preview…
        </div>
      )}
    </div>
  )
}
