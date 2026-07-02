'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Zap, Lightbulb, Camera, Award } from 'lucide-react'
import SectionHeader from '@/components/section-header'

const features = [
  {
    icon: Camera,
    title: 'Professional Equipment',
    description: 'High-end cameras and studio-grade lighting for exceptional results.',
  },
  {
    icon: Zap,
    title: 'Private & Comfortable',
    description: 'Your personal creative space designed for authentic self-expression.',
  },
  {
    icon: Lightbulb,
    title: 'Unlimited Creativity',
    description: 'No limits on poses, concepts, or creative direction.',
  },
  {
    icon: Award,
    title: 'Timeless Quality',
    description: 'High-resolution images that stand the test of time.',
  },
]

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="about" className="py-24 md:py-32 px-6 md:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] overflow-hidden"
          >
            <Image
              src="/model/model_5.jpg"
              alt="FICO MANA Studio portrait session"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/90 text-xs tracking-[0.25em] uppercase font-medium">
                Est. Fico Mana Studio
              </p>
            </div>
          </motion.div>

          <div>
            <SectionHeader
              eyebrow="Our Story"
              title="About FICO MANA"
              description="A private creative space where people freely express themselves using professional lighting and high-end equipment."
            />

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-4 md:gap-5"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="p-5 md:p-6 bg-card border border-border hover:border-primary/30 transition-colors duration-300 group"
                  >
                    <div className="w-9 h-9 flex items-center justify-center bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-sm mb-2">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
