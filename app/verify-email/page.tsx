'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FadeIn, BouleSvg } from '@/components/ui'
import { Check } from '@/components/Icons'

// Résultat de l'activation de compte (après clic sur le lien de l'email).
export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useSearchParams()
  const status = params?.get('status') || 'invalid'
  const [count, setCount] = useState(4)

  useEffect(() => {
    if (status !== 'success') return
    const t = setInterval(() => setCount(c => c - 1), 1000)
    const go = setTimeout(() => router.push('/dashboard'), 4000)
    return () => { clearInterval(t); clearTimeout(go) }
  }, [status, router])

  const ok = status === 'success'
  return (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center px-4">
      <FadeIn>
        <div className="w-full max-w-md bg-white rounded-2xl border border-petanque-sable-bord/50 shadow-sm p-8 text-center">
          <div className="flex justify-center mb-5"><BouleSvg className="w-12 h-12" /></div>
          {ok ? (
            <>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-petanque-vert-pale flex items-center justify-center text-petanque-vert-fonce"><Check className="w-6 h-6" /></div>
              <h1 className="text-xl font-medium text-petanque-vert-fonce mb-1">Compte activé 🎉</h1>
              <p className="text-sm text-petanque-bois mb-5">Ton email est confirmé. On t&apos;emmène à ton tableau de bord… ({count})</p>
              <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce transition-colors">Continuer</button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-medium text-petanque-vert-fonce mb-2">Lien invalide ou expiré</h1>
              <p className="text-sm text-petanque-bois mb-5">Ce lien d&apos;activation n&apos;est plus valable. Connecte-toi et demande un nouvel email depuis le bandeau d&apos;activation.</p>
              <button onClick={() => router.push('/login')} className="px-5 py-2.5 rounded-lg bg-petanque-vert text-petanque-sable font-medium hover:bg-petanque-vert-fonce transition-colors">Se connecter</button>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
