'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BouleSvg } from '@/components/ui'

interface FooterProps {
  scrollToSection?: (sectionId: string) => void
}

export default function Footer({ scrollToSection }: FooterProps) {
  const router = useRouter()

  const handleNavigation = (sectionId: string) => {
    if (scrollToSection) {
      scrollToSection(sectionId)
    } else {
      router.push('/#' + sectionId)
    }
  }

  const year = new Date().getFullYear()

  return (
    <footer className="bg-petanque-sable border-t border-petanque-sable-bord/60 text-petanque-vert-fonce/85 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 gap-y-10 pb-8 border-b border-petanque-sable-bord/50">

          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <BouleSvg size={26} variant="acier" stries />
              <span className="text-base font-medium text-petanque-vert-fonce tracking-tight group-hover:text-petanque-vert transition-colors">
                Pétanque Pro
              </span>
            </Link>
            <p className="text-sm text-petanque-bois leading-relaxed max-w-xs">
              L'application des organisateurs de tournois. Mêlées, équipes choisies, podium imprimable.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium mb-4">
              Produit
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/modes" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">
                  Modes de jeu
                </Link>
              </li>
              <li>
                <button onClick={() => handleNavigation('pricing')} className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors text-left">
                  Tarifs
                </button>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <button onClick={() => handleNavigation('testimonials')} className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors text-left">
                  Témoignages
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium mb-4">
              Support
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="mailto:support@petanquepro.fr" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">Contact</a>
              </li>
              <li>
                <Link href="/avis" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">Avis utilisateurs</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium mb-4">
              Légal
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/legal/mentions" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">Mentions légales</Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">Confidentialité</Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-petanque-vert-fonce/85 hover:text-petanque-vert transition-colors">CGV</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-petanque-bois">
            © {year} Pétanque Pro · une création <a href="https://pixfeed.net" target="_blank" rel="noopener noreferrer" className="text-petanque-vert hover:text-petanque-vert-fonce font-medium transition-colors">PixFeed</a>
          </p>
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.14em]">
            Fait à Franconville
          </p>
        </div>

      </div>
    </footer>
  )
}
