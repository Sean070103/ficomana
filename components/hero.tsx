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
          className="absolute inset-0 translate-x-0 sm:translate-x-[6%] md:translate-x-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 14, ease: 'easeOut' }}
        >
          <Image
            src="/model/model_2.jpg"
            alt="Graduation portrait at FICO MANA Studio"
            fill
            className="object-cover object-[center_18%] sm:object-[68%_18%] md:object-[72%_18%] brightness-[1.1] contrast-[1.04] max-sm:brightness-[1.08]"
            priority
            quality={95}
            sizes="100vw"
          />
        </motion.div>

        <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent max-sm:from-black/70 max-sm:via-black/25 max-sm:to-transparent sm:from-black/80 sm:via-transparent md:from-black/70" />
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/25 to-black/40" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 min-h-screen min-h-[100dvh] sm:flex sm:flex-col sm:justify-start sm:items-start px-6 sm:px-6 md:px-12 lg:px-16 xl:px-20 pt-24 sm:pt-32 md:pt-40 pb-14 sm:pb-12 md:pb-14"
      >
        {/* Mobile — pixel-match reference (no FICO MANA) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-x-0 bottom-0 px-5 pb-10 flex flex-col items-start text-left sm:hidden"
        >
          <motion.p
            variants={itemVariants}
            className="text-[13px] leading-[1.6] font-bold tracking-[0.22em] uppercase text-white mb-6 max-w-[15rem]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            The Portrait of Success
          </motion.p>

          <motion.div variants={itemVariants} className="w-full flex flex-col items-start gap-5">
            <Button
              nativeButton={false}
              render={<Link href="#booking" />}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-[94%] rounded-none bg-white text-black hover:bg-white/90 text-[10px] font-semibold tracking-[0.16em] uppercase h-11 px-4 transition-all duration-300 shadow-none justify-center',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reserve Your Session
            </Button>
            <Link
              href="/gallery"
              className="pl-12 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:text-white/75 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              View Gallery
            </Link>
          </motion.div>
        </motion.div>

        {/* Desktop */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden sm:flex w-full max-w-md md:max-w-2xl flex-col items-start"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5 md:mb-6">
            <span className="h-px w-10 sm:w-14 bg-gradient-to-r from-white/70 to-white/0" />
            <span
              className="text-[9px] sm:text-[10px] font-semibold tracking-[0.35em] uppercase text-white/50"
              style={{ fontFamily: 'var(--font-neue)' }}
            >
              Self Portrait Studio
            </span>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl lg:text-2xl font-semibold tracking-[0.22em] uppercase mb-5 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: 'var(--font-neue)' }}
          >
            <span className="text-white">The Portrait </span>
            <span className="text-white/90">of Success</span>
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-[1.75rem] lg:text-3xl font-normal italic text-white/95 leading-snug mb-8 md:mb-10"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            Creating Visuals That Celebrate Every Story
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-row gap-4 w-auto">
            <Button
              nativeButton={false}
              render={<Link href="#booking" />}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-auto rounded-none bg-white text-black hover:bg-white/90 text-[11px] font-bold tracking-[0.18em] uppercase h-12 px-8 transition-all duration-300',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reserve Your Session
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/gallery" />}
              variant="outline"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-auto rounded-none border-white/40 bg-black/20 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/10 text-[11px] font-bold tracking-[0.18em] uppercase h-12 px-8 transition-all duration-300',
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
