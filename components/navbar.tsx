'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#experience', label: 'Experience' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkClass = (mobile = false) =>
    cn(
      'font-semibold uppercase transition-colors duration-300',
      mobile
        ? 'text-sm tracking-[0.15em] text-foreground hover:text-primary py-3 border-b border-border/60 w-full text-left'
        : 'text-[10px] tracking-[0.2em]',
      !mobile &&
        (isScrolled
          ? 'text-slate-700 hover:text-primary'
          : 'text-white hover:text-white/80'),
    )

  const bookButtonClass = cn(
    buttonVariants({ size: 'lg' }),
    'rounded-none text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase h-10 sm:h-11 md:h-12 px-5 sm:px-7 md:px-8',
    isScrolled
      ? 'bg-primary text-primary-foreground hover:bg-[#03008F]'
      : 'bg-white text-primary hover:bg-white/90',
  )

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-12 lg:px-16 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm py-2'
          : 'bg-transparent border-b border-transparent py-2.5 sm:py-3',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <Link href="#home" className="flex items-center justify-start shrink-0 min-w-0 max-w-[55%] sm:max-w-none">
          <div className={cn('inline-flex items-center', isScrolled && 'bg-black px-1.5 py-0.5 sm:px-2 sm:py-1')}>
            <Image
              src="/logoo%20(1).png"
              alt="Fico Mana Self Portrait Studio"
              width={360}
              height={108}
              className={cn(
                'w-auto h-auto transition-all duration-300',
                isScrolled
                  ? 'h-9 sm:h-10 md:h-12'
                  : 'h-11 sm:h-14 md:h-20 lg:h-24 xl:h-28',
              )}
              priority
            />
          </div>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={linkClass()}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          <Button
            nativeButton={false}
            render={<Link href="#booking" />}
            className={bookButtonClass}
          >
            Book Session
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className={cn(
                    'md:hidden rounded-none border',
                    isScrolled
                      ? 'border-border bg-background text-foreground'
                      : 'border-white/40 bg-white/10 text-white hover:bg-white/20',
                  )}
                />
              }
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left text-xs tracking-[0.2em] uppercase">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-4">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={<Link href={link.href} className={linkClass(true)} />}
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="px-4 pt-4 mt-auto">
                <SheetClose
                  render={
                    <Link
                      href="#booking"
                      className={cn(buttonVariants({ size: 'lg' }), 'w-full rounded-none text-xs sm:text-sm tracking-[0.2em] uppercase h-12')}
                    />
                  }
                >
                  Book Session
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  )
}
