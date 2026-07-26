'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { isPushSupported, pushPermission, enablePush, disablePush, type PushStatus } from '@/lib/push/client'

// Carte « Notifications » pour la page Paramètres : active/désactive le push et
// permet un envoi de test. Tolérant : si l'appareil ne supporte pas le push, on
// l'indique clairement plutôt que d'afficher un bouton inopérant.
export function NotificationsCard() {
  const { showSuccess, showError } = useToast()
  const [status, setStatus] = useState<PushStatus>('default')
  const [busy, setBusy] = useState(false)

  useEffect(() => { setStatus(pushPermission()) }, [])

  const supported = isPushSupported()

  const enable = async () => {
    setBusy(true)
    try {
      const s = await enablePush()
      setStatus(s)
      if (s === 'granted') showSuccess('Notifications activées')
      else if (s === 'denied') showError('Notifications refusées. Autorise-les dans les réglages du navigateur.')
      else if (s === 'unsupported') showError('Notifications non disponibles sur cet appareil.')
    } finally { setBusy(false) }
  }

  const disable = async () => {
    setBusy(true)
    try { await disablePush(); setStatus('default'); showSuccess('Notifications désactivées') }
    finally { setBusy(false) }
  }

  const sendTest = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data?.data?.sent ?? data?.sent) > 0) showSuccess('Notification de test envoyée')
      else if (res.status === 503) showError('Serveur non configuré pour les notifications (clés VAPID).')
      else showError('Aucun appareil abonné. Active d\'abord les notifications.')
    } catch { showError('Échec de l\'envoi du test') }
    finally { setBusy(false) }
  }

  return (
    <section className="mb-10 pb-10 border-b border-petanque-sable-bord/50">
      <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-5">Notifications</p>
      {!supported ? (
        <p className="text-sm text-petanque-bois leading-relaxed">
          Les notifications ne sont pas disponibles sur cet appareil ou ce navigateur.
          Installe l&apos;application (écran d&apos;accueil) pour les activer.
        </p>
      ) : (
        <>
          <p className="text-sm text-petanque-bois mb-5 leading-relaxed">
            Reçois une alerte quand un match t&apos;attend ou qu&apos;un tournoi se termine.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {status === 'granted' ? (
              <>
                <Button variant="secondary" onClick={disable} disabled={busy}>Désactiver</Button>
                <Button variant="primary" onClick={sendTest} disabled={busy}>Envoyer un test</Button>
              </>
            ) : (
              <Button variant="primary" onClick={enable} disabled={busy}>
                {busy ? 'Activation…' : 'Activer les notifications'}
              </Button>
            )}
            {status === 'denied' && (
              <span className="text-xs text-petanque-cochonnet-fonce">
                Bloquées — à réautoriser dans les réglages du navigateur.
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}
