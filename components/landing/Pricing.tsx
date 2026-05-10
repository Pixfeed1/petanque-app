'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button, FadeIn } from '@/components/ui'

interface Plan {
  id: 'free' | 'essentiel' | 'club'
  name: string
  price: string
  period: string
  desc: string
  features: string[]
  cta: string
  featured?: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour découvrir',
    desc: 'Idéal pour tester sur un tournoi.',
    features: ['1 tournoi actif', '8 équipes max', 'Tous les modes', 'Export PDF & Excel', 'Historique'],
    cta: 'Essayer',
  },
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: '9,99€',
    period: 'par an',
    desc: 'Le quotidien des organisateurs.',
    features: ['Tout Gratuit', 'Tournois illimités', 'Équipes illimitées', 'Support prioritaire'],
    cta: 'Choisir Essentiel',
    featured: true,
  },
  {
    id: 'club',
    name: 'Club',
    price: '19,99€',
    period: 'par an',
    desc: 'Pour les clubs structurés.',
    features: [
      'Tout Essentiel',
      'Statistiques avancées',
      'Personnalisation club',
      'Règles de tournoi sur mesure',
    ],
    cta: 'Choisir Club',
  },
]

export function Pricing() {
  const router = useRouter()
  const { user } = useAuth()

  const handleClick = (plan: Plan) => {
    if (user && plan.id !== 'free') {
      router.push(`/dashboard?upgrade=true`)
    } else {
      router.push('/login')
    }
  }

  return (
    <section id="pricing" className="py-20 md:py-28 bg-petanque-sable-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl mb-14">
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Tarifs simples
          </p>
          <h2 className="text-3xl md:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1]">
            Commence gratuit,<br />
            <span className="accent-italic text-petanque-vert">monte quand tu veux.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 100}>
              <div
                className={`relative h-full flex flex-col bg-white rounded-xl p-7 transition-all duration-300 ${
                  plan.featured
                    ? 'border-2 border-petanque-vert -translate-y-2'
                    : 'border border-petanque-sable-bord/60'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-7 px-2.5 py-0.5 bg-petanque-vert text-petanque-sable text-[10px] font-medium uppercase tracking-widest rounded-full">
                    Recommandé
                  </span>
                )}

                <h3 className="text-base font-medium text-petanque-vert-fonce mb-1">{plan.name}</h3>
                <p className="text-xs text-petanque-bois mb-5">{plan.desc}</p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="font-mono text-3xl md:text-4xl font-medium text-petanque-vert-fonce">
                    {plan.price}
                  </span>
                  <span className="text-xs text-petanque-bois">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-petanque-vert-fonce">
                      <span className="text-petanque-vert mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => handleClick(plan)}
                >
                  {plan.cta}
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <p className="text-xs text-center text-petanque-bois mt-8">
            Paiement sécurisé par Stripe · 30 jours satisfait ou remboursé
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
