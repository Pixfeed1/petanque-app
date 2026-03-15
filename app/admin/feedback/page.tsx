// app/admin/feedback/page.tsx
// Boîte de réception feedback + toggle mode beta

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

interface Feedback {
  id: number
  user_id: string | null
  user_email: string
  user_name: string | null
  user_full_name: string | null
  message: string
  category: string
  status: string
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
}

interface FeedbackStats {
  total: number
  new: number
  read: number
  replied: number
}

const categoryLabels: Record<string, string> = {
  general: 'Retour',
  bug: 'Bug',
  feature: 'Suggestion',
  ux: 'Interface / UX'
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-purple-100 text-purple-700',
  ux: 'bg-blue-100 text-blue-700'
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  read: 'Lu',
  replied: 'Repondu',
  archived: 'Archive'
}

const statusColors: Record<string, string> = {
  new: 'bg-orange-100 text-orange-700',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500'
}

export default function AdminFeedback() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Beta mode
  const [betaEnabled, setBetaEnabled] = useState(false)
  const [betaMessage, setBetaMessage] = useState('')
  const [togglingBeta, setTogglingBeta] = useState(false)

  // Feedback
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, new: 0, read: 0, replied: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('new')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [filterEmail, setFilterEmail] = useState<string | null>(null)

  // Charger le statut beta
  useEffect(() => {
    if (!authLoading && user) {
      fetchBetaStatus()
      fetchFeedbacks()
    }
  }, [authLoading, user])

  // Recharger les feedbacks quand le filtre change
  useEffect(() => {
    if (user) fetchFeedbacks()
  }, [filter, filterEmail])

  const fetchBetaStatus = async () => {
    try {
      const res = await fetch('/api/admin/beta-mode', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setBetaEnabled(data.enabled)
        setBetaMessage(data.message || '')
      }
    } catch {}
  }

  const toggleBeta = async () => {
    setTogglingBeta(true)
    try {
      const res = await fetch('/api/admin/beta-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !betaEnabled, message: betaMessage })
      })
      if (res.ok) {
        setBetaEnabled(!betaEnabled)
      }
    } catch {}
    setTogglingBeta(false)
  }

  const saveBetaMessage = async () => {
    try {
      await fetch('/api/admin/beta-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: betaEnabled, message: betaMessage })
      })
    } catch {}
  }

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/feedback?status=${filter}`
      if (filterEmail) url += `&user_email=${encodeURIComponent(filterEmail)}`

      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
        setStats(data.stats || { total: 0, new: 0, read: 0, replied: 0 })
      }
    } catch {}
    setLoading(false)
  }

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return

    setReplying(true)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feedback_id: selectedFeedback.id,
          admin_reply: replyText.trim()
        })
      })

      if (res.ok) {
        setReplyText('')
        setSelectedFeedback(null)
        fetchFeedbacks()
      }
    } catch {}
    setReplying(false)
  }

  const markAsRead = async (feedbackId: number) => {
    try {
      await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback_id: feedbackId, status: 'read' })
      })
      fetchFeedbacks()
    } catch {}
  }

  const viewUserConversation = (email: string) => {
    setFilterEmail(email)
    setFilter('all')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Feedbacks & Mode Beta</h1>
              <p className="text-sm text-gray-500">
                {stats.new > 0 ? `${stats.new} nouveau(x) message(s)` : 'Aucun nouveau message'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Section Mode Beta ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mode Beta</h2>
              <p className="text-sm text-gray-500">
                Quand actif : toutes les fonctionnalites sont gratuites et le widget de feedback apparait
              </p>
            </div>
            <button
              onClick={toggleBeta}
              disabled={togglingBeta}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                betaEnabled ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  betaEnabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {betaEnabled && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Message affiche aux utilisateurs
              </label>
              <textarea
                value={betaMessage}
                onChange={e => setBetaMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                onClick={saveBetaMessage}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition"
              >
                Sauvegarder le message
              </button>
            </div>
          )}
        </div>

        {/* ── Stats feedback ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Nouveaux</p>
            <p className="text-3xl font-bold text-orange-600">{stats.new}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Lus</p>
            <p className="text-3xl font-bold text-blue-600">{stats.read}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Repondus</p>
            <p className="text-3xl font-bold text-green-600">{stats.replied}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['new', 'read', 'replied', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setFilterEmail(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f && !filterEmail
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 'new' ? `Nouveaux (${stats.new})` :
                 f === 'read' ? 'Lus' :
                 f === 'replied' ? 'Repondus' : 'Tous'}
              </button>
            ))}
          </div>

          {filterEmail && (
            <div className="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-2">
              <span className="text-sm text-amber-800">
                Conversation avec <strong>{filterEmail}</strong>
              </span>
              <button
                onClick={() => { setFilterEmail(null); setFilter('new') }}
                className="text-amber-600 hover:text-amber-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Liste des feedbacks ── */}
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400">Aucun feedback a afficher</p>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div
                key={fb.id}
                className={`bg-white rounded-xl border p-5 transition ${
                  fb.status === 'new'
                    ? 'border-orange-200 bg-orange-50/30'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header du feedback */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[fb.status] || statusColors.new}`}>
                        {statusLabels[fb.status] || fb.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[fb.category] || categoryColors.general}`}>
                        {categoryLabels[fb.category] || fb.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => viewUserConversation(fb.user_email)}
                        className="text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline"
                      >
                        {fb.user_full_name || fb.user_name || 'Anonyme'}
                      </button>
                      <span className="text-xs text-gray-400">{fb.user_email}</span>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{fb.message}</p>

                    {/* Réponse admin */}
                    {fb.admin_reply && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-xs text-green-600 font-medium mb-1">Votre reponse</p>
                        <p className="text-sm text-gray-700">{fb.admin_reply}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {fb.admin_replied_at && new Date(fb.admin_replied_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {fb.status === 'new' && (
                      <button
                        onClick={() => markAsRead(fb.id)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        Marquer lu
                      </button>
                    )}
                    {fb.status !== 'replied' && (
                      <button
                        onClick={() => { setSelectedFeedback(fb); setReplyText('') }}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition"
                      >
                        Repondre
                      </button>
                    )}
                    <button
                      onClick={() => viewUserConversation(fb.user_email)}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
                    >
                      Voir echanges
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ── Modal de réponse ── */}
      {selectedFeedback && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedFeedback(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Repondre a {selectedFeedback.user_full_name || selectedFeedback.user_email}
            </h3>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Message original :</p>
              <p className="text-sm text-gray-700">{selectedFeedback.message}</p>
            </div>

            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Votre reponse..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
              >
                {replying ? 'Envoi...' : 'Envoyer la reponse'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
