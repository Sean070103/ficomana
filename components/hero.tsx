'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.4,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Image with optimized gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/model/model_2.jpg"
          alt="Self portrait session at Fico Mana Studio"
          fill
          className="object-cover object-[25%_20%]"
          priority
          quality={95}
        />
        {/* Apple/Leica style smooth vignette overlay for perfect contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Shop branding eyebrow */}
          <motion.div variants={itemVariants} className="mb-6 flex flex-col gap-2">
            <span className="text-white text-5xl md:text-7xl font-serif tracking-[0.25em] uppercase font-light">
              Fico Mana
            </span>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#0500D0]" />
              <span className="text-[#2A2AFF] text-[8px] font-semibold tracking-[0.35em] uppercase">
                Self Portrait Studio
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-2xl md:text-3xl font-serif text-[#F5F0E8] mb-4 leading-normal font-light tracking-wide max-w-xl"
          >
            You Hold the Shutter. We Create the Space.
          </motion.h1>

          {/* Compelling description */}
          <motion.p
            variants={itemVariants}
            className="text-xs md:text-sm text-[#F5F0E8]/60 mb-8 max-w-md leading-relaxed font-light"
          >
            Control the lens. Capture your authentic self in complete privacy.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#booking"
              className="inline-flex items-center justify-center bg-[#0500D0] text-white px-10 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white hover:text-black hover:scale-[1.02]"
            >
              Reserve Your Session
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center border border-white/20 text-[#F5F0E8] px-10 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:border-white hover:bg-white/5 hover:scale-[1.02]"
            >
              View Gallery
            </a>
          </motion.div>

          {/* Elegant Statistics Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 border-t border-white/10 pt-10 mt-12 max-w-2xl"
          >
            <div>
              <div className="text-white text-xl md:text-2xl font-serif font-light">1,200+</div>
              <div className="text-[#F5F0E8]/50 text-[9px] tracking-widest uppercase mt-1">Portrait Sessions</div>
            </div>
            <div>
              <div className="text-white text-xl md:text-2xl font-serif font-light">4.9 ★</div>
              <div className="text-[#F5F0E8]/50 text-[9px] tracking-widest uppercase mt-1">Customer Rating</div>
            </div>
            <div>
              <div className="text-white text-xl md:text-2xl font-serif font-light">100%</div>
              <div className="text-[#F5F0E8]/50 text-[9px] tracking-widest uppercase mt-1">Private Experience</div>
            </div>
            <div>
              <div className="text-white text-xl md:text-2xl font-serif font-light">1</div>
              <div className="text-[#F5F0E8]/50 text-[9px] tracking-widest uppercase mt-1">Private Studio</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Down */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[8px] tracking-[0.3em] uppercase text-[#F5F0E8]/40">
          Scroll
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#2A2AFF]/75" />
      </motion.div>
    </section>
  )
}
