'use client'

import { motion } from 'framer-motion'
import { Mail, ArrowUpRight } from 'lucide-react'
import SectionHeader from '@/components/section-header'

const contactMethods = [
  {
    icon: (props: any) => (
      <svg className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24" {...props}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
      </svg>
    ),
    label: 'Facebook',
    value: 'FICOMANA',
    href: 'https://www.facebook.com/FICOMANA',
  },
  {
    icon: (props: any) => (
      <svg className="w-5 h-5 text-primary fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    ),
    label: 'Instagram',
    value: '@ficomanastudio',
    href: 'https://www.instagram.com/ficomanastudio/',
  },
  {
    icon: (props: any) => (
      <svg className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.82.96 1.93 1.66 3.16 2.05.02 1.33.01 2.66.02 4-.98-.05-1.94-.35-2.8-.83-.8-.44-1.49-1.07-2-1.84v6.23c.04 1.35-.3 2.72-1.02 3.86-.88 1.33-2.3 2.27-3.88 2.58-1.57.34-3.26.13-4.7-.58-1.5-.72-2.73-2.02-3.37-3.62-.64-1.57-.61-3.37.07-4.92.68-1.58 2.02-2.84 3.65-3.48.96-.39 2-.54 3.03-.45v4.06c-.7-.14-1.46-.02-2.09.31-.67.33-1.19.95-1.41 1.67-.28.84-.13 1.79.39 2.49.52.71 1.36 1.12 2.24 1.12.87 0 1.69-.41 2.19-1.12.35-.5.5-1.12.47-1.74V.02z"/>
      </svg>
    ),
    label: 'TikTok',
    value: '@ficomana.studio',
    href: 'https://www.tiktok.com/@ficomana.studio',
  },
  {
    icon: (props: any) => <Mail {...props} />,
    label: 'Email',
    value: 'ficomanaph@gmail.com',
    href: 'mailto:ficomanaph@gmail.com',
  },
]

export default function Contact() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section id="contact" className="py-24 md:py-32 px-6 md:px-12 bg-secondary">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Get In Touch"
          title="Ready to Create?"
          description="Connect with us and let's bring your vision to life."
          align="center"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-4 md:gap-5 mb-12"
        >
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <motion.a
                key={index}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                className="group flex items-center gap-5 p-6 md:p-7 bg-card border border-border hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-1">
                    {method.label}
                  </p>
                  <p className="font-medium text-sm md:text-base truncate group-hover:text-primary transition-colors">
                    {method.value}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
              </motion.a>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="#booking"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-12 py-4 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-500 hover:bg-[#03008F]"
          >
            Book Now
          </a>
        </motion.div>
      </div>
    </section>
  )
}
