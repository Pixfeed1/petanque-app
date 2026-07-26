'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { FadeIn, BouleSvg } from '@/components/ui'
import { Loader } from '@/components/Icons'

// Adhésion par CODE CLUB : le joueur entre le code, choisit son nom dans la liste,
// puis (au besoin) crée un compte ou se connecte, et sa fiche est liée.
export default function RejoindreCodePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [code, setCode] = useState('')
  const [club, setClub] = useState<{ clubName: string; players: { id: string; name: string }[] } | null>(null)
  const [joueurId, setJoueurId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const lookup = async () => {
    setBusy(true); setError(''); setClub(null)
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(code.trim())}`)
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || 'Code invalide'); return }
      const data = (d?.data ?? d) as { clubName: string; players: { id: string; name: string }[] }
      setClub(data)
      if (data.players.length === 0) setError('Aucune fiche disponible dans ce club (toutes déjà liées).')
    } catch { setError('Erreur réseau') } finally { setBusy(false) }
  }

  const claim = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(code.trim())}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ joueurId }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { router.push('/moi'); return }
      setError(d?.error || 'Liaison impossible')
    } catch { setError('Erreur réseau') } finally { setBusy(false) }
  }

  const authThenClaim = async () => {
    setBusy(true); setError('')
    try {
      const path = mode === 'signup' ? '/api/auth/signup-player' : '/api/auth/login'
      const body = mode === 'signup' ? { fullName, email, password } : { email, password }
      const res = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d?.error || 'Authentification impossible'); setBusy(false); return }
      await claim()
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

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2.5 border border-petanque-sable-bord rounded-lg focus:ring-2 focus:ring-petanque-vert/40 focus:border-transparent outline-none text-sm" />
  )
  const errBox = error && <p className="mb-4 text-sm text-petanque-cochonnet-fonce bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>

  // Étape 1 : saisie du code.
  if (!club) {
    return <Card>
      <div className="text-center mb-6">
        <h1 className="text-xl font-medium text-petanque-vert-fonce mb-1">Rejoindre mon club</h1>
        <p className="text-sm text-petanque-bois">Entre le code que ton organisateur t&apos;a communiqué.</p>
      </div>
      {errBox}
      <div className="space-y-3">
        {input({ type: 'text', placeholder: 'CODE CLUB', value: code, onChange: e => setCode(e.target.value.toUpperCase()), maxLength: 8, style: { letterSpacing: '0.2em', textAlign: 'center', fontWeight: 600 } })}
        <button onClick={lookup} disabled={busy || code.trim().length < 6}
          className="w-full py-3 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
          {busy ? 'Recherche…' : 'Continuer'}
        </button>
      </div>
    </Card>
  }

  // Étape 2 : choix de la fiche + (au besoin) authentification.
  return <Card>
    <div className="text-center mb-6">
      <h1 className="text-xl font-medium text-petanque-vert-fonce mb-1">{club.clubName}</h1>
      <p className="text-sm text-petanque-bois">Choisis ta fiche pour la lier à ton compte.</p>
    </div>
    {errBox}
    <div className="space-y-3">
      <select value={joueurId} onChange={e => setJoueurId(e.target.value)}
        className="w-full px-3 py-2.5 border border-petanque-sable-bord rounded-lg text-sm bg-white">
        <option value="">— Sélectionne ton nom —</option>
        {club.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {joueurId && !user && (
        <>
          <div className="pt-2 border-t border-petanque-sable-bord/50" />
          {mode === 'signup' && input({ type: 'text', placeholder: 'Ton nom', value: fullName, onChange: e => setFullName(e.target.value) })}
          {input({ type: 'email', placeholder: 'Email', value: email, onChange: e => setEmail(e.target.value) })}
          {input({ type: 'password', placeholder: 'Mot de passe (min. 8)', value: password, onChange: e => setPassword(e.target.value) })}
        </>
      )}

      <button
        onClick={user ? claim : authThenClaim}
        disabled={busy || !joueurId || (!user && (!email || !password || (mode === 'signup' && !fullName)))}
        className="w-full py-3 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
        {busy ? 'Un instant…' : user ? 'Lier ma fiche' : mode === 'signup' ? 'Créer mon compte et rejoindre' : 'Me connecter et rejoindre'}
      </button>

      {!user && joueurId && (
        <p className="text-center text-sm text-petanque-bois">
          {mode === 'signup' ? (
            <>Déjà un compte ? <button onClick={() => { setMode('login'); setError('') }} className="text-petanque-vert font-medium hover:underline">Se connecter</button></>
          ) : (
            <>Pas de compte ? <button onClick={() => { setMode('signup'); setError('') }} className="text-petanque-vert font-medium hover:underline">En créer un</button></>
          )}
        </p>
      )}
    </div>
  </Card>
}
