import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ficomana.studio'

const siteDescription =
  'FICO MANA is a premier self-portrait and graduation photography studio in Cabuyao, Laguna. Book your session for timeless portraits, professional lighting, and an unforgettable studio experience.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FICO MANA | Self Portrait Studio',
    template: '%s | FICO MANA',
  },
  description: siteDescription,
  applicationName: 'FICO MANA',
  authors: [{ name: 'FICO MANA Studio', url: siteUrl }],
  creator: 'FICO MANA Studio',
  keywords: [
    'FICO MANA',
    'self portrait studio',
    'graduation photography',
    'Cabuyao photography',
    'Laguna photo studio',
    'graduation portraits',
    'portrait studio Philippines',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: '/',
    siteName: 'FICO MANA',
    title: 'FICO MANA | Self Portrait Studio',
    description: siteDescription,
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'FICO MANA logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'FICO MANA | Self Portrait Studio',
    description: siteDescription,
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#222222',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${cormorant.variable} bg-background`}>
      <head>
        <link rel="preload" href="/breanna-reel.mp4" as="video" type="video/mp4" />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
