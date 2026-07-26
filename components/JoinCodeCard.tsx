'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Loader } from '@/components/Icons'

// Carte « Code club » (Paramètres, organisateur) : génère/affiche le code que les
// joueurs saisissent sur /rejoindre pour lier leur fiche à leur compte.
export function JoinCodeCard({ orgId }: { orgId: string }) {
  const { showError, showSuccess } = useToast()
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!orgId) { setLoading(false); return }
    fetch(`/api/organisations/join-code?org_id=${orgId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setCode((d?.data?.code ?? d?.code) || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId])

  const generate = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/organisations/join-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ org_id: orgId }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { showError(d?.error || 'Génération impossible'); return }
      setCode((d?.data?.code ?? d?.code) || null)
      showSuccess('Code club généré')
    } catch { showError('Erreur réseau') } finally { setBusy(false) }
  }

  const copyLink = async () => {
    const link = `${window.location.origin}/rejoindre`
    try { await navigator.clipboard.writeText(link); showSuccess('Lien /rejoindre copié') }
    catch { showError('Copie impossible') }
  }

  return (
    <section className="mb-10 pb-10 border-b border-petanque-sable-bord/50">
      <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-5">Code club</p>
      <p className="text-sm text-petanque-bois mb-5 leading-relaxed">
        Communique ce code à tes joueurs : sur <strong>petanquepro.fr/rejoindre</strong>, ils entrent le code,
        choisissent leur nom et lient leur fiche à leur compte.
      </p>
      {loading ? (
        <Loader className="w-5 h-5 animate-spin text-petanque-vert" />
      ) : code ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl tracking-[0.25em] text-petanque-vert-fonce bg-petanque-sable-pale border border-petanque-sable-bord rounded-lg px-5 py-2.5">{code}</span>
          <button onClick={copyLink} className="text-sm font-medium text-petanque-vert border border-petanque-sable-bord rounded-lg px-4 py-2 hover:bg-petanque-sable-pale">Copier le lien</button>
          <button onClick={generate} disabled={busy} className="text-sm text-petanque-bois hover:text-petanque-vert-fonce underline underline-offset-2 disabled:opacity-50">
            {busy ? 'Régénération…' : 'Régénérer'}
          </button>
        </div>
      ) : (
        <button onClick={generate} disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-petanque-vert text-petanque-sable rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
          {busy && <Loader className="w-4 h-4 animate-spin" />} Générer un code club
        </button>
      )}
    </section>
  )
}
