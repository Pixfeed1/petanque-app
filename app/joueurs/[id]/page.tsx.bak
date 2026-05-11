'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { ArrowLeft, Email, Phone, User, Calendar, Edit, Loader, Trophy, Target } from '@/components/Icons'

interface JoueurDetail {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  created_at?: string
  stats?: any
}

export default function JoueurDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [joueur, setJoueur] = useState<JoueurDetail | null>(null)

  // Extraire l'ID du paramètre (format: "3-jean-dupont" -> "3")
  const joueurId = params?.id ? String(params.id).split('-')[0] : null

  useEffect(() => {
    if (joueurId && organization?.id) {
      fetchJoueur()
    }
  }, [joueurId, organization])

  const fetchJoueur = async () => {
    try {
      const response = await fetch(`/api/joueurs/${joueurId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setJoueur(data)
      } else {
        console.error('Joueur non trouvé')
        router.push('/joueurs')
      }
    } catch (error) {
      console.error('Erreur chargement joueur:', error)
      router.push('/joueurs')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-green-600" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!joueur) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Joueur non trouvé</p>
          <button
            onClick={() => router.push('/joueurs')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/joueurs')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/joueurs')}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Gérer les joueurs
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header with gradient */}
          <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600"></div>

          {/* Profile info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center">
                <span className="text-5xl font-bold text-green-600">
                  {joueur.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name and basic info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {joueur.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {joueur.gender && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {joueur.gender === 'H' ? 'Homme' : 'Femme'}
                    </span>
                  )}
                  {joueur.created_at && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Membre depuis {new Date(joueur.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {joueur.email && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Email className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Email</h3>
              </div>
              <a
                href={`mailto:${joueur.email}`}
                className="text-green-600 hover:text-green-700 hover:underline"
              >
                {joueur.email}
              </a>
            </div>
          )}

          {joueur.phone && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Téléphone</h3>
              </div>
              <a
                href={`tel:${joueur.phone}`}
                className="text-green-600 hover:text-green-700 hover:underline"
              >
                {joueur.phone}
              </a>
            </div>
          )}
        </div>

        {/* Stats Section (placeholder - à enrichir plus tard) */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Trophy className="w-7 h-7 text-green-600" />
            Statistiques
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="text-4xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600">Tournois joués</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
              <div className="text-4xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Victoires</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="text-4xl font-bold text-gray-900 mb-2">0%</div>
              <div className="text-sm text-gray-600">Taux de victoire</div>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            <Target className="w-5 h-5 inline-block mb-1" />
            <p>Les statistiques seront disponibles après participation à des tournois</p>
          </div>
        </div>
      </main>
    </div>
  )
}
