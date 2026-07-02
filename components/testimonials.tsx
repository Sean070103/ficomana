'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/section-header'

const testimonials = [
  {
    id: 1,
    quote: "The most authentic self-portraits I've ever had. Every shot feels like it tells my story.",
    author: 'Sarah M.',
    rating: 5,
  },
  {
    id: 2,
    quote: 'Professional, intimate, and truly transformative. This experience changed how I see myself.',
    author: 'James T.',
    rating: 5,
  },
  {
    id: 3,
    quote: 'The attention to detail is extraordinary. FICO MANA elevated my portfolio completely.',
    author: 'Maria L.',
    rating: 5,
  },
  {
    id: 4,
    quote: 'Worth every penny. I felt genuinely comfortable creating without judgment or limitation.',
    author: 'Alex K.',
    rating: 5,
  },
  {
    id: 5,
    quote: 'Studio excellence meets artistic vision. A truly premium experience from start to finish.',
    author: 'Emma R.',
    rating: 5,
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const current = testimonials[currentIndex]

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-secondary">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          eyebrow="Testimonials"
          title="Client Stories"
          description="Hear from those who've experienced the magic of a FICO MANA session."
          align="center"
        />

        <div className="relative min-h-[280px] md:min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-border p-10 md:p-14 text-center"
            >
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl font-light text-foreground leading-relaxed mb-10 text-balance">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-px bg-primary/30 mb-3" />
                <p className="text-sm font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  {current.author}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              className={`h-1 transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-4 bg-primary/20 hover:bg-primary/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
