'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button, BouleSvg } from '@/components/ui'
import { AppMockup } from './AppMockup'

const Boule3D = dynamic(() => import('@/components/ui/Boule3D').then((m) => m.Boule3D), {
  ssr: false,
  loading: () => null,
})

export function Hero() {
  const router = useRouter()
  const { user, loading } = useAuth()

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 overflow-hidden">

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-petanque-vert-pale/30 via-white to-petanque-cochonnet-pale/40" />
      <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-petanque-vert-pale rounded-full blur-3xl opacity-50 animate-blob -z-10" />
      <div className="absolute -bottom-40 -left-32 w-[380px] h-[380px] bg-petanque-cochonnet-pale rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 backdrop-blur-sm border border-petanque-sable-bord/60 rounded-full mb-6">
              <BouleSvg size={16} variant="acier" stries />
              <span className="text-[11px] font-medium text-petanque-vert-fonce tracking-wide">
                Pensé par et pour les bouleurs
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-6">
              Choisi, mêlée fixe,<br />
              mêlée tournante.<br />
              <span className="accent-italic text-petanque-vert">Une seule app.</span>
            </h1>

            <p className="text-base md:text-lg text-petanque-bois leading-relaxed mb-8 max-w-xl">
              L'application tout-en-un pour les organisateurs de tournois de pétanque.
              Tirages automatiques, gestion temps réel, règles FIPJP. Sans Excel, sans tableau noir.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
              {loading ? (
                <div className="w-44 h-12 bg-petanque-sable rounded-xl animate-pulse" />
              ) : user ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Accéder au tableau de bord →
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/login')}
                  >
                    Lancer un tournoi
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById('features')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Voir comment ça marche
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-petanque-bois">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert" />
                Version gratuite
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert" />
                Compatible mobile
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert" />
                Données sécurisées
              </span>
            </div>
          </div>

          <div className="relative">
            <AppMockup className="relative z-10 max-w-sm mx-auto" />
            <div className="absolute -top-12 -right-4 z-20 hidden sm:block">
              <Boule3D size={160} variant="acier" rotateSpeed={0.35} />
            </div>
            <div className="absolute -bottom-8 -left-2 z-0 hidden sm:block opacity-80">
              <BouleSvg size={90} variant="cochonnet" stries={false} />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
