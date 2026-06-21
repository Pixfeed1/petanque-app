import Footer from './components/footer'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ModesPreview } from '@/components/landing/ModesPreview'
import { Testimonials } from '@/components/landing/Testimonials'
// Gratuit pour tous : grille tarifaire masquée (composant conservé pour la Phase 2).
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
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
