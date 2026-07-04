'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const REEL_VIDEO = '/breanna-reel.mp4'
const PLAY_LEAD_VH = 0.85

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export default function Reels() {
  const sectionRef = useRef<HTMLElement>(null)
  const topTriggerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const shouldPlayRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const userEngagedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    const topTrigger = topTriggerRef.current
    if (!video || !section || !topTrigger) return

    const ios = isIOSDevice()

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

    const markEngaged = () => {
      userEngagedRef.current = true
    }

    const showPreviewFrame = () => {
      if (video.paused && video.readyState >= 2 && video.currentTime === 0) {
        video.currentTime = 0.01
      }
    }

    const playVideo = () => {
      if (!shouldPlayRef.current) return
      video.muted = false

      void video.play().catch(() => {
        showPreviewFrame()
        if (userEngagedRef.current) {
          window.setTimeout(() => {
            void video.play().catch(showPreviewFrame)
          }, 100)
        }
      })
    }

    const pauseVideo = () => {
      if (video.paused) return
      video.pause()
    }

    const syncPlayback = () => {
      markEngaged()

      const { top, bottom } = section.getBoundingClientRect()
      const vh = window.innerHeight
      const playThreshold = vh * (1 + PLAY_LEAD_VH)

      const tipReached = top <= playThreshold
      const stillVisible = bottom > 0

      shouldPlayRef.current = tipReached && stillVisible

      if (shouldPlayRef.current) {
        playVideo()
      } else if (bottom <= 0 || top > playThreshold + vh * 0.25) {
        pauseVideo()
      }
    }

    const onVideoReady = () => {
      showPreviewFrame()
      if (shouldPlayRef.current) playVideo()
    }

    const onVideoError = () => {
      if (!hasLoadedRef.current) return
      video.load()
    }

    const onUserGesture = () => {
      markEngaged()
      if (shouldPlayRef.current) playVideo()
    }

    syncPlayback()

    video.addEventListener('loadeddata', onVideoReady)
    video.addEventListener('canplay', onVideoReady)
    video.addEventListener('canplaythrough', onVideoReady)
    video.addEventListener('error', onVideoError)

    window.addEventListener('scroll', syncPlayback, { passive: true })
    window.addEventListener('resize', syncPlayback)
    window.addEventListener('wheel', onUserGesture, { passive: true })
    window.addEventListener('pointerdown', markEngaged, { passive: true })
    window.addEventListener('touchstart', onUserGesture, { passive: true })
    window.addEventListener('touchmove', onUserGesture, { passive: true })
    window.addEventListener('touchend', onUserGesture, { passive: true })
    window.addEventListener('click', onUserGesture)
    window.addEventListener('keydown', markEngaged)

    const tipObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shouldPlayRef.current = true
          playVideo()
        } else {
          const { top, bottom } = section.getBoundingClientRect()
          const vh = window.innerHeight
          const playThreshold = vh * (1 + PLAY_LEAD_VH)
          if (bottom <= 0 || top > playThreshold + vh * 0.25) {
            shouldPlayRef.current = false
            pauseVideo()
          }
        }
      },
      {
        threshold: 0,
        rootMargin: `0px 0px ${Math.round(PLAY_LEAD_VH * 100)}% 0px`,
      },
    )
    tipObserver.observe(topTrigger)

    const retryTimers = (ios ? [0, 150, 400, 800, 1500, 2500] : [0, 150, 400, 800, 1500]).map(
      (ms) => window.setTimeout(syncPlayback, ms),
    )

    return () => {
      retryTimers.forEach((id) => window.clearTimeout(id))
      video.removeEventListener('loadeddata', onVideoReady)
      video.removeEventListener('canplay', onVideoReady)
      video.removeEventListener('canplaythrough', onVideoReady)
      video.removeEventListener('error', onVideoError)
      window.removeEventListener('scroll', syncPlayback)
      window.removeEventListener('resize', syncPlayback)
      window.removeEventListener('wheel', onUserGesture)
      window.removeEventListener('pointerdown', markEngaged)
      window.removeEventListener('touchstart', onUserGesture)
      window.removeEventListener('touchmove', onUserGesture)
      window.removeEventListener('touchend', onUserGesture)
      window.removeEventListener('click', onUserGesture)
      window.removeEventListener('keydown', markEngaged)
      tipObserver.disconnect()
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
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                loop
                preload="auto"
              >
                <source src={REEL_VIDEO} type="video/mp4" />
              </video>
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
