import Link from 'next/link'
import { BouleSvg } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <BouleSvg size={48} variant="cochonnet" stries />
        </div>
        <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
          Erreur · 404
        </p>
        <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
          Page <span className="accent-italic text-petanque-vert">introuvable.</span>
        </h1>
        <p className="text-base text-petanque-bois leading-relaxed mb-8">
          Cette page n'existe pas ou plus. Le tournoi a peut-être été déplacé, ou tu as suivi un lien obsolète.
        </p>

        <div className="flex flex-col items-stretch gap-3">
          <Link href="/" className="w-full bg-petanque-vert text-petanque-sable px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce transition-colors text-center">
            Retour à l'accueil
          </Link>
          <Link href="/dashboard" className="w-full text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord bg-white px-4 py-2.5 rounded-lg text-sm font-medium text-center">
            Voir mes tournois
          </Link>
        </div>

        <p className="mt-10 pt-6 border-t border-petanque-sable-bord/40 text-xs text-petanque-bois font-mono uppercase tracking-[0.12em]">
          Le cochonnet est ailleurs
        </p>
      </div>
    </div>
  )
}
