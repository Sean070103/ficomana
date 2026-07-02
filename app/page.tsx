import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Gallery from '@/components/gallery'
import Experience from '@/components/experience'
import About from '@/components/about'
import Testimonials from '@/components/testimonials'
import Booking from '@/components/booking'
import FAQ from '@/components/faq'
import Contact from '@/components/contact'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Gallery />
      <Experience />
      <About />
      <Testimonials />
      <Booking />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
