import Footer from './components/footer'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ModesPreview } from '@/components/landing/ModesPreview'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <ModesPreview />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
