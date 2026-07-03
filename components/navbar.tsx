'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#experience', label: 'Experience' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-16 transition-all duration-300 overflow-visible ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm py-2'
          : 'bg-transparent border-b border-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="#home" className="flex items-center justify-start shrink-0">
          <div className={`inline-flex items-center ${isScrolled ? 'bg-black px-2 py-1' : ''}`}>
            <Image
              src="/logoo%20(1).png"
              alt="Fico Mana Self Portrait Studio"
              width={360}
              height={108}
              className={`w-auto transition-all duration-300 ${
                isScrolled ? 'h-12 md:h-14' : 'h-16 sm:h-[4.5rem] md:h-20 lg:h-24 xl:h-28'
              }`}
              priority
            />
          </div>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors duration-300 ${
                isScrolled
                  ? 'text-slate-700 hover:text-primary'
                  : 'text-white hover:text-white/80'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex justify-end">
          <a
            href="#booking"
            className={`text-[10px] font-semibold tracking-[0.2em] uppercase px-5 py-2 transition-all duration-300 ${
              isScrolled
                ? 'bg-primary text-white hover:bg-[#03008F]'
                : 'bg-white text-primary hover:bg-white/90'
            }`}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Book Session
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
