import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/site-metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Submit Raw Photos',
  description:
    'Submit your five chosen raw photos from your FICO MANA session for professional editing.',
  path: '/submit-raw-photo',
  noIndex: true,
})

export default function SubmitRawPhotoLayout({ children }: { children: React.ReactNode }) {
  return children
}
