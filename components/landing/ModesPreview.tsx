import Link from 'next/link'
import { FadeIn, BouleSvg } from '@/components/ui'

const modes = [
  {
    title: 'Choisi',
    tagline: 'Garde tes partenaires',
    desc: 'Les joueurs forment leurs propres équipes. Stratégie de groupe, pour les amis et les clubs.',
    boule: 'acier' as const,
  },
  {
    title: 'Mêlée fixe',
    tagline: 'Tirage initial, équipes fixes',
    desc: 'Tirage aléatoire au début, mêmes équipes tout le tournoi. Découverte, ambiance conviviale.',
    boule: 'cochonnet' as const,
    featured: true,
  },
  {
    title: 'Mêlée tournante',
    tagline: 'Nouveaux partenaires à chaque tour',
    desc: 'Rotation des équipes, classement individuel. Maximum de rencontres, esprit festif.',
    boule: 'vert' as const,
  },
]

export function ModesPreview() {
  return (
    <section id="modes" className="py-20 md:py-28 bg-petanque-sable-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl mb-14">
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Modes de jeu
          </p>
          <h2 className="text-3xl md:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1]">
            Trois formats,<br />
            <span className="accent-italic text-petanque-vert">une seule app.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {modes.map((mode, i) => (
            <FadeIn key={mode.title} delay={i * 100}>
              <div
                className={`group h-full bg-white border rounded-xl p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 ${
                  mode.featured
                    ? 'border-petanque-vert border-2'
                    : 'border-petanque-sable-bord/60 hover:border-petanque-vert/40'
                }`}
              >
                {mode.featured && (
                  <span className="absolute -top-3 left-7 px-2.5 py-0.5 bg-petanque-vert text-petanque-sable text-[10px] font-medium uppercase tracking-widest rounded-full">
                    Le plus joué
                  </span>
                )}
                <div className="mb-5">
                  <BouleSvg
                    size={56}
                    variant={mode.boule}
                    stries={mode.boule !== 'cochonnet'}
                    className="group-hover:rotate-12 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-xl font-medium text-petanque-vert-fonce mb-1 tracking-tight">
                  {mode.title}
                </h3>
                <p className="text-xs text-petanque-bois uppercase tracking-wider mb-3">
                  {mode.tagline}
                </p>
                <p className="text-sm text-petanque-bois leading-relaxed">{mode.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <Link
            href="/modes"
            className="inline-flex items-center gap-2 text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce group"
          >
            Voir tous les modes en détail
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
