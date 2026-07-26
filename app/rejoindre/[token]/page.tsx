'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { FadeIn, BouleSvg } from '@/components/ui'
import { Loader, Check } from '@/components/Icons'

interface Preview { valid: boolean; playerName: string; clubName: string; alreadyLinked: boolean }

// Page « Rejoindre » : un joueur suit un lien d'invitation pour lier sa fiche à un compte.
// - déjà connecté → bouton d'acceptation
// - non connecté → mini-inscription (sans club) ou bascule vers connexion
export default function RejoindrePage() {
  const params = useParams()
  const router = useRouter()
  const token = String(params?.token || '')
  const { user, loading: authLoading } = useAuth()

  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')

  // Champs mini-formulaire
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(r => r.json())
      .then(d => setPreview((d?.data ?? d) as Preview))
      .catch(() => setError('Invitation introuvable'))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'POST', credentials: 'include' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { setDone(true); setTimeout(() => router.push('/moi'), 1400) }
      else setError(d?.error || 'Impossible d\'accepter l\'invitation')
    } catch { setError('Erreur réseau') } finally { setBusy(false) }
  }

  const signupThenAccept = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/auth/signup-player', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ fullName, email, password }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || 'Inscription impossible'); setBusy(false); return }
      await accept()
    } catch { setError('Erreur réseau'); setBusy(false) }
  }

  const loginThenAccept = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || 'Connexion impossible'); setBusy(false); return }
      await accept()
    } catch { setError('Erreur réseau'); setBusy(false) }
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center px-4">
      <FadeIn>
        <div className="w-full max-w-md bg-white rounded-2xl border border-petanque-sable-bord/50 shadow-sm p-8">
          <div className="flex justify-center mb-6"><BouleSvg className="w-12 h-12" /></div>
          {children}
        </div>
      </FadeIn>
    </div>
  )

  if (loading || authLoading) {
    return <Card><div className="flex justify-center"><Loader className="w-6 h-6 animate-spin text-petanque-vert" /></div></Card>
  }

  if (done) {
    return <Card>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-petanque-vert-pale flex items-center justify-center text-petanque-vert-fonce"><Check className="w-6 h-6" /></div>
        <h1 className="text-xl font-medium text-petanque-vert-fonce mb-1">Fiche liée 🎉</h1>
        <p className="text-sm text-petanque-bois">On t&apos;emmène vers ton espace…</p>
      </div>
    </Card>
  }

  if (!preview || !preview.valid) {
    return <Card>
      <div className="text-center">
        <h1 className="text-xl font-medium text-petanque-vert-fonce mb-2">Invitation indisponible</h1>
        <p className="text-sm text-petanque-bois">
          {preview?.alreadyLinked ? 'Cette fiche est déjà liée à un compte.' : 'Ce lien est invalide ou a expiré. Demande un nouveau lien à ton organisateur.'}
        </p>
      </div>
    </Card>
  }

  const title = (
    <div className="text-center mb-6">
      <h1 className="text-xl font-medium text-petanque-vert-fonce mb-1">Rejoindre {preview.clubName}</h1>
      <p className="text-sm text-petanque-bois">Lie la fiche <strong>{preview.playerName}</strong> à ton compte.</p>
    </div>
  )

  const errBox = error && <p className="mb-4 text-sm text-petanque-cochonnet-fonce bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>

  // Déjà connecté : simple acceptation.
  if (user) {
    return <Card>
      {title}{errBox}
      <button onClick={accept} disabled={busy}
        className="w-full py-3 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
        {busy ? 'Liaison…' : `Rejoindre en tant que ${user.full_name || user.email}`}
      </button>
    </Card>
  }

  // Non connecté : mini inscription (sans club) ou connexion.
  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2.5 border border-petanque-sable-bord rounded-lg focus:ring-2 focus:ring-petanque-vert/40 focus:border-transparent outline-none text-sm" />
  )

  return <Card>
    {title}{errBox}
    <div className="space-y-3">
      {mode === 'signup' && input({ type: 'text', placeholder: 'Ton nom', value: fullName, onChange: e => setFullName(e.target.value) })}
      {input({ type: 'email', placeholder: 'Email', value: email, onChange: e => setEmail(e.target.value) })}
      {input({ type: 'password', placeholder: 'Mot de passe (min. 8)', value: password, onChange: e => setPassword(e.target.value) })}
      <button
        onClick={mode === 'signup' ? signupThenAccept : loginThenAccept}
        disabled={busy || !email || !password || (mode === 'signup' && !fullName)}
        className="w-full py-3 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
        {busy ? 'Un instant…' : mode === 'signup' ? 'Créer mon compte et rejoindre' : 'Me connecter et rejoindre'}
      </button>
    </div>
    <p className="mt-5 text-center text-sm text-petanque-bois">
      {mode === 'signup' ? (
        <>Déjà un compte ? <button onClick={() => { setMode('login'); setError('') }} className="text-petanque-vert font-medium hover:underline">Se connecter</button></>
      ) : (
        <>Pas de compte ? <button onClick={() => { setMode('signup'); setError('') }} className="text-petanque-vert font-medium hover:underline">En créer un</button></>
      )}
    </p>
  </Card>
}
