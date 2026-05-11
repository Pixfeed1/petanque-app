'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FadeIn, BouleSvg } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { Loader } from '@/components/Icons'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showError } = useToast()
  const [loading, setLoading] = useState(false)
  const paymentStatus = searchParams?.get('payment') ?? null

  const handleRetry = async () => {
    setLoading(true)
    try {
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' })
      if (!userResponse.ok) {
        router.push('/login')
        return
      }
      const userData = await userResponse.json()
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userData.user.id,
          userEmail: userData.user.email
        })
      })
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        showError('Erreur lors de la création de la session de paiement')
        setLoading(false)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError('Une erreur est survenue')
      setLoading(false)
    }
  }

  // STATE : PAIEMENT ANNULE
  if (paymentStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
        <FadeIn>
          <div className="max-w-md w-full">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-petanque-cochonnet-pale/40 text-petanque-cochonnet-fonce flex items-center justify-center text-2xl font-bold">!</div>
            </div>
            <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 text-center">
              Paiement · annulé
            </p>
            <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3 text-center">
              Paiement <span className="accent-italic text-petanque-vert">annulé.</span>
            </h1>
            <p className="text-base text-petanque-bois leading-relaxed mb-7 text-center">
              Tu as annulé le processus de paiement. Aucun montant n'a été débité.
            </p>

            <div className="flex flex-col items-stretch gap-3 mb-8">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full bg-petanque-vert text-petanque-sable px-4 py-3 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Préparation du paiement…
                  </>
                ) : (
                  'Réessayer le paiement'
                )}
              </button>
              <Link
                href="/dashboard"
                className="w-full text-center text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord bg-white px-4 py-2.5 rounded-lg"
              >
                Retour au tableau de bord
              </Link>
            </div>

            <div className="pt-6 border-t border-petanque-sable-bord/50 text-center">
              <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-2">
                Besoin d'aide ?
              </p>
              <p className="text-sm text-petanque-bois">
                Écris-nous à{' '}
                <a href="mailto:support@petanquepro.fr" className="text-petanque-vert hover:text-petanque-vert-fonce underline decoration-petanque-vert/30 hover:decoration-petanque-vert underline-offset-2">
                  support@petanquepro.fr
                </a>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  // STATE : FALLBACK
  return (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
      <FadeIn>
        <div className="max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <BouleSvg size={48} variant="acier" stries />
          </div>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 text-center">
            Espace · paiement
          </p>
          <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3 text-center">
            Page <span className="accent-italic text-petanque-vert">paiement.</span>
          </h1>
          <p className="text-base text-petanque-bois leading-relaxed mb-7 text-center">
            La gestion de tes paiements et abonnements se passe directement depuis ton tableau de bord ou ton espace client Stripe.
          </p>

          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="bg-petanque-vert text-petanque-sable px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
