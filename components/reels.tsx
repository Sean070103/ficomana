'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const REEL_VIDEO = '/Breanna%202%20(1).mp4'

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
  const unmutedRef = useRef(false)

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
    video.muted = true
    video.defaultMuted = true
    video.preload = 'auto'

    const tryUnmute = () => {
      if (unmutedRef.current || video.paused) return
      unmutedRef.current = true
      video.muted = false
      void video.play().catch(() => {
        video.muted = true
        unmutedRef.current = false
      })
    }

    const playVideo = () => {
      if (!shouldPlayRef.current) return

      video.muted = unmutedRef.current ? false : true

      void video.play().catch(() => {
        video.muted = true
        void video.play().catch(() => {})
      })
    }

    const pauseVideo = () => {
      if (video.paused) return
      video.pause()
    }

    const syncPlayback = () => {
      const { top, bottom } = section.getBoundingClientRect()
      const vh = window.innerHeight

      // Preload while user is scrolling toward reels
      if (top <= vh * 1.5 && video.readyState < 2) {
        video.load()
      }

      // Play the moment the top edge of reels enters the viewport
      const tipReached = top <= vh
      const stillVisible = bottom > 0

      shouldPlayRef.current = tipReached && stillVisible

      if (shouldPlayRef.current) {
        playVideo()
      } else if (bottom <= 0 || top > vh) {
        pauseVideo()
      }
    }

    const onCanPlay = () => {
      if (shouldPlayRef.current) playVideo()
    }

    const onUserInteract = () => {
      if (shouldPlayRef.current) {
        playVideo()
        tryUnmute()
      }
    }

    syncPlayback()

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('loadeddata', onCanPlay)

    window.addEventListener('scroll', syncPlayback, { passive: true })
    window.addEventListener('resize', syncPlayback)
    window.addEventListener('touchstart', onUserInteract, { passive: true })

    // Top-edge sentinel — fires as soon as the tip of reels hits the screen
    const tipObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shouldPlayRef.current = true
          if (video.readyState < 2) video.load()
          playVideo()
        } else {
          const { top, bottom } = section.getBoundingClientRect()
          const vh = window.innerHeight
          if (bottom <= 0 || top > vh) {
            shouldPlayRef.current = false
            pauseVideo()
          }
        }
      },
      { threshold: 0 },
    )
    tipObserver.observe(topTrigger)

    // Backup observer on full section for iOS momentum scroll
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shouldPlayRef.current = true
          playVideo()
        }
      },
      { threshold: 0 },
    )
    sectionObserver.observe(section)

    const retryTimers = (ios ? [0, 100, 300, 600, 1200] : [0, 100, 300, 600]).map((ms) =>
      window.setTimeout(syncPlayback, ms),
    )

    return () => {
      retryTimers.forEach((id) => window.clearTimeout(id))
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onCanPlay)
      window.removeEventListener('scroll', syncPlayback)
      window.removeEventListener('resize', syncPlayback)
      window.removeEventListener('touchstart', onUserInteract)
      tipObserver.disconnect()
      sectionObserver.disconnect()
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
                muted
                loop
                autoPlay
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
