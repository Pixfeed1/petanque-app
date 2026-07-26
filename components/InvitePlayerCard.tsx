'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Loader, Check, Link as LinkIcon } from '@/components/Icons'

// Carte d'invitation (côté organisateur) sur la fiche joueur : génère un lien
// (+ QR) pour que le joueur lie sa fiche à un compte. Si déjà lié, l'indique.
export function InvitePlayerCard({ joueurId, alreadyLinked }: { joueurId: string; alreadyLinked: boolean }) {
  const { showError, showSuccess } = useToast()
  const [url, setUrl] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (alreadyLinked) {
    return (
      <section className="mb-2">
        <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-3">Compte joueur</p>
        <div className="flex items-center gap-2 px-4 py-3 bg-petanque-vert-pale/60 border border-petanque-vert/20 rounded-lg text-sm text-petanque-vert-fonce">
          <Check className="w-4 h-4" /> Ce joueur a lié sa fiche à un compte.
        </div>
      </section>
    )
  }

  const generate = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/joueurs/${joueurId}/invite`, { method: 'POST', credentials: 'include' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { showError(d?.error || 'Impossible de générer l\'invitation'); return }
      const link = d?.data?.url ?? d?.url
      setUrl(link)
      try {
        const QRCode = (await import('qrcode')).default
        setQr(await QRCode.toDataURL(link, { margin: 1, width: 220, color: { dark: '#1a3322', light: '#ffffff' } }))
      } catch { /* QR optionnel */ }
    } catch { showError('Erreur réseau') } finally { setBusy(false) }
  }

  const copy = async () => {
    if (!url) return
    try { await navigator.clipboard.writeText(url); showSuccess('Lien copié') }
    catch { showError('Copie impossible') }
  }

  return (
    <section className="mb-2">
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-3">Compte joueur</p>
      {!url ? (
        <div className="px-4 py-4 bg-white border border-petanque-sable-bord/50 rounded-lg">
          <p className="text-sm text-petanque-bois mb-4 leading-relaxed">
            Invite ce joueur à lier sa fiche à un compte : il pourra voir ses tournois et recevoir
            une notification quand c&apos;est son tour.
          </p>
          <button onClick={generate} disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-petanque-vert text-petanque-sable rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 transition-colors">
            {busy ? <Loader className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            Générer un lien d&apos;invitation
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 bg-white border border-petanque-sable-bord/50 rounded-lg">
          {qr && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code d'invitation" className="w-40 h-40 rounded-lg border border-petanque-sable-bord/40" />
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <input readOnly value={url} className="flex-1 min-w-0 px-3 py-2 text-xs bg-petanque-sable-pale border border-petanque-sable-bord rounded-lg text-petanque-vert-fonce" />
            <button onClick={copy} className="px-3 py-2 text-sm font-medium text-petanque-vert border border-petanque-sable-bord rounded-lg hover:bg-petanque-sable-pale">Copier</button>
          </div>
          <p className="text-xs text-petanque-bois leading-relaxed">
            Partage ce lien (ou fais scanner le QR) au joueur. Valable 30 jours.
          </p>
        </div>
      )}
    </section>
  )
}
