'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import SectionHeader from '@/components/section-header'

const faqs = [
  {
    question: 'How long is a typical self-portrait session?',
    answer:
      'Sessions range from 30 to 45 minutes. This includes 15–30 minutes of private shooting in the studio and 15 minutes for print selection immediately after.',
  },
  {
    question: 'What should I wear to my session?',
    answer:
      'Wear whatever makes you feel confident and authentic. We recommend solid colors or simple patterns, and you are welcome to bring multiple outfit options to vary your look.',
  },
  {
    question: 'How many photos will I receive?',
    answer:
      'You will receive all digital raw files captured during the session. You will also get 1 to 4 high-resolution prints and 1 to 4 professional digital edits, depending on your chosen package (Solo, Couple, Family, or With Fur Babies).',
  },
  {
    question: 'Can I reschedule my session?',
    answer:
      'Yes, we offer flexible rescheduling. Please notify us at least 48 hours in advance through our contact options to adjust your booking.',
  },
  {
    question: 'Do you offer digital and printed copies?',
    answer:
      'Yes! Every package includes all raw digital files sent via a secure download link, plus high-quality physical prints processed right after your shoot.',
  },
]

export default function FAQ() {
  const [expandedId, setExpandedId] = useState<number | null>(0)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-background">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Support"
          title="Frequently Asked Questions"
          description="Everything you need to know before your session."
          align="center"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-3"
        >
          {faqs.map((faq, index) => {
            const isOpen = expandedId === index
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`border transition-colors duration-300 ${
                  isOpen ? 'border-primary/30 bg-card' : 'border-border bg-card/50'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                >
                  <h3 className="font-medium text-sm md:text-base text-balance pr-4">
                    {faq.question}
                  </h3>
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/5 text-primary">
                    {isOpen ? (
                      <Minus className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </span>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 border-t border-border/50">
                    <p className="pt-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
