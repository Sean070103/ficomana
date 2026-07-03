'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

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
    <section id="home" className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/model/model_2.jpg"
          alt="Graduation portrait at FICO MANA Studio"
          fill
          className="object-cover object-[72%_18%]"
          priority
          quality={95}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-12 lg:px-16 xl:px-20 pt-28 md:pt-32 pb-12 md:pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl flex flex-col items-start text-left"
        >
          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-light tracking-[0.18em] uppercase text-white mb-4 md:mb-5"
          >
            FICO MANA
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase text-[#2A2AFF] mb-5 md:mb-6"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            The Portrait of Success
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-3xl font-normal italic text-white leading-snug max-w-lg mb-8 md:mb-10"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            Creating Visuals That Celebrate Every Story
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-[9px] sm:text-[10px] font-light tracking-[0.08em] text-white/70"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Graduation Shoot / Creative Shoot / Photobooth / Self Portrait
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-2xl space-y-8 md:space-y-10"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="#booking"
              className="inline-flex items-center justify-center bg-[#0500D0] text-white px-9 py-3.5 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-300 hover:bg-[#03008F]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reserve Your Session
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center border border-white/50 text-white px-9 py-3.5 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-300 hover:bg-white/10"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              View Gallery
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-10 border-t border-white/15 pt-6 md:pt-8">
            {[
              { value: '1,200+', label: 'Portrait Sessions' },
              { value: '100%', label: 'Private Experience' },
              { value: '1', label: 'Private Studio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-serif text-lg sm:text-xl md:text-2xl font-light text-white">
                  {stat.value}
                </div>
                <div
                  className="text-white/55 text-[7px] sm:text-[8px] tracking-[0.18em] uppercase mt-1.5"
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
