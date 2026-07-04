'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const REEL_VIDEO = '/breanna-reel.mp4'
const PLAY_LEAD_VH = 1.75
const PRELOAD_LEAD_VH = 2.5
const PAUSE_ABOVE_VH = 1.2

export default function Reels() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const shouldPlayRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const preloadStartedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return

    video.loop = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.muted = false
    video.defaultMuted = false
    video.preload = 'auto'

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      video.load()
    }

    const showPreviewFrame = () => {
      if (video.paused && video.readyState >= 2 && video.currentTime === 0) {
        video.currentTime = 0.01
      }
    }

    const playVideo = () => {
      if (!shouldPlayRef.current) return

      video.muted = false

      if (!video.paused) return

      void video.play().catch(showPreviewFrame)
    }

    const pauseVideo = () => {
      if (video.paused) return
      video.pause()
    }

    const syncPlayback = () => {
      const { top, bottom } = section.getBoundingClientRect()
      const vh = window.innerHeight
      const playThreshold = vh * (1 + PLAY_LEAD_VH)
      const preloadThreshold = vh * (1 + PRELOAD_LEAD_VH)
      const pauseAboveThreshold = vh * PAUSE_ABOVE_VH

      if (top <= preloadThreshold && !preloadStartedRef.current) {
        preloadStartedRef.current = true
        video.load()
      }

      const wantsPlay = top <= playThreshold && bottom > 0
      const forcePause = bottom <= 0 || top > pauseAboveThreshold

      if (wantsPlay) {
        shouldPlayRef.current = true
      } else if (forcePause) {
        shouldPlayRef.current = false
      }

      if (shouldPlayRef.current) {
        playVideo()
      } else if (forcePause) {
        pauseVideo()
      }
    }

    const onVideoReady = () => {
      showPreviewFrame()
      if (shouldPlayRef.current) playVideo()
    }

    syncPlayback()

    video.addEventListener('loadeddata', onVideoReady)
    video.addEventListener('canplay', onVideoReady)
    video.addEventListener('canplaythrough', onVideoReady)

    // Must run synchronously inside scroll/wheel/touchmove so play() keeps user-gesture access
    window.addEventListener('scroll', syncPlayback, { passive: true })
    window.addEventListener('wheel', syncPlayback, { passive: true })
    window.addEventListener('touchmove', syncPlayback, { passive: true })

    const onResize = () => syncPlayback()
    window.addEventListener('resize', onResize)

    const observer = new IntersectionObserver(() => syncPlayback(), {
      threshold: 0,
      rootMargin: `0px 0px ${Math.round(PLAY_LEAD_VH * 100)}% 0px`,
    })
    observer.observe(section)

    const retryTimers = [0, 50, 150, 300, 600].map((ms) =>
      window.setTimeout(syncPlayback, ms),
    )

    return () => {
      retryTimers.forEach((id) => window.clearTimeout(id))
      video.removeEventListener('loadeddata', onVideoReady)
      video.removeEventListener('canplay', onVideoReady)
      video.removeEventListener('canplaythrough', onVideoReady)
      window.removeEventListener('scroll', syncPlayback)
      window.removeEventListener('wheel', syncPlayback)
      window.removeEventListener('touchmove', syncPlayback)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
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
          <h2
            className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-[0.05em] sm:tracking-[0.08em] uppercase text-white"
            style={{ fontFamily: 'var(--font-aileron)' }}
          >
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
