// app/pack-club/page.tsx
// Page d'achat Pack Club - Règles personnalisées pour clubs

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { Petanque, Check, ArrowLeft } from '@/components/Icons'
import { useToast } from '@/components/ui/Toast'

export default function PackClubPage() {
  const router = useRouter()
  const { user, hasPackClub, isPremium, loading: authLoading } = useAuth()
  const { showError } = useToast()
  const [processingPayment, setProcessingPayment] = useState(false)

  const handlePurchase = async (productType: 'pack_club' | 'premium_bundle' = 'pack_club') => {
    if (!user?.id) {
      router.push('/login?redirect=/pack-club')
      return
    }

    // Si c'est pack_club seul, vérifier qu'on est Premium
    if (productType === 'pack_club' && !isPremium) {
      showError('Vous devez etre Premium pour acheter le Pack Club seul')
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          product: productType
        })
      })

      const { url, error } = await response.json()

      if (error) {
        showError(error)
        setProcessingPayment(false)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error)
      showError('Une erreur est survenue. Veuillez réessayer.')
      setProcessingPayment(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <Petanque className="w-10 h-10" />
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Petanque Pro
              </span>
            </div>

            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
              Option pour clubs
            </div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Pack Club
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Creez vos propres regles de tournoi personnalisees pour votre club
            </p>
          </div>

          {/* Pricing card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
            {/* Header gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Regles personnalisees</h2>
                  <p className="text-white/80">Configurez chaque aspect de vos tournois</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">9,99</span>
                    <span className="text-2xl">EUR</span>
                  </div>
                  <p className="text-white/80">/an</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Fonctionnalites incluses</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Modes de jeu */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Modes de jeu</p>
                      <p className="text-sm text-gray-600">Equipes choisies, melees, tournantes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Formats d equipe</p>
                      <p className="text-sm text-gray-600">Tete-a-tete, doublette, triplette</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Regles H/F</p>
                      <p className="text-sm text-gray-600">Mixite, equilibre, jamais 3 du meme genre</p>
                    </div>
                  </div>
                </div>

                {/* Classement et terrains */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Methodes de classement</p>
                      <p className="text-sm text-gray-600">Victoires, points, difference</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Gestion terrains</p>
                      <p className="text-sm text-gray-600">Attribution automatique ou manuelle</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Regles illimitees</p>
                      <p className="text-sm text-gray-600">Creez autant de presets que vous voulez</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                {hasPackClub ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl font-medium">
                      <Check className="w-5 h-5" />
                      Pack Club actif
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      Vous avez deja le Pack Club. Accedez a vos regles depuis le dashboard.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="mt-4 text-green-600 hover:text-green-700 font-medium"
                    >
                      Aller au dashboard
                    </button>
                  </div>
                ) : !isPremium ? (
                  <div className="space-y-4">
                    {/* Option Pack Complet - Recommandee */}
                    <div className="relative pt-2">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-md">
                        Recommande
                      </div>
                      <button
                        onClick={() => handlePurchase('premium_bundle')}
                        disabled={processingPayment}
                        className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processingPayment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span>Redirection...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Premium + Pack Club - 29,98 EUR/an</span>
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-xs text-center text-gray-500">
                        Inclut Premium (sans pub) + Pack Club (regles personnalisees)
                      </p>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative px-4 bg-white text-sm text-gray-500">ou</div>
                    </div>

                    {/* Option Premium seul */}
                    <button
                      onClick={() => router.push('/dashboard?upgrade=true')}
                      className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Premium seul - 19,99 EUR/an</span>
                    </button>
                    <p className="text-xs text-center text-gray-500">
                      Paiement securise par Stripe
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handlePurchase('pack_club')}
                      disabled={processingPayment}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Redirection vers le paiement...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Acheter Pack Club - 9,99 EUR/an</span>
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-xs text-center text-gray-500">
                      Paiement securise par Stripe
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Use cases */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Parfait pour les clubs qui ont leurs propres regles
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Clubs de petanque</h3>
                <p className="text-sm text-gray-600">
                  Appliquez les regles specifiques de votre club a chaque tournoi
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Comites departementaux</h3>
                <p className="text-sm text-gray-600">
                  Standardisez les regles pour tous les tournois du departement
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tournois speciaux</h3>
                <p className="text-sm text-gray-600">
                  Creez des formats uniques pour vos evenements speciaux
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Questions frequentes
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Puis-je creer plusieurs jeux de regles ?
                </h3>
                <p className="text-gray-600">
                  Oui, vous pouvez creer autant de presets de regles que vous voulez. Chaque preset peut etre utilise pour differents types de tournois.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Le Pack Club est-il inclus dans Premium ?
                </h3>
                <p className="text-gray-600">
                  Non, le Pack Club est une option separee. Premium supprime les publicites, Pack Club ajoute les regles personnalisees.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Que se passe-t-il si je ne renouvelle pas ?
                </h3>
                <p className="text-gray-600">
                  Vos regles restent sauvegardees mais vous ne pourrez plus les modifier ou en creer de nouvelles. Les tournois existants continuent de fonctionner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
