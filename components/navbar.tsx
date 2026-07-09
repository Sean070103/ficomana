'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Menu as MenuIcon } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
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

type NavLink = { href: string; label: string }
type NavDropdown = { label: string; links: NavLink[] }
type NavItem = NavLink | NavDropdown

function isDropdown(item: NavItem): item is NavDropdown {
  return 'links' in item
}

const navItems: NavItem[] = [
  { href: '/#home', label: 'Home' },
  {
    label: 'Explore',
    links: [
      { href: '/#gallery', label: 'Gallery' },
      { href: '/#reels', label: 'Reels' },
    ],
  },
  {
    label: 'Packages',
    links: [
      { href: '/#pricing', label: 'Pricing' },
      { href: '/packages', label: 'All Packages' },
    ],
  },
  {
    label: 'About',
    links: [
      { href: '/#about', label: 'Our Story' },
      { href: '/#affiliations', label: 'Schools' },
    ],
  },
  { href: '/#contact', label: 'Contact' },
]

function NavAnchor({ href, label, className }: { href: string; label: string; className: string }) {
  return (
    <a href={href} className={cn(className, 'group/nav relative')}>
      <span className="relative inline-block">
        {label}
        <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary transition-all duration-300 ease-out group-hover/nav:w-full group-hover/nav:shadow-[0_0_10px_rgba(5,0,208,0.55)]" />
      </span>
    </a>
  )
}

function NavDropdownMenu({
  label,
  links,
  linkClass,
}: {
  label: string
  links: NavLink[]
  linkClass: string
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        openOnHover
        delay={90}
        closeDelay={220}
        className={cn(
          linkClass,
          'group/trigger relative inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 outline-none',
        )}
      >
        <span className="relative inline-block">
          {label}
          <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary transition-all duration-300 ease-out group-hover/trigger:w-full group-aria-expanded/trigger:w-full group-aria-expanded/trigger:shadow-[0_0_10px_rgba(5,0,208,0.55)]" />
        </span>
        <ChevronDown className="size-3 opacity-50 transition-all duration-300 ease-out group-hover/trigger:opacity-90 group-aria-expanded/trigger:rotate-180 group-aria-expanded/trigger:opacity-100" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={14} align="center">
          <Menu.Popup className="nav-dropdown-popup min-w-[12.5rem] overflow-hidden border border-white/10 bg-gradient-to-b from-[#0c0c12]/98 to-black/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] py-2 outline-none origin-top transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[starting-style]:-translate-y-2 data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96] data-[ending-style]:-translate-y-2">
            <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            {links.map((link) => (
              <Menu.LinkItem
                key={link.href}
                href={link.href}
                closeOnClick
                className="nav-dropdown-item relative mx-1.5 block rounded-sm px-3.5 py-2.5 text-[10px] tracking-[0.16em] uppercase text-white/65 outline-none transition-all duration-200 ease-out before:absolute before:left-0 before:top-1/2 before:h-0 before:w-0.5 before:-translate-y-1/2 before:bg-primary before:opacity-0 before:transition-all before:duration-200 hover:text-white data-[highlighted]:bg-white/[0.07] data-[highlighted]:pl-4 data-[highlighted]:text-white data-[highlighted]:before:h-3.5 data-[highlighted]:before:opacity-100"
              >
                {link.label}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

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
      'font-semibold uppercase transition-colors duration-300 ease-out',
      mobile
        ? 'text-sm tracking-[0.15em] text-foreground hover:text-primary py-3 border-b border-border/60 w-full text-left'
        : 'text-[10px] tracking-[0.2em]',
      !mobile &&
        (isScrolled
          ? 'text-white/75 hover:text-white'
          : 'text-white/90 hover:text-white'),
    )

  const bookButtonClass = cn(
    buttonVariants({ size: 'lg' }),
    'rounded-none text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase h-10 sm:h-11 md:h-12 px-5 sm:px-7 md:px-8 transition-all duration-300 ease-out hover:shadow-[0_0_24px_rgba(5,0,208,0.35)]',
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
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-12 lg:px-16 transition-all duration-500 ease-out',
        isScrolled
          ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] py-2'
          : 'bg-transparent border-b border-transparent py-2.5 sm:py-3',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <Link href="/#home" className="flex items-center justify-start shrink-0 min-w-0 max-w-[60%] sm:max-w-none">
            <Image
              src="/logoo%20(1).png"
              alt="Fico Mana Self Portrait Studio"
              width={360}
              height={108}
              className={cn(
                'w-auto h-auto transition-all duration-300',
                isScrolled
                  ? 'h-12 sm:h-14 md:h-16'
                  : 'h-16 sm:h-20 md:h-28 lg:h-32 xl:h-36',
              )}
              priority
            />
        </Link>

        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
          {navItems.map((item) =>
            isDropdown(item) ? (
              <NavDropdownMenu
                key={item.label}
                label={item.label}
                links={item.links}
                linkClass={linkClass()}
              />
            ) : (
              <NavAnchor key={item.href} href={item.href} label={item.label} className={linkClass()} />
            ),
          )}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          <Button
            nativeButton={false}
              render={<Link href="/#booking" />}
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
              <MenuIcon className="size-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left text-xs tracking-[0.2em] uppercase">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-4">
                <AnimatePresence>
                  {open &&
                    navItems.map((item, index) => (
                      <motion.div
                        key={isDropdown(item) ? item.label : item.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{
                          delay: index * 0.045,
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {isDropdown(item) ? (
                          <div className="border-b border-border/60 pb-2 mb-1">
                            <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-primary pt-3 pb-2">
                              {item.label}
                            </p>
                            {item.links.map((link) => (
                              <SheetClose
                                key={link.href}
                                render={
                                  <Link
                                    href={link.href}
                                    className={cn(linkClass(true), 'pl-3 border-l-2 border-transparent hover:border-primary/50')}
                                  />
                                }
                              >
                                {link.label}
                              </SheetClose>
                            ))}
                          </div>
                        ) : (
                          <SheetClose
                            render={<Link href={item.href} className={linkClass(true)} />}
                          >
                            {item.label}
                          </SheetClose>
                        )}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </nav>
              <div className="px-4 pt-4 mt-auto">
                <SheetClose
                  render={
                    <Link
                      href="/#booking"
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
