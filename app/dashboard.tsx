'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

export default function DashboardPage() {
  const { user, organization, signOut } = useAuth()
  const [tournois, setTournois] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user && organization) {
      loadTournois()
    } else if (!user) {
      router.push('/login')
    }
  }, [user, organization])

  const loadTournois = async () => {
    if (!organization) return

    try {
      const response = await fetch(`/api/tournois?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTournois(data)
      }
    } catch (error) {
      console.error('Erreur chargement tournois:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 Tournois Pétanque</h1>
          <button
            onClick={handleLogout}
            className="bg-green-700 px-4 py-2 rounded hover:bg-green-800"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Boutons d'action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/tournoi/nouveau')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold text-green-800">Nouveau Tournoi</div>
            <div className="text-sm text-gray-600">Choisi, Mêlée fixe ou tournante</div>
          </button>

          <button
            onClick={() => router.push('/joueurs')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-bold text-green-800">Gérer les Joueurs</div>
            <div className="text-sm text-gray-600">Ajouter, modifier (H/F)</div>
          </button>

          <button
            onClick={() => router.push('/quiz')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-bold text-green-800">Quiz Pétanque</div>
            <div className="text-sm text-gray-600">250 questions</div>
          </button>
        </div>

        {/* Liste des tournois */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Tournois récents</h2>
          </div>
          <div className="p-4">
            {tournois.length === 0 ? (
              <p className="text-gray-500">Aucun tournoi créé</p>
            ) : (
              <div className="space-y-2">
                {tournois.map((tournoi) => (
                  <div
                    key={tournoi.id}
                    className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-bold">{tournoi.name}</div>
                        <div className="text-sm text-gray-600">
                          {tournoi.mode} - {tournoi.format} - {tournoi.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(tournoi.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}