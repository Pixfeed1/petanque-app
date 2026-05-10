'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button, FadeIn, BouleSvg } from '@/components/ui'

export function FinalCTA() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-petanque-vert-fonce">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(244,234,208,0.6) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}
      />
      <div className="absolute -top-32 -right-20 opacity-10">
        <BouleSvg size={280} variant="acier" stries />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-cochonnet uppercase tracking-[0.18em] mb-4">
            Prêt à tirer ?
          </p>
          <h2 className="text-3xl md:text-5xl font-medium text-petanque-sable tracking-tight leading-[1.1] mb-6">
            Le prochain tournoi mérite mieux<br />
            <span className="accent-italic">qu'un tableau Excel.</span>
          </h2>
          <p className="text-base md:text-lg text-petanque-sable/70 max-w-xl mx-auto mb-10">
            Rejoins les clubs qui gèrent déjà leurs tournois sans tableau noir,
            sans calculatrice, sans énervement.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={() => router.push(user ? '/dashboard' : '/login')}
              className="inline-flex items-center justify-center gap-2 px-7 h-12 bg-petanque-sable text-petanque-vert-fonce text-sm font-medium rounded-xl shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              {user ? 'Accéder au tableau de bord' : 'Lancer mon premier tournoi'} →
            </button>
            {!user && (
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center justify-center gap-2 px-7 h-12 bg-transparent text-petanque-sable text-sm font-medium rounded-xl border border-petanque-sable/30 hover:bg-petanque-sable/10 transition-all duration-200"
              >
                Créer un compte gratuit
              </button>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
