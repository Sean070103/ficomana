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
      <div className="absolute inset-0">
        <Image
          src="/model/model_2.jpg"
          alt="Self portrait session at FICO MANA Studio"
          fill
          className="object-cover object-[center_20%]"
          priority
          quality={95}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1612]/95 via-[#0a1612]/70 to-[#0a1612]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1612]/80 via-transparent to-[#0a1612]/30" />
      </div>

      <div className="relative h-full flex items-center px-6 md:px-12 lg:px-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          <motion.div variants={itemVariants} className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-[#0500D0]" />
            <span className="text-[#2A2AFF] text-xs font-medium tracking-[0.35em] uppercase">
              Self Portrait Studio
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="heading-xl text-[#F5F0E8] mb-6"
          >
            Capture Moments That Speak Without Words
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg text-[#F5F0E8]/75 mb-10 max-w-lg leading-relaxed font-light"
          >
            A private self-portrait experience designed for timeless memories,
            authentic emotions, and beautifully crafted photographs.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#booking"
              className="inline-flex items-center justify-center bg-[#0500D0] text-white px-10 py-3.5 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-500 hover:bg-white hover:text-[#0500D0]"
            >
              Book Your Session
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center border border-[#F5F0E8]/40 text-[#F5F0E8] px-10 py-3.5 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-500 hover:border-[#2A2AFF] hover:text-[#2A2AFF]"
            >
              Explore the Studio
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#F5F0E8]/40">
          Scroll
        </span>
        <ChevronDown className="w-4 h-4 text-[#2A2AFF]/75" />
      </motion.div>
    </section>
  )
}
