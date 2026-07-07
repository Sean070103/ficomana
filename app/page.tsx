import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Gallery from '@/components/gallery'
import About from '@/components/about'
import SchoolAffiliations from '@/components/school-affiliations'
import Testimonials from '@/components/testimonials'
import PackageTeaser from '@/components/package-teaser'
import Pricing from '@/components/pricing'
import FAQ from '@/components/faq'
import Contact from '@/components/contact'
import Booking from '@/components/booking'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-foreground">
      <Navbar />
      <Hero />
      <Gallery />
      <About />
      <SchoolAffiliations />
      <Testimonials />
      <Pricing />
      <FAQ />
      <PackageTeaser />
      <Contact />
      <Booking />
      <Footer />
    </main>
  )
}
