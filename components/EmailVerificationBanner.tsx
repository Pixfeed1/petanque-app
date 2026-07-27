'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'

// Bandeau non bloquant invitant à activer son compte tant que l'email n'est pas
// vérifié. N'apparaît que pour un utilisateur connecté et non vérifié.
export function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth()
  const { showSuccess, showError } = useToast()
  const [busy, setBusy] = useState(false)
  const [hidden, setHidden] = useState(false)

  if (!isAuthenticated || !user || user.email_verified || hidden) return null

  const resend = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'include' })
      if (res.ok) showSuccess('Email d\'activation renvoyé — vérifie ta boîte mail.')
      else showError('Impossible d\'envoyer l\'email pour le moment.')
    } catch { showError('Erreur réseau') } finally { setBusy(false) }
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[90] bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap text-sm">
        <span className="flex-1 min-w-0">
          ✉️ <strong>Active ton compte</strong> : on a envoyé un lien à <strong>{user.email}</strong>. Clique dessus pour confirmer ton email.
        </span>
        <button onClick={resend} disabled={busy} className="font-medium underline underline-offset-2 hover:text-amber-950 disabled:opacity-50">
          {busy ? 'Envoi…' : 'Renvoyer l\'email'}
        </button>
        <button onClick={() => setHidden(true)} aria-label="Masquer" className="text-amber-700 hover:text-amber-950 px-1">✕</button>
      </div>
    </div>
  )
}
