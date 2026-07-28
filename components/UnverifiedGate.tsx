'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'
import { FadeIn, BouleSvg } from '@/components/ui'

// Routes accessibles sans compte activé (auth, activation, pages publiques).
const EXEMPT_EXACT = ['/', '/login', '/signup', '/verify-email', '/modes', '/features', '/guide', '/faq', '/contact', '/rejoindre']
function isExempt(pathname: string): boolean {
  return EXEMPT_EXACT.includes(pathname)
    || pathname.startsWith('/legal/')
    || pathname.startsWith('/rejoindre/')
    || pathname.startsWith('/verify-email')
}

/**
 * Bloque l'accès à l'app tant que l'email n'est pas vérifié : un utilisateur
 * connecté mais non activé ne voit qu'un écran d'activation (rien à consulter ni
 * créer). Les comptes OAuth (Google) sont vérifiés d'office, donc jamais bloqués.
 * Les anciens comptes sont « grandfathered » vérifiés (migration 011).
 */
export function UnverifiedGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname() || '/'
  const { showSuccess, showError } = useToast()
  const [busy, setBusy] = useState(false)

  const blocked = isAuthenticated && user && !user.email_verified && !isExempt(pathname)
  if (!blocked) return <>{children}</>

  const resend = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'include' })
      if (res.ok) showSuccess('Email d\'activation renvoyé — pense à vérifier tes spams.')
      else showError('Impossible d\'envoyer l\'email pour le moment.')
    } catch { showError('Erreur réseau') } finally { setBusy(false) }
  }
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch {}
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center px-4">
      <FadeIn>
        <div className="w-full max-w-md bg-white rounded-2xl border border-petanque-sable-bord/50 shadow-sm p-8 text-center">
          <div className="flex justify-center mb-5"><BouleSvg className="w-12 h-12" /></div>
          <h1 className="text-xl font-medium text-petanque-vert-fonce mb-2">Active ton compte ✉️</h1>
          <p className="text-sm text-petanque-bois mb-1 leading-relaxed">
            On a envoyé un lien d&apos;activation à <strong className="text-petanque-vert-fonce">{user!.email}</strong>.
          </p>
          <p className="text-sm text-petanque-bois mb-6 leading-relaxed">
            Clique dessus pour débloquer ton accès. (Pense à regarder tes <strong>spams</strong>.)
          </p>
          <button onClick={resend} disabled={busy}
            className="w-full py-3 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors mb-3">
            {busy ? 'Envoi…' : 'Renvoyer l\'email d\'activation'}
          </button>
          <button onClick={logout} className="text-sm text-petanque-bois hover:text-petanque-vert-fonce underline underline-offset-2">
            Se déconnecter
          </button>
        </div>
      </FadeIn>
    </div>
  )
}
