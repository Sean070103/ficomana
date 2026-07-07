import Navbar from '@/components/navbar'
import SelfPortraitPackages from '@/components/self-portrait-packages'
import Footer from '@/components/footer'

export const metadata = {
  title: 'FICO & MANA Packages | FICO MANA Studio',
  description:
    'Self portrait packages for solo, duo, family, and barkada sessions at FICO MANA Studio.',
}

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 md:pt-24">
        <SelfPortraitPackages showBackLink />
      </div>
      <Footer />
    </main>
  )
}
