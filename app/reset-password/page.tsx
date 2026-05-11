'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FadeIn, BouleSvg } from '@/components/ui'
import { Loader } from '@/components/Icons'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? null

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token manquant')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la réinitialisation')
      setSuccess(true)
      setTimeout(() => { router.push('/login') }, 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // STATE : SUCCESS
  if (success) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
        <FadeIn>
          <div className="max-w-md w-full">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-petanque-vert-pale/30 text-petanque-vert-fonce flex items-center justify-center text-2xl font-bold">✓</div>
            </div>
            <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 text-center">
              Réinitialisation · réussie
            </p>
            <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3 text-center">
              Mot de passe <span className="accent-italic text-petanque-vert">réinitialisé.</span>
            </h1>
            <p className="text-base text-petanque-bois leading-relaxed mb-4 text-center">
              Tu vas être redirigé vers la page de connexion dans quelques secondes.
            </p>
            <p className="text-sm text-petanque-bois italic text-center mb-6">Redirection automatique…</p>
            <div className="flex justify-center">
              <Link href="/login" className="text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord bg-white px-5 py-2.5 rounded-lg">
                Se connecter maintenant
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  // STATE : TOKEN MANQUANT
  if (!token) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
        <FadeIn>
          <div className="max-w-md w-full">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-petanque-cochonnet-pale/40 text-petanque-cochonnet-fonce flex items-center justify-center text-2xl font-bold">!</div>
            </div>
            <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 text-center">
              Réinitialisation · impossible
            </p>
            <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3 text-center">
              Lien <span className="accent-italic text-petanque-vert">invalide.</span>
            </h1>
            <p className="text-base text-petanque-bois leading-relaxed mb-6 text-center">
              Le lien de réinitialisation est manquant ou a expiré.
            </p>
            <div className="px-4 py-3 bg-petanque-sable/60 border-l-2 border-petanque-cochonnet rounded-r-lg text-sm text-petanque-vert-fonce/85 italic leading-relaxed mb-7">
              Les liens de réinitialisation sont valables 1 heure et utilisables une seule fois. Demande un nouveau lien depuis la page de connexion pour recommencer.
            </div>
            <div className="flex flex-col items-stretch gap-3">
              <Link href="/login" className="w-full text-center bg-petanque-vert text-petanque-sable px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                Demander un nouveau lien
              </Link>
              <Link href="/login" className="text-center text-sm text-petanque-bois hover:text-petanque-vert-fonce">
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  // STATE : FORMULAIRE
  return (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
      <FadeIn>
        <div className="max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <BouleSvg size={48} variant="acier" stries />
          </div>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 text-center">
            Réinitialisation · sécurisée
          </p>
          <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3 text-center">
            Nouveau <span className="accent-italic text-petanque-vert">mot de passe.</span>
          </h1>
          <p className="text-base text-petanque-bois leading-relaxed mb-8 text-center">
            Choisis un nouveau mot de passe sécurisé pour ton compte Pétanque Pro.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-petanque-cochonnet-pale/30 border-l-2 border-petanque-cochonnet rounded-r-lg text-sm text-petanque-cochonnet-fonce leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                disabled={loading}
                autoFocus
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retape ton mot de passe"
                required
                disabled={loading}
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce disabled:opacity-60"
              />
              <span className="text-xs text-petanque-bois mt-0.5">Au moins 8 caractères.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-petanque-vert text-petanque-sable px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-petanque-bois hover:text-petanque-vert-fonce">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
