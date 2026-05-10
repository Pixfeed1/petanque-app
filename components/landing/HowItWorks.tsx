import { FadeIn, BouleSvg } from '@/components/ui'

const steps = [
  {
    num: '01',
    title: 'Crée ton tournoi',
    desc: 'Choisis le mode (choisi, mêlée fixe ou tournante), inscris tes joueurs, fixe le nombre de tours et de terrains. 2 minutes top.',
    accent: 'acier' as const,
  },
  {
    num: '02',
    title: 'Lance la mêlée',
    desc: 'Tirage automatique des équipes selon les règles FIPJP, mixité H/F garantie, gestion temps réel sur tous tes terrains depuis ton mobile.',
    accent: 'cochonnet' as const,
  },
  {
    num: '03',
    title: 'Couronne le podium',
    desc: 'Classement en direct, podium calculé, exports PDF et Excel pour le club. Les joueurs reçoivent leurs résultats.',
    accent: 'vert' as const,
  },
]

export function HowItWorks() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl mb-16">
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Comment ça marche
          </p>
          <h2 className="text-3xl md:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1]">
            De l'inscription au podium,<br />
            <span className="accent-italic text-petanque-vert">en trois temps.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-x-10 gap-y-14">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 120} className="relative">
              <div className="flex items-start gap-4 mb-4">
                <BouleSvg size={48} variant={step.accent} stries />
                <span className="font-mono text-[11px] font-medium text-petanque-bois mt-1 tracking-widest">
                  {step.num}
                </span>
              </div>
              <h3 className="text-xl font-medium text-petanque-vert-fonce mb-2 tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm md:text-base text-petanque-bois leading-relaxed">
                {step.desc}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
