// components/FeedbackWidget.tsx
// Bandeau latéral de feedback visible en mode beta — V4

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
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (isOpen && isAuthenticated && showHistory) {
      fetch('/api/feedback', { credentials: 'include' })
        .then(r => r.json())
        .then(data => setMyFeedbacks(data.feedbacks || []))
        .catch(() => {})
    }
  }, [isOpen, isAuthenticated, showHistory])

  if (!isAuthenticated) return null

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
    { value: 'general', label: 'Avis général' },
    { value: 'bug', label: 'Ça ne marche pas' },
    { value: 'feature', label: 'Il manque quelque chose' },
    { value: 'ux', label: 'Pas pratique à utiliser' },
  ]

  const statusBadge = (status: string) => {
    if (status === 'replied') return 'bg-petanque-vert-pale text-petanque-vert-fonce'
    if (status === 'read') return 'bg-petanque-sable-pale text-petanque-bois'
    return 'bg-petanque-sable-pale text-petanque-bois'
  }

  const statusLabel = (status: string) => {
    if (status === 'replied') return 'On vous a répondu'
    if (status === 'read') return "Lu par l'équipe"
    return 'Envoyé'
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-petanque-vert text-white px-3 py-6 rounded-l-lg hover:bg-petanque-vert-fonce hover:px-4 transition-all"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="text-sm font-medium tracking-wide">Donnez votre avis</span>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-petanque-bois/20 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Panneau latéral */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-petanque-sable-pale border-l border-petanque-sable-bord z-50 flex flex-col">
          {/* Header */}
          <div className="bg-petanque-vert px-5 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">Donnez votre avis</h3>
                <p className="text-sm text-white/80 mt-0.5">Aidez-nous à améliorer l&apos;appli</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-md p-1.5 transition-colors hover:bg-white/15 -mr-1 -mt-1">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contact direct */}
          <div className="border-b border-petanque-sable-bord bg-petanque-vert-pale px-5 py-4">
            <p className="text-xs text-petanque-bois">
              Une question ? Écrivez-nous : <a href="mailto:support@petanquepro.fr" className="font-medium text-petanque-vert underline">support@petanquepro.fr</a>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-petanque-sable-bord bg-white">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${!showHistory ? 'border-b-2 border-petanque-vert text-petanque-vert-fonce' : 'text-petanque-bois hover:text-petanque-vert-fonce'}`}
            >
              Nouveau message
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${showHistory ? 'border-b-2 border-petanque-vert text-petanque-vert-fonce' : 'text-petanque-bois hover:text-petanque-vert-fonce'}`}
            >
              Mes messages
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-5">
            {!showHistory ? (
              <div className="space-y-5">
                {/* Catégorie */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-petanque-vert-fonce">C&apos;est à quel sujet ?</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border ${
                          category === cat.value
                            ? 'bg-petanque-vert-pale text-petanque-vert-fonce border-petanque-vert'
                            : 'bg-white text-petanque-bois border-petanque-sable-bord hover:border-petanque-vert/40'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-petanque-vert-fonce">Votre message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Dites-nous ce qui vous plaît, ce qui manque, ce qui ne marche pas bien…"
                    rows={6}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-petanque-sable-bord bg-white px-4 py-3 text-sm text-petanque-vert-fonce placeholder:text-petanque-bois/60 focus:border-petanque-vert focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-right text-xs text-petanque-bois">{message.length}/2000</p>
                </div>

                <p className="text-xs text-petanque-bois">
                  Message envoyé par {user?.full_name || user?.email}
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={sending || message.trim().length < 5}
                  className="w-full rounded-lg bg-petanque-vert py-3 text-sm font-semibold text-white transition-colors hover:bg-petanque-vert-fonce disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Envoi…' : sent ? 'Merci, message bien reçu !' : 'Envoyer mon message'}
                </button>

                {sent && (
                  <p className="text-center text-sm font-medium text-petanque-vert">
                    Merci ! On lit chaque message et on vous répond si besoin.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myFeedbacks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-petanque-bois">Vous n&apos;avez pas encore envoyé de message</p>
                ) : (
                  myFeedbacks.map(fb => (
                    <div key={fb.id} className="space-y-2 rounded-lg bg-white border border-petanque-sable-bord p-4">
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(fb.status)}`}>
                          {statusLabel(fb.status)}
                        </span>
                        <span className="text-xs text-petanque-bois">
                          {new Date(fb.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-petanque-vert-fonce">{fb.message}</p>
                      {fb.admin_reply && (
                        <div className="rounded-lg border-l-2 border-petanque-vert bg-petanque-vert-pale p-3">
                          <p className="mb-1 text-xs font-medium text-petanque-vert">Réponse de l&apos;équipe Pétanque Pro</p>
                          <p className="text-sm text-petanque-vert-fonce">{fb.admin_reply}</p>
                          <p className="mt-1 text-xs text-petanque-bois">
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
