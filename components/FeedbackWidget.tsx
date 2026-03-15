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

  // Vérifier si le mode beta est actif
  useEffect(() => {
    fetch('/api/beta-status')
      .then(r => r.json())
      .then(data => {
        setBetaEnabled(data.enabled)
        setBetaMessage(data.message || '')
      })
      .catch(() => {})
  }, [])

  // Charger l'historique quand on ouvre le panneau
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

  return (
    <>
      {/* Bouton flottant sur le bord droit */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-b from-amber-500 to-orange-500 text-white px-2 py-4 rounded-l-lg shadow-lg hover:px-3 transition-all"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="text-sm font-bold tracking-wide">Votre avis compte !</span>
        </button>
      )}

      {/* Panneau latéral */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Donnez-nous votre avis</h3>
                <p className="text-sm text-amber-100">Aidez-nous a rendre l'appli encore meilleure</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message beta */}
          <div className="p-4 bg-amber-50 border-b border-amber-100">
            <p className="text-sm text-amber-800">{betaMessage}</p>
            <p className="text-xs text-amber-600 mt-2">
              Ou ecrivez-nous directement : <a href="mailto:support@petanquepro.fr" className="underline font-medium">support@petanquepro.fr</a>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                !showHistory
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nouveau message
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                showHistory
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mes messages
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-4">
            {!showHistory ? (
              /* Formulaire */
              <div className="space-y-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">C'est a quel sujet ?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          category === cat.value
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500'
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Dites-nous ce qui vous plait, ce qui manque, ce qui ne marche pas bien..."
                    rows={5}
                    maxLength={2000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/2000</p>
                </div>

                {/* Info user */}
                <p className="text-xs text-gray-400">
                  Message envoye par {user?.full_name || user?.email}
                </p>

                {/* Bouton envoyer */}
                <button
                  onClick={handleSubmit}
                  disabled={sending || message.trim().length < 5}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? 'Envoi...' : sent ? 'Merci, message bien recu !' : 'Envoyer mon message'}
                </button>

                {sent && (
                  <p className="text-center text-sm text-green-600 font-medium">
                    Merci ! On lit chaque message et on vous repond si besoin.
                  </p>
                )}
              </div>
            ) : (
              /* Historique */
              <div className="space-y-3">
                {myFeedbacks.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Vous n'avez pas encore envoye de message</p>
                ) : (
                  myFeedbacks.map(fb => (
                    <div key={fb.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          fb.status === 'replied' ? 'bg-green-100 text-green-700' :
                          fb.status === 'read' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {fb.status === 'replied' ? 'On vous a repondu' :
                           fb.status === 'read' ? 'Lu par l\'equipe' : 'Envoye'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(fb.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{fb.message}</p>
                      {fb.admin_reply && (
                        <div className="bg-white rounded-lg p-3 border-l-4 border-amber-500">
                          <p className="text-xs text-amber-600 font-medium mb-1">Reponse de l'equipe Petanque Pro</p>
                          <p className="text-sm text-gray-700">{fb.admin_reply}</p>
                          <p className="text-xs text-gray-400 mt-1">
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

      {/* Overlay quand le panneau est ouvert */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
