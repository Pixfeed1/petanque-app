'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Info, Warning, Check } from '@/components/Icons'
import { useToast } from '@/components/ui/Toast'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showError } = useToast()
  const [loading, setLoading] = useState(false)
  const paymentStatus = searchParams?.get('payment') ?? null

  const handleRetry = async () => {
    setLoading(true)
    try {
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include'
      })

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Paiement annulé */}
        {paymentStatus === 'cancelled' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <Warning className="w-10 h-10 text-yellow-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Paiement annulé
            </h1>

            <p className="text-gray-600 mb-8">
              Vous avez annulé le processus de paiement. Aucun montant n'a été débité.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Réessayer le paiement'}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Retour au Dashboard
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 text-left">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Besoin d'aide ?</p>
                  <p>
                    Contactez notre support à{' '}
                    <a href="mailto:support@petanquepro.fr" className="text-green-600 hover:underline">
                      support@petanquepro.fr
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statut inconnu */}
        {!paymentStatus && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Info className="w-10 h-10 text-gray-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Paiement
            </h1>

            <p className="text-gray-600 mb-8">
              Page de gestion des paiements Stripe.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Retour au Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
