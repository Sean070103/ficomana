'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="home" className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/model/model_2.jpg"
          alt="Graduation portrait at FICO MANA Studio"
          fill
          className="object-cover object-[80%_20%] sm:object-[75%_18%] md:object-[72%_18%]"
          priority
          quality={95}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 sm:via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col justify-between px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 md:pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl flex flex-col items-start text-left w-full"
        >
          <motion.h1
            variants={itemVariants}
            className="font-serif text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-light tracking-[0.12em] sm:tracking-[0.18em] uppercase text-white mb-3 sm:mb-4 md:mb-5"
          >
            FICO MANA
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="w-full text-center text-[9px] sm:text-[10px] md:text-[11px] font-semibold tracking-[0.28em] sm:tracking-[0.32em] uppercase mb-4 sm:mb-5 md:mb-6"
            style={{ fontFamily: 'var(--font-neue)' }}
          >
            <span className="text-[#D1D5DB]">The Portrait </span>
            <span className="text-[#4169E1]">of Success</span>
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col items-start gap-1.5 sm:gap-2">
            <motion.p
              className="text-sm xs:text-base sm:text-xl md:text-[1.75rem] lg:text-3xl font-normal italic text-white leading-snug md:whitespace-nowrap"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              Creating Visuals That{' '}
              <span className="whitespace-nowrap">Celebrate Every Story</span>
            </motion.p>

            <motion.p
              className="text-[8px] sm:text-[9px] md:text-[10px] font-light tracking-[0.06em] sm:tracking-[0.08em] leading-relaxed text-left"
              style={{ fontFamily: 'var(--font-neue)' }}
            >
              <span className="text-[#D1D5DB]">Graduation Shoot / Creative Shoot / Photobooth / Self </span>
              <span className="text-[#4169E1]">Portrait</span>
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-full max-w-2xl space-y-6 sm:space-y-8 md:space-y-10"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            <Button
              nativeButton={false}
              render={<Link href="#booking" />}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full sm:w-auto rounded-none bg-[#0500D0] hover:bg-[#03008F] text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase h-11 sm:h-12 px-8',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reserve Your Session
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="#gallery" />}
              variant="outline"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full sm:w-auto rounded-none border-white/50 bg-transparent text-white hover:bg-white/10 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase h-11 sm:h-12 px-8',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              View Gallery
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-10 border-t border-white/15 pt-5 sm:pt-6 md:pt-8">
            {[
              { value: '1,200+', label: 'Portrait Sessions' },
              { value: '100%', label: 'Private Experience' },
              { value: '1', label: 'Private Studio' },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0">
                <div className="font-serif text-base sm:text-xl md:text-2xl font-light text-white truncate">
                  {stat.value}
                </div>
                <div
                  className="text-white/55 text-[6px] sm:text-[7px] md:text-[8px] tracking-[0.12em] sm:tracking-[0.18em] uppercase mt-1 sm:mt-1.5 leading-tight"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
