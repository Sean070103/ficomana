import { ficoPackages, manaPackages, creativePackages } from '@/lib/self-portrait-packages'

export type BookingPackageCategory = 'graduation' | 'self-portrait' | 'creative'

export type BookingPackage = {
  id: string
  category: BookingPackageCategory
  title: string
  price: string
  duration: string
  description: string
  features: string[]
  slotType: 'makeup' | 'standard'
  badge?: string
  note?: string
}

const WALK_IN_INELIGIBLE = /walk-in clients are not eligible/i

export function isWalkInEligiblePackage(pkg: Pick<BookingPackage, 'description' | 'note'>): boolean {
  return !WALK_IN_INELIGIBLE.test(pkg.description) && !WALK_IN_INELIGIBLE.test(pkg.note ?? '')
}

export const BOOKING_PACKAGE_CATEGORY_LABELS: Record<BookingPackageCategory, string> = {
  graduation: 'Graduation',
  'self-portrait': 'Self Portrait',
  creative: 'Creative',
}

function durationFromIncludes(includes: string[]): string {
  const timed = includes.filter((item) => /mins/i.test(item))
  return timed.length > 0 ? timed.join(' · ') : 'Studio session'
}

const graduationPackages: BookingPackage[] = [
  {
    id: 'fico-package',
    category: 'graduation',
    title: 'FICO PACKAGE',
    price: '₱3,500',
    duration: '30 mins',
    description:
      'Without Hair and Makeup. Perfect for graduation portraits with professional lighting and studio equipment.',
    features: [
      'Free use of Toga & Cap',
      'Free use of Alampay',
      'Professional Photographer',
      '5 Edited/Enhanced Copies',
      'Professional Light Setup',
      '2 pegs (toga, uniform, or alampay)',
      '2 pcs. 4R-sized Prints',
      '4 pcs. Wallet-sized Prints',
      '1 pc. 8R Glass-to-Glass Frame',
      'Get ALL RAW Copies',
      'Receive 5 enhanced photos 14 days after selection',
    ],
    slotType: 'standard',
  },
  {
    id: 'mana-makeup',
    category: 'graduation',
    title: 'MANA PACKAGE',
    price: '₱6,500',
    duration: '2 hours',
    description:
      'With Hair and Makeup. A complete graduation experience with styling, shoot, and premium prints.',
    features: [
      'Free use of Toga & Cap',
      'Free use of Alampay',
      'Professional Photographer',
      '5 Edited/Enhanced Copies',
      'Professional Light Setup',
      '2 pegs (toga, uniform, or alampay)',
      '2 pcs. 4R-sized Prints',
      '4 pcs. Wallet-sized Prints',
      '1 pc. 8R Glass-to-Glass Frame',
      'Get ALL RAW Copies',
      'Receive 5 enhanced photos 14 days after selection',
      'Professional hair & makeup',
    ],
    slotType: 'makeup',
  },
]

const creativeBookingPackages: BookingPackage[] = creativePackages.flatMap((pkg) => [
  {
    id: 'creative-package',
    category: 'creative' as const,
    title: 'CREATIVE PACKAGE',
    price: '₱13,500',
    duration: '2–3 hours photoshoot',
    description: pkg.title,
    features: pkg.includes,
    slotType: 'makeup' as const,
  },
  {
    id: 'creative-package-makeup',
    category: 'creative' as const,
    title: 'CREATIVE PACKAGE (With Hair & Makeup)',
    price: '₱15,500',
    duration: '2–3 hours photoshoot (includes HMUA for 2 pegs)',
    description: pkg.title,
    features: [...pkg.includes, 'Hair & makeup for 2 pegs'],
    slotType: 'makeup' as const,
  },
])

const selfPortraitPackages: BookingPackage[] = [...ficoPackages, ...manaPackages].map((pkg) => ({
  id: pkg.id,
  category: 'self-portrait' as const,
  title: `${pkg.tier} — ${pkg.title}`,
  price: pkg.price,
  duration: durationFromIncludes(pkg.includes),
  description: pkg.note ?? pkg.title,
  features: pkg.includes,
  slotType: /hair and makeup/i.test(pkg.title) ? ('makeup' as const) : ('standard' as const),
  badge: pkg.badge,
  note: pkg.note,
}))

export const bookingPackages: BookingPackage[] = [...graduationPackages, ...selfPortraitPackages.filter((p) => p.category !== 'creative'), ...creativeBookingPackages]

export function getBookingPackage(id: string): BookingPackage | undefined {
  return bookingPackages.find((pkg) => pkg.id === id)
}

export function getBookingUrl(packageId: string): string {
  return `/?package=${encodeURIComponent(packageId)}#booking`
}

export function parsePackagePrice(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0
}

export function usesMakeupSlots(packageId: string): boolean {
  return getBookingPackage(packageId)?.slotType === 'makeup'
}
