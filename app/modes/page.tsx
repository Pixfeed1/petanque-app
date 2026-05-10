'use client'

import { useState } from 'react'
import Link from 'next/link'
import Footer from '../components/footer'
import { Navbar } from '@/components/landing/Navbar'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Button, Badge, BouleSvg, FadeIn } from '@/components/ui'

type ModeType = 'choisi' | 'melee-fixe' | 'melee-tournante'

interface ModeDetail {
  title: string
  subtitle: string
  advantages: string[]
  howItWorks: string[]
  idealFor: string
  teamFormation: { title: string; rules: string[] }
  ranking: { title: string; type: string; criteria: string[] }
}

const modes: Array<{
  id: ModeType
  name: string
  tagline: string
  description: string
  boule: 'acier' | 'cochonnet' | 'vert'
}> = [
  {
    id: 'choisi',
    name: 'Mode Choisi',
    tagline: 'Garde tes partenaires préférés',
    description: 'Les joueurs forment leurs propres équipes',
    boule: 'acier',
  },
  {
    id: 'melee-fixe',
    name: 'Mêlée Fixe',
    tagline: 'Découvre de nouveaux partenaires',
    description: 'Tirage aléatoire au début, équipes fixes',
    boule: 'cochonnet',
  },
  {
    id: 'melee-tournante',
    name: 'Mêlée Tournante',
    tagline: 'Maximum de rencontres',
    description: 'Rotation par tour ou par match',
    boule: 'vert',
  },
]

const modeDetails: Record<ModeType, ModeDetail> = {
  choisi: {
    title: 'Mode Choisi — Équipes fixes',
    subtitle: 'Les joueurs composent leurs équipes comme ils le souhaitent',
    advantages: [
      "Stratégie d'équipe développée",
      'Complicité entre partenaires',
      'Idéal pour les clubs et amis',
      'Tactiques élaborées possibles',
    ],
    howItWorks: [
      "Les joueurs s'inscrivent en équipes déjà formées",
      "L'organisateur valide les compositions",
      'Les équipes restent identiques tout le tournoi',
      'Classement final par équipe',
    ],
    idealFor: 'Clubs, tournois entre amis, compétitions officielles',
    teamFormation: {
      title: 'Formation des équipes',
      rules: [
        'Doublette : 2 joueurs par équipe',
        'Triplette : 3 joueurs par équipe',
        "Possibilité d'avoir un remplaçant",
        'Respect des catégories si nécessaire',
      ],
    },
    ranking: {
      title: 'Système de classement',
      type: 'Par équipe',
      criteria: [
        'Nombre de victoires',
        'Différence de points (goal average)',
        'Points marqués au total',
        'Confrontation directe si égalité',
      ],
    },
  },
  'melee-fixe': {
    title: 'Mêlée Fixe — Tirage initial',
    subtitle: 'Les équipes sont tirées au sort au début et restent fixes',
    advantages: [
      'Équité parfaite du tirage',
      'Création de nouvelles amitiés',
      'Mixité H/F garantie',
      'Esprit de cohésion à développer',
    ],
    howItWorks: [
      'Inscription individuelle des joueurs',
      'Tirage au sort respectant la mixité H/F',
      'Les équipes formées jouent ensemble tout le tournoi',
      'Classement final par équipe',
    ],
    idealFor: "Tournois conviviaux, événements d'entreprise, découverte",
    teamFormation: {
      title: 'Tirage automatique',
      rules: [
        'Respect de la mixité H/F obligatoire',
        'Maximum 2 personnes du même genre en triplette',
        'Priorité aux doublettes mixtes (1H+1F)',
        'Équilibrage des niveaux si connus',
      ],
    },
    ranking: {
      title: 'Système de classement',
      type: 'Par équipe',
      criteria: [
        'Nombre de victoires',
        'Différence de points',
        'Points marqués',
        "Fair-play et esprit d'équipe",
      ],
    },
  },
  'melee-tournante': {
    title: 'Mêlée Tournante — Maximum de variété',
    subtitle: 'Changement de partenaires par tour ou par match',
    advantages: [
      'Jouer avec tout le monde',
      'Pas de routine ni de lassitude',
      'Classement individuel équitable',
      'Ambiance festive garantie',
    ],
    howItWorks: [
      'Inscription individuelle des joueurs',
      'Choix de rotation : par tour (recommandé) ou par match',
      'Nouveau tirage selon votre paramétrage',
      'Classement individuel final',
    ],
    idealFor: 'Animations, tournois découverte, événements festifs',
    teamFormation: {
      title: 'Options de rotation',
      rules: [
        'Par tour : nouvelles équipes à chaque tour (recommandé)',
        'Par match : nouvelles équipes après chaque partie',
        'Algorithme évite les répétitions',
        'Mixité H/F respectée à chaque tirage',
      ],
    },
    ranking: {
      title: 'Système de classement',
      type: 'Individuel',
      criteria: [
        'Nombre de victoires personnelles',
        'Moyenne des différences de points',
        'Points moyens par partie',
        'Régularité des performances',
      ],
    },
  },
}

export default function GameModesPage() {
  const [activeMode, setActiveMode] = useState<ModeType>('choisi')
  const current = modeDetails[activeMode]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-petanque-vert-pale/30 via-white to-petanque-cochonnet-pale/30" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-petanque-vert-pale rounded-full blur-3xl opacity-50 animate-blob -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-4">
              Modes de jeu
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] max-w-3xl">
              Trois formats,<br />
              <span className="accent-italic text-petanque-vert">pour tous tes tournois.</span>
            </h1>
            <p className="text-base md:text-lg text-petanque-bois leading-relaxed mt-6 max-w-2xl">
              Choisis le format qui correspond à ton événement. Chaque mode a ses
              avantages et crée une expérience différente.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {modes.map((mode) => {
              const isActive = activeMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`group relative text-left bg-white border rounded-xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 ${
                    isActive
                      ? 'border-petanque-vert border-2'
                      : 'border-petanque-sable-bord/60 hover:border-petanque-vert/40'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-3 right-5 px-2.5 py-0.5 bg-petanque-vert text-petanque-sable text-[10px] font-medium uppercase tracking-widest rounded-full">
                      Sélectionné
                    </span>
                  )}
                  <div className="mb-4">
                    <BouleSvg
                      size={48}
                      variant={mode.boule}
                      stries
                      className="group-hover:rotate-12 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-lg font-medium text-petanque-vert-fonce mb-1 tracking-tight">
                    {mode.name}
                  </h3>
                  <p className="text-xs text-petanque-bois uppercase tracking-wider mb-2">
                    {mode.description}
                  </p>
                  <p className="text-xs text-petanque-vert font-medium">{mode.tagline}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-petanque-sable-pale">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-medium text-petanque-vert-fonce tracking-tight mb-3">
                {current.title}
              </h2>
              <p className="text-base text-petanque-bois max-w-2xl leading-relaxed">
                {current.subtitle}
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10 mb-12">
            <FadeIn>
              <div>
                <h3 className="text-xs font-medium text-petanque-bois uppercase tracking-[0.15em] mb-4">
                  Avantages
                </h3>
                <ul className="space-y-3">
                  {current.advantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-petanque-vert-fonce leading-relaxed">
                      <span className="text-petanque-vert mt-0.5 flex-shrink-0">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div>
                <h3 className="text-xs font-medium text-petanque-bois uppercase tracking-[0.15em] mb-4">
                  Comment ça marche
                </h3>
                <ol className="space-y-3">
                  {current.howItWorks.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-petanque-vert-fonce leading-relaxed">
                      <span className="font-mono text-[11px] text-petanque-bois flex-shrink-0 mt-0.5 tracking-widest">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <FadeIn>
              <div className="bg-white border border-petanque-sable-bord/60 rounded-xl p-6">
                <h3 className="text-sm font-medium text-petanque-vert-fonce mb-4">
                  {current.teamFormation.title}
                </h3>
                <ul className="space-y-2">
                  {current.teamFormation.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-petanque-bois leading-relaxed">
                      <span className="text-petanque-bois/40 mt-0.5">→</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="bg-white border border-petanque-sable-bord/60 rounded-xl p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-sm font-medium text-petanque-vert-fonce">
                    {current.ranking.title}
                  </h3>
                  <Badge variant="success" withBoule={false}>
                    {current.ranking.type}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {current.ranking.criteria.map((crit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-petanque-bois leading-relaxed">
                      <span className="text-petanque-bois/40 mt-0.5">→</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          <FadeIn>
            <div className="bg-petanque-vert text-petanque-sable rounded-xl px-6 py-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-70 mb-1">
                Idéal pour
              </p>
              <p className="text-base md:text-lg font-medium">{current.idealFor}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
              Mixité H/F
            </p>
            <h2 className="text-2xl md:text-3xl font-medium text-petanque-vert-fonce tracking-tight mb-3">
              Gestion intelligente,<br />
              <span className="accent-italic text-petanque-vert">automatique.</span>
            </h2>
            <p className="text-base text-petanque-bois max-w-2xl leading-relaxed">
              Les règles de mixité sont appliquées automatiquement à chaque tirage,
              quel que soit le mode choisi.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 mt-12">
            {[
              { title: 'Triplettes', desc: 'Maximum 2 personnes du même genre (2H+1F ou 2F+1H)' },
              { title: 'Doublettes', desc: 'Priorité aux équipes mixtes (1H+1F)' },
              { title: 'Affrontements équilibrés', desc: 'Évite les confrontations déséquilibrées' },
              { title: 'Algorithme adaptatif', desc: "S'ajuste si la répartition parfaite est impossible" },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div>
                  <h4 className="text-sm font-medium text-petanque-vert-fonce mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-sm text-petanque-bois leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-petanque-sable-pale">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-medium text-petanque-vert-fonce tracking-tight mb-10">
              Comparaison
            </h2>
          </FadeIn>

          <FadeIn>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
                <thead className="bg-petanque-vert-fonce text-petanque-sable">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider">Critère</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider">Choisi</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider">Mêlée fixe</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider">Tournante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-petanque-sable-bord/40">
                  {[
                    ['Formation équipes', 'Par les joueurs', 'Tirage au sort', 'Par tour ou match'],
                    ['Classement', 'Par équipe', 'Par équipe', 'Individuel'],
                    ['Mixité H/F', 'Libre', 'Automatique', 'Automatique'],
                    ['Stratégie', 'Maximale', 'Moyenne', 'Adaptation'],
                    ['Convivialité', 'Bonne', 'Très bonne', 'Excellente'],
                    ['Durée conseillée', '3-5 parties', '3-5 parties', '4-8 parties'],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-petanque-sable-pale/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-petanque-vert-fonce">{row[0]}</td>
                      <td className="px-5 py-3 text-sm text-petanque-bois text-center">{row[1]}</td>
                      <td className="px-5 py-3 text-sm text-petanque-bois text-center">{row[2]}</td>
                      <td className="px-5 py-3 text-sm text-petanque-bois text-center">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  )
}
