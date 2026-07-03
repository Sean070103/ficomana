'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const REEL_VIDEO = '/Breanna%202%20(1).mp4'

export default function Reels() {
  const sectionRef = useRef<HTMLElement>(null)
  const topTriggerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    const topTrigger = topTriggerRef.current
    if (!video || !section || !topTrigger) return

    video.loop = true
    video.muted = false

    const playVideo = () => {
      void video.play().catch(() => {
        // Browsers may block autoplay with sound until user interacts with the page
      })
    }

    const pauseVideo = () => {
      video.pause()
      video.currentTime = 0
    }

    // Fire as soon as the top edge of reels approaches the viewport
    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) playVideo()
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 100% 0px',
      },
    )

    // Pause only after the whole reels section has scrolled away
    const pauseObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) pauseVideo()
      },
      { threshold: 0 },
    )

    playObserver.observe(topTrigger)
    pauseObserver.observe(section)

    return () => {
      playObserver.disconnect()
      pauseObserver.disconnect()
      video.pause()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="reels"
      className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-8 lg:px-12"
      style={{
        background: 'linear-gradient(180deg, #eef3ff 0%, #4a6fd4 45%, #1034a6 100%)',
      }}
    >
      <div
        ref={topTriggerRef}
        className="absolute top-0 left-0 w-full h-px pointer-events-none"
        aria-hidden
      />
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: '-80px' }}
          className="relative w-[200px] xs:w-[220px] sm:w-[240px] md:w-[280px] lg:w-[320px] xl:w-[340px]"
        >
          <div className="relative rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] lg:rounded-[3.5rem] border-[5px] sm:border-[6px] md:border-[7px] lg:border-8 border-black bg-black shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-[38%] h-5 sm:h-6 md:h-7 lg:h-8 bg-black rounded-b-2xl" />

            <div className="relative aspect-[9/19] bg-black">
              <video
                ref={videoRef}
                src={REEL_VIDEO}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                autoPlay
                loop
                preload="auto"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 text-center px-4"
        >
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-[0.05em] sm:tracking-[0.08em] uppercase text-white" style={{ fontFamily: 'var(--font-aileron)' }}>
            Graduation Shoot Reels
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs xs:text-sm md:text-base lg:text-lg font-light tracking-[0.25em] sm:tracking-[0.35em] uppercase text-white/80">
            Samples
          </p>
        </motion.div>
      </div>
    </section>
  )
}
