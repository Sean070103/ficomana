'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, ExternalLink } from 'lucide-react'

const navLinks = [
  { href: '/#home', label: 'Home' },
  { href: '/#gallery', label: 'Gallery' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <footer className="bg-black text-white border-t border-white/10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="px-6 md:px-12 pt-16 md:pt-20 pb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 md:gap-8 mb-16">
            <motion.div variants={itemVariants} className="md:col-span-4">
              <Image
                src="/logoo%20(1).png"
                alt="Fico Mana Self Portrait Studio"
                width={180}
                height={54}
                className="h-14 w-auto mb-4"
              />
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/50 mb-3">
                Cabuyao Retail Plaza Tenants Association
              </p>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                A private self-portrait studio dedicated to capturing authentic moments
                with professional lighting and a private, creative space.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2">
              <h4 className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-5 text-white/40">
                Navigate
              </h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-3 space-y-5">
              <div>
                <h4 className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-4 text-white/40">
                  Find Us
                </h4>
                <div className="space-y-3 text-xs text-white/80">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      Cabuyao Retail Plaza<br />
                      4025 Cabuyao Laguna
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <a href="tel:+63495765176" className="hover:underline hover:text-white transition-colors font-medium">
                      +63 49 576 5176
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-3 text-white/40">
                  Connect
                </h4>
                <div className="flex gap-2.5">
                  <a
                    href="https://www.facebook.com/FICOMANA"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 flex items-center justify-center border border-white/20 text-white hover:border-primary hover:bg-primary transition-all duration-300"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/ficomanastudio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 flex items-center justify-center border border-white/20 text-white hover:border-primary hover:bg-primary transition-all duration-300"
                  >
                    <svg className="w-4.5 h-4.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-3 space-y-4">
              <h4 className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/40">
                Directions
              </h4>
              <div className="w-full h-[120px] border border-white/10 overflow-hidden">
                <iframe
                  title="Cabuyao Retail Plaza Map"
                  src="https://maps.google.com/maps?q=Cabuyao%20Retail%20Plaza,%20Laguna&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 opacity-90 hover:opacity-100 transition-opacity duration-300"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <a
                href="https://maps.google.com/?q=Cabuyao+Retail+Plaza+Laguna"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase text-white/80 hover:text-white transition-colors"
              >
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50"
          >
            <p>&copy; {currentYear} FICO MANA. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  )
}
