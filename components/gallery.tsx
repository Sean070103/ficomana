'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import SectionHeader from '@/components/section-header'
import SectionShell from '@/components/section-shell'

const IMAGE_WIDTH = 2040
const IMAGE_HEIGHT = 2560

type GalleryItem = {
  id: number
  image: string
  category: string
  label: string
}

const topRowItems: GalleryItem[] = [
  { id: 1, image: '/grad/grad_3.jpg', category: 'Graduation', label: 'TOGA' },
  { id: 2, image: '/grad/grad_1.jpg', category: 'Graduation', label: 'TOGA WITH CAP' },
  { id: 3, image: '/grad/grad_8.jpg', category: 'Graduation', label: 'TOGA WITH CAP' },
]

const bottomRowItems: GalleryItem[] = [
  { id: 4, image: '/grad/grad_4.jpg', category: 'Graduation', label: 'TOGA' },
  { id: 5, image: '/grad/grad_5.jpg', category: 'Graduation', label: 'GLAMOUR SHOT' },
  { id: 6, image: '/grad/grad_2.jpg', category: 'Graduation', label: '' },
  { id: 7, image: '/grad/grad_6.jpg', category: 'Graduation', label: '' },
  { id: 8, image: '/grad/grad_7.jpg', category: 'Graduation', label: '' },
  { id: 9, image: '/grad/grad_9.jpg', category: 'Graduation', label: 'SABLAY' },
]

const categories = ['All', 'Graduation']

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

function GalleryImage({
  item,
  variants,
  className = '',
}: {
  item: GalleryItem
  variants: typeof itemVariants
  className?: string
}) {
  return (
    <motion.div
      variants={variants}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl group cursor-pointer ${className}`}
    >
      <div className="overflow-hidden">
        <Image
          src={item.image}
          alt={item.category}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="w-full h-auto block transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
        />
      </div>
      {item.label && (
        <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 z-10 pointer-events-none">
          <p className="text-[9px] md:text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-lg transition-transform duration-700 ease-out group-hover:translate-y-[-2px]">
            {item.label}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All')

  const showGallery = activeCategory === 'All' || activeCategory === 'Graduation'

  const [grad4, grad5, grad2, grad6, grad7, grad9] = bottomRowItems

  return (
    <SectionShell id="gallery" variant="elevated">
      <SectionHeader
          eyebrow="Portfolio"
          title="Graduation Gallery"
          description="Celebrate your achievement with professionally captured graduation portraits — elegant, timeless, and uniquely yours."
        />

        {showGallery && (
          <div className="space-y-2 md:space-y-3">
            {/* Desktop top row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="hidden md:grid grid-cols-3 gap-3"
            >
              {topRowItems.map((item) => (
                <GalleryImage key={item.id} item={item} variants={itemVariants} />
              ))}
            </motion.div>

            {/* Mobile — horizontal scroll */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="flex md:hidden gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2"
            >
              {[...topRowItems, ...bottomRowItems].map((item) => (
                <GalleryImage
                  key={item.id}
                  item={item}
                  variants={itemVariants}
                  className="min-w-[75vw] snap-center shrink-0"
                />
              ))}
            </motion.div>

            {/* Desktop bottom masonry */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="hidden md:flex gap-3 items-start"
            >
              <GalleryImage item={grad4} variants={itemVariants} className="w-[40%] shrink-0" />

              <div className="flex-1 grid grid-cols-3 gap-3 items-start">
                <GalleryImage item={grad5} variants={itemVariants} className="col-span-2" />
                <GalleryImage item={grad2} variants={itemVariants} className="col-span-1" />
                <GalleryImage item={grad6} variants={itemVariants} className="col-span-1" />
                <GalleryImage item={grad7} variants={itemVariants} className="col-span-1" />
                <GalleryImage item={grad9} variants={itemVariants} className="col-span-1" />
              </div>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 pt-6"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
    </SectionShell>
  )
}
