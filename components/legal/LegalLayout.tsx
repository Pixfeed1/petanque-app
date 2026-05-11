'use client'

import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import Footer from '@/app/components/footer'

interface LegalLayoutProps {
  eyebrow: string
  titleStart: string
  titleAccent: string
  intro: string
  lastUpdate?: string
  crossLink?: { label: string; href: string }
  pageTitle: string
  children: React.ReactNode
}

export default function LegalLayout({
  eyebrow, titleStart, titleAccent, intro,
  lastUpdate = '13 novembre 2025', crossLink, pageTitle, children
}: LegalLayoutProps) {
  const router = useRouter()

  const scrollToSection = (sectionId: string) => {
    window.location.href = '/#' + sectionId
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button onClick={() => router.push('/')} className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5">
              <span>←</span>
              <span className="hidden sm:inline">Accueil</span>
            </button>
            <span className="font-mono text-xs text-petanque-bois">{pageTitle}</span>
            {crossLink ? (
              <button onClick={() => router.push(crossLink.href)} className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord px-3 py-1.5 rounded-lg bg-white whitespace-nowrap">
                {crossLink.label}
              </button>
            ) : <span style={{ width: 1 }}></span>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            {eyebrow}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-4">
            {titleStart} <span className="accent-italic text-petanque-vert">{titleAccent}</span>
          </h1>
          <p className="text-base text-petanque-bois leading-relaxed mb-6 max-w-2xl">{intro}</p>
          <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.14em] pb-8 mb-8 border-b border-petanque-sable-bord/50">
            Dernière mise à jour · {lastUpdate}
          </p>
        </FadeIn>

        {children}
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
