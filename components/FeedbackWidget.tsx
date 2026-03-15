// components/FeedbackWidget.tsx
// Bandeau latéral de feedback visible en mode beta

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'

interface FeedbackEntry {
  id: number
  message: string
  category: string
  status: string
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
}

export function FeedbackWidget() {
  const { user, isAuthenticated } = useAuth()
  const [betaEnabled, setBetaEnabled] = useState(false)
  const [betaMessage, setBetaMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetch('/api/beta-status')
      .then(r => r.json())
      .then(data => {
        setBetaEnabled(data.enabled)
        setBetaMessage(data.message || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isOpen && isAuthenticated && showHistory) {
      fetch('/api/feedback', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setMyFeedbacks(data.feedbacks || []))
        .catch(() => {})
    }
  }, [isOpen, isAuthenticated, showHistory])

  if (!betaEnabled || !isAuthenticated) return null

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) return

    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: message.trim(), category })
      })

      if (res.ok) {
        setSent(true)
        setMessage('')
        setTimeout(() => setSent(false), 3000)
      }
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const categories = [
    { value: 'general', label: 'Avis general' },
    { value: 'bug', label: 'Ca ne marche pas' },
    { value: 'feature', label: 'Il manque quelque chose' },
    { value: 'ux', label: 'Pas pratique a utiliser' },
  ]

  const statusBadge = (status: string) => {
    if (status === 'replied') return 'bg-green-100 text-green-700'
    if (status === 'read') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  const statusLabel = (status: string) => {
    if (status === 'replied') return 'On vous a repondu'
    if (status === 'read') return "Lu par l'equipe"
    return 'Envoye'
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-b from-green-600 to-emerald-600 text-white px-2 py-4 rounded-l-lg shadow-lg hover:px-3 transition-all"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="text-sm font-bold tracking-wide">Donnez-nous votre avis</span>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Panneau latéral */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Donnez-nous votre avis</h3>
                <p className="text-sm text-green-100">Aidez-nous a rendre l&apos;appli encore meilleure</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 transition hover:bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message beta */}
          <div className="border-b border-green-100 bg-green-50 p-4">
            <p className="text-sm text-green-800">{betaMessage}</p>
            <p className="mt-2 text-xs text-green-600">
              Ou ecrivez-nous directement : <a href="mailto:support@petanquepro.fr" className="font-medium underline">support@petanquepro.fr</a>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 py-3 text-sm font-medium transition ${!showHistory ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Nouveau message
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 py-3 text-sm font-medium transition ${showHistory ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mes messages
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-4">
            {!showHistory ? (
              <div className="space-y-4">
                {/* Catégorie */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">C&apos;est a quel sujet ?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          category === cat.value
                            ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Votre message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Dites-nous ce qui vous plait, ce qui manque, ce qui ne marche pas bien..."
                    rows={5}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{message.length}/2000</p>
                </div>

                <p className="text-xs text-gray-400">
                  Message envoye par {user?.full_name || user?.email}
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={sending || message.trim().length < 5}
                  className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-medium text-white transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Envoi...' : sent ? 'Merci, message bien recu !' : 'Envoyer mon message'}
                </button>

                {sent && (
                  <p className="text-center text-sm font-medium text-green-600">
                    Merci ! On lit chaque message et on vous repond si besoin.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myFeedbacks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">Vous n&apos;avez pas encore envoye de message</p>
                ) : (
                  myFeedbacks.map(fb => (
                    <div key={fb.id} className="space-y-2 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(fb.status)}`}>
                          {statusLabel(fb.status)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(fb.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{fb.message}</p>
                      {fb.admin_reply && (
                        <div className="rounded-lg border-l-4 border-green-500 bg-white p-3">
                          <p className="mb-1 text-xs font-medium text-green-600">Reponse de l&apos;equipe Petanque Pro</p>
                          <p className="text-sm text-gray-700">{fb.admin_reply}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {fb.admin_replied_at && new Date(fb.admin_replied_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
