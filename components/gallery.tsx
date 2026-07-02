'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import SectionHeader from '@/components/section-header'

const galleryItems = [
  {
    id: 1,
    image: '/model/model_4.jpg',
    category: 'Solo',
    caption: 'Embrace your own light.',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 2,
    image: '/model/model_2.jpg',
    category: 'Couple',
    caption: 'Cherish every shared moment.',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 3,
    image: '/model/model_3.jpg',
    category: 'Graduation',
    caption: 'A proud milestone, beautifully captured.',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 4,
    image: '/model/model_5.jpg',
    category: 'Maternity',
    caption: 'Celebrating new beginnings.',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 5,
    image: '/model/model_6.jpg',
    category: 'Solo',
    caption: 'Simplicity and focus.',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 6,
    image: '/model/model_7.jpg',
    category: 'Couple',
    caption: 'Laughter and genuine connection.',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 7,
    image: '/model/model_8.jpg',
    category: 'Pets',
    caption: '',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    id: 8,
    image: '/model/model9.jpg',
    category: 'Family',
    caption: 'Bonds that last a lifetime.',
    span: 'md:col-span-1 md:row-span-2',
  },
]

const categories = ['All', 'Solo', 'Couple', 'Graduation', 'Family', 'Maternity']

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const filteredItems = activeCategory === 'All'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory)

  return (
    <section id="gallery" className="py-24 md:py-32 px-6 md:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Portfolio"
          title="Luxury Gallery"
          description="Curated moments from our studio — each session crafted with intention, light, and artistry."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[280px] md:auto-rows-[220px]"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={`${item.span} relative overflow-hidden group cursor-pointer bg-secondary/40 border border-border`}
            >
              <Image
                src={item.image}
                alt={item.category}
                fill
                className="object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                {item.category !== 'Pets' && (
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/70 mb-2">
                    {item.category}
                  </p>
                )}
                {item.caption && (
                  <p className="font-serif text-lg md:text-xl text-white font-light">
                    {item.caption}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mt-12 md:mt-16"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
