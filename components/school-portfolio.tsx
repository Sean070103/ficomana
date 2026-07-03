'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Award, Calendar, BookOpen } from 'lucide-react'

interface SchoolContract {
  name: string
  location: string
  contractYear: string
  description: string
  tag: string
}

const schoolContracts: SchoolContract[] = [
  {
    name: "Laguna State Polytechnic University",
    location: "Cabuyao Campus",
    contractYear: "2024 - 2026",
    description: "Exclusive graduation and yearbook portrait provider for all graduating classes across faculties.",
    tag: "Official Partner"
  },
  {
    name: "University of the Philippines Los Baños",
    location: "Los Baños, Laguna",
    contractYear: "2023 - 2025",
    description: "Preferred partner for student organization portfolios, leadership awards, and thesis milestone shoots.",
    tag: "Preferred Studio"
  },
  {
    name: "Pamantasan ng Cabuyao",
    location: "Cabuyao, Laguna",
    contractYear: "2024 - 2025",
    description: "Official contractor for executive leadership board headshots, faculty profiles, and departmental yearbooks.",
    tag: "Official Partner"
  },
  {
    name: "Malayan Colleges Laguna",
    location: "Cabuyao, Laguna",
    contractYear: "2023 - 2026",
    description: "Partnership offering customized solo graduation portrait slots and corporate headshot portfolios.",
    tag: "Contract Partner"
  }
]

export default function SchoolPortfolio() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <section id="partnerships" className="py-24 bg-white border-t border-b border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="max-w-2xl mb-16 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase">
              Academic Partnerships
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-slate-800 font-light tracking-wide leading-tight">
            Official School Portfolios & Contracts
          </h2>
          <p className="text-sm text-slate-500 font-light leading-relaxed">
            Fico Mana is proud to be the official graduation and organizational portrait partner for leading educational institutions across Laguna and the region.
          </p>
        </div>

        {/* Contracts Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-8"
        >
          {schoolContracts.map((school, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              className="group bg-slate-50 border border-slate-200/80 p-8 transition-all duration-300 hover:bg-white hover:border-primary/30 hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold tracking-widest text-primary uppercase bg-primary/5 px-2.5 py-1 border border-primary/10">
                    {school.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{school.contractYear}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                    {school.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{school.location}</p>
                </div>

                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  {school.description}
                </p>
              </div>

              <div className="border-t border-slate-200/50 pt-4 mt-6 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-primary" /> Yearbook contract
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-primary" strokeWidth={2.5} /> Verified Studio
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic institution logo strip */}
        <div className="mt-20 border-t border-slate-100 pt-12 text-center space-y-6">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Trusted by Graduating Classes & Student Bodies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 hover:opacity-60 transition-opacity duration-300">
            <div className="font-serif font-semibold text-lg text-slate-700 tracking-wider">LSPU</div>
            <div className="font-serif font-semibold text-lg text-slate-700 tracking-wider">UPLB</div>
            <div className="font-serif font-semibold text-lg text-slate-700 tracking-wider">PnC</div>
            <div className="font-serif font-semibold text-lg text-slate-700 tracking-wider">MCL</div>
            <div className="font-serif font-semibold text-lg text-slate-700 tracking-wider">DLSU-L</div>
          </div>
        </div>

      </div>
    </section>
  )
}
