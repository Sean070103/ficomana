'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 600], [0, 80])
  const contentY = useTransform(scrollY, [0, 600], [0, 40])
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0.3])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.35 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.9, ease },
    },
  }

  return (
    <section id="home" className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <motion.div
          className="absolute inset-0 translate-x-0 sm:translate-x-[6%] md:translate-x-0 max-sm:scale-100 sm:scale-100"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 14, ease: 'easeOut' }}
        >
          <Image
            src="/raw_bg.jpg"
            alt="Graduation portrait at FICO MANA Studio"
            fill
            className="object-cover object-[center_8%] sm:object-[68%_18%] md:object-[72%_18%] brightness-[1.15] contrast-[1.05] saturate-[1.06]"
            priority
            quality={95}
            sizes="100vw"
          />
        </motion.div>

        {/* Mobile: bottom scrim for text; desktop: side fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/55 max-sm:via-transparent sm:from-black/75 sm:via-black/45 sm:to-transparent md:w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 sm:from-black/80 sm:via-transparent md:from-black/70" />
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/25 to-black/40" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col justify-end md:justify-start px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 pt-24 sm:pt-32 md:pt-40 pb-8 sm:pb-12 md:pb-14"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[11.5rem] sm:max-w-md md:max-w-2xl flex flex-col items-start text-left"
        >
          <motion.div variants={itemVariants} className="hidden sm:flex items-center gap-3 mb-5 md:mb-6">
            <span className="h-px w-10 sm:w-14 bg-gradient-to-r from-white/70 to-white/0" />
            <span
              className="text-[9px] sm:text-[10px] font-semibold tracking-[0.35em] uppercase text-white/50"
              style={{ fontFamily: 'var(--font-neue)' }}
            >
              Self Portrait Studio
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-[1.65rem] leading-[1.15] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-light tracking-[0.1em] sm:tracking-[0.18em] uppercase text-white mb-2 sm:mb-4 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
          >
            FICO MANA
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.32em] uppercase mb-3 sm:mb-5"
            style={{ fontFamily: 'var(--font-neue)' }}
          >
            <span className="text-white">The Portrait </span>
            <span className="text-white/90">of Success</span>
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="hidden sm:block text-xl md:text-[1.75rem] lg:text-3xl font-normal italic text-white/95 leading-snug mb-8 md:mb-10"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            Creating Visuals That Celebrate Every Story
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-2.5 sm:flex-row sm:gap-4 w-full sm:w-auto"
          >
            <Button
              nativeButton={false}
              render={<Link href="#booking" />}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full sm:w-auto rounded-none bg-white text-black hover:bg-white/90 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] sm:tracking-[0.18em] uppercase h-11 sm:h-12 px-6 sm:px-8 transition-all duration-300',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reserve Your Session
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/#gallery" />}
              variant="outline"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full sm:w-auto rounded-none border-white/40 bg-black/20 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/10 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] sm:tracking-[0.18em] uppercase h-11 sm:h-12 px-6 sm:px-8 transition-all duration-300',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              View Gallery
            </Button>
          </motion.div>
        </motion.div>

        <motion.a
          href="#gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8, ease }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-300"
          aria-label="Scroll to gallery"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase" style={{ fontFamily: 'var(--font-neue)' }}>
            Explore
          </span>
          <motion.span
            className="block h-8 w-px bg-gradient-to-b from-white/50 to-transparent"
            animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.a>
      </motion.div>
    </section>
  )
}
