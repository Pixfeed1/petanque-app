'use client'

import { useParams, useRouter } from 'next/navigation'
import { useBracket, BracketMatch, BracketData } from '@/hooks/bracket'
import { Trophy, Medal, Petanque, Crown, Arrow, Loader, Flag, Users, PlayLarge } from '@/components/Icons'

// Icones premium
const Icons = {
  trophy: <Trophy className="w-6 h-6" />,
  medal: <Medal className="w-8 h-8" />,
  petanque: <Petanque className="w-8 h-8" />,
  crown: <Crown className="w-10 h-10" />,
  arrow: <Arrow className="w-5 h-5" />,
  loader: <Loader className="h-6 w-6" />,
  flag: <Flag className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  play: <PlayLarge className="w-5 h-5" />
}

/**
 * Page de l'arbre du tournoi (bracket)
 * - Affichage des phases finales
 * - Navigation vers les matchs
 */
export default function BracketPage() {
  const params = useParams()
  const router = useRouter()

  const {
    loading,
    tournament,
    bracketData,
    hasHuitiemes,
    hasQuarts,
    hasDemis
  } = useBracket({ tournoiId: params?.id })

  const handleUpdateScore = (matchId: string) => {
    router.push(`/match/${matchId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              {Icons.loader}
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement de l'arbre...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animees */}
      <AnimatedBackground />

      {/* Header */}
      <PageHeader
        tournamentName={tournament?.name}
        onBack={() => router.push(`/tournoi/${params?.id}`)}
      />

      {/* Arbre du tournoi */}
      <div className="p-8 overflow-x-auto">
        <div className="bracket-container min-w-max">
          <div className="bracket-wrapper flex items-center justify-center gap-8">

            {/* Huitiemes de finale */}
            {hasHuitiemes && (
              <BracketColumn
                title="1/8 Finale"
                matches={bracketData.huitiemes}
                matchPrefix="huitieme"
                count={8}
                spacing="space-y-8"
                onUpdateScore={handleUpdateScore}
              />
            )}

            {/* Quarts de finale */}
            {hasQuarts && (
              <BracketColumn
                title="1/4 Finale"
                matches={bracketData.quarts}
                matchPrefix="quart"
                count={4}
                spacing={hasHuitiemes ? 'space-y-32' : 'space-y-16'}
                onUpdateScore={handleUpdateScore}
              />
            )}

            {/* Demi-finales */}
            {hasDemis && (
              <BracketColumn
                title="1/2 Finale"
                matches={bracketData.demis}
                matchPrefix="demi"
                count={2}
                spacing={hasQuarts ? 'space-y-64' : 'space-y-32'}
                onUpdateScore={handleUpdateScore}
              />
            )}

            {/* Finale et Petite finale */}
            <FinaleColumn
              finale={bracketData.finale}
              petiteFinale={bracketData.petiteFinale}
              hasConsolante={tournament?.settings?.consolante}
              onUpdateScore={handleUpdateScore}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .bracket-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .bracket-wrapper { position: relative; }
        .bracket-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  )
}

// ============================================================================
// Composants internes
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  )
}

interface PageHeaderProps {
  tournamentName?: string
  onBack: () => void
}

function PageHeader({ tournamentName, onBack }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all"
            >
              ← <span className="font-medium">Retour au tournoi</span>
            </button>

            <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
                {Icons.trophy}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Phases finales
                </h1>
                <p className="text-sm text-gray-500">{tournamentName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

interface BracketColumnProps {
  title: string
  matches: BracketMatch[]
  matchPrefix: string
  count: number
  spacing: string
  onUpdateScore: (matchId: string) => void
}

function BracketColumn({ title, matches, matchPrefix, count, spacing, onUpdateScore }: BracketColumnProps) {
  return (
    <div className="bracket-column">
      <h3 className="text-center font-bold text-gray-700 mb-4">{title}</h3>
      <div className={spacing}>
        {Array.from({ length: count }).map((_, i) => (
          <MatchCard
            key={`${matchPrefix}-${i}`}
            match={matches[i]}
            position={`${matchPrefix}-${i}`}
            onUpdateScore={onUpdateScore}
          />
        ))}
      </div>
    </div>
  )
}

interface MatchCardProps {
  match?: BracketMatch | null
  position: string
  onUpdateScore: (matchId: string) => void
}

function MatchCard({ match, position, onUpdateScore }: MatchCardProps) {
  const router = useRouter()

  if (!match) {
    return (
      <div className={`bracket-match empty ${position}`}>
        <div className="match-card bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 opacity-50 min-w-[280px]">
          <div className="text-center text-gray-400">
            <p className="text-sm">En attente</p>
            <p className="text-xs mt-1">Qualifie des poules</p>
          </div>
        </div>
      </div>
    )
  }

  const winner = match.status === 'termine'
    ? (match.score_a > match.score_b ? 'A' : 'B')
    : null

  return (
    <div className={`bracket-match ${position} relative min-w-[280px]`}>
      <div className={`match-card relative bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:scale-105 ${
        match.status === 'en_cours' ? 'ring-2 ring-orange-500 animate-pulse' : ''
      }`}>
        {/* Badge statut */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
          match.status === 'termine' ? 'bg-gray-100 text-gray-700' :
          match.status === 'en_cours' ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {match.status === 'termine' ? 'Termine' :
           match.status === 'en_cours' ? 'En cours' : 'A jouer'}
        </div>

        {/* Equipes */}
        <div className="p-4">
          <TeamRow
            team={match.equipe_a}
            score={match.score_a}
            isWinner={winner === 'A'}
            showScore={match.status !== 'a_jouer'}
          />
          <TeamRow
            team={match.equipe_b}
            score={match.score_b}
            isWinner={winner === 'B'}
            showScore={match.status !== 'a_jouer'}
            isLast
          />
        </div>

        {/* Actions */}
        {match.status === 'a_jouer' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => onUpdateScore(match.id)}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center"
            >
              {Icons.play}
              <span className="ml-2">Saisir le score</span>
            </button>
          </div>
        )}

        {match.status === 'en_cours' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => router.push(`/match/${match.id}`)}
              className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg animate-pulse flex items-center justify-center"
            >
              Match en cours...
            </button>
          </div>
        )}
      </div>

      {/* Ligne de connexion */}
      <div className="connector absolute w-10 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent top-1/2 -right-10 transform -translate-y-1/2"></div>
    </div>
  )
}

interface TeamRowProps {
  team: any
  score: number
  isWinner: boolean
  showScore: boolean
  isLast?: boolean
}

function TeamRow({ team, score, isWinner, showScore, isLast }: TeamRowProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${!isLast ? 'mb-2' : ''} transition-all ${
      isWinner
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500'
        : showScore && !isWinner
        ? 'opacity-50'
        : 'bg-gray-50'
    }`}>
      <div className="flex items-center">
        {isWinner && (
          <div className="text-green-600 mr-2 animate-bounce">
            {Icons.trophy}
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900">{team?.name || 'TBD'}</p>
          <p className="text-xs text-gray-500">
            {team?.players?.length || 0} joueurs
          </p>
        </div>
      </div>
      {showScore && (
        <span className="text-2xl font-bold text-gray-900">{score}</span>
      )}
    </div>
  )
}

interface FinaleColumnProps {
  finale: BracketMatch | null
  petiteFinale: BracketMatch | null
  hasConsolante?: boolean
  onUpdateScore: (matchId: string) => void
}

function FinaleColumn({ finale, petiteFinale, hasConsolante, onUpdateScore }: FinaleColumnProps) {
  return (
    <div className="bracket-column finale-column flex flex-col justify-center">
      {/* Finale */}
      <div className="finale-wrapper mb-16">
        <h3 className="text-center font-bold text-xl text-gray-900 mb-4 flex items-center justify-center">
          <div className="text-yellow-500 mr-2">{Icons.crown}</div>
          FINALE
        </h3>
        <div className="finale-match scale-110">
          {finale ? (
            <FinaleCard match={finale} onUpdateScore={onUpdateScore} />
          ) : (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <div className="text-gray-400 mb-2">{Icons.trophy}</div>
              <p className="text-gray-500">En attente des finalistes</p>
            </div>
          )}
        </div>
      </div>

      {/* Petite finale */}
      {hasConsolante && (
        <div className="petite-finale-wrapper">
          <h3 className="text-center font-bold text-gray-700 mb-4">3eme place</h3>
          {petiteFinale ? (
            <PetiteFinaleCard match={petiteFinale} onUpdateScore={onUpdateScore} />
          ) : (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">En attente</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FinaleCardProps {
  match: BracketMatch
  onUpdateScore: (matchId: string) => void
}

function FinaleCard({ match, onUpdateScore }: FinaleCardProps) {
  const winnerA = match.status === 'termine' && match.score_a > match.score_b
  const winnerB = match.status === 'termine' && match.score_b > match.score_a

  return (
    <div className="relative">
      {/* Effet brillant */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 rounded-2xl blur-xl opacity-30 animate-pulse"></div>

      <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl shadow-2xl p-6">
        {/* Badge finale */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold rounded-full">
            🏆 GRANDE FINALE 🏆
          </div>
        </div>

        {/* Statut */}
        <div className={`text-center mb-4 px-3 py-1 rounded-full text-xs font-bold inline-block ${
          match.status === 'termine' ? 'bg-green-100 text-green-700' :
          match.status === 'en_cours' ? 'bg-orange-100 text-orange-700 animate-pulse' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {match.status === 'termine' ? 'Match termine' :
           match.status === 'en_cours' ? 'En cours' : 'A venir'}
        </div>

        {/* Equipes */}
        <div className="space-y-3">
          <FinaleTeamRow
            team={match.equipe_a}
            score={match.score_a}
            isWinner={winnerA}
            showScore={match.status !== 'a_jouer'}
          />
          <div className="text-center text-gray-400 font-bold">VS</div>
          <FinaleTeamRow
            team={match.equipe_b}
            score={match.score_b}
            isWinner={winnerB}
            showScore={match.status !== 'a_jouer'}
          />
        </div>

        {/* Action */}
        {match.status === 'a_jouer' && (
          <button
            onClick={() => onUpdateScore(match.id)}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Commencer la finale
          </button>
        )}
      </div>
    </div>
  )
}

interface FinaleTeamRowProps {
  team: any
  score: number
  isWinner: boolean
  showScore: boolean
}

function FinaleTeamRow({ team, score, isWinner, showScore }: FinaleTeamRowProps) {
  return (
    <div className={`p-4 rounded-xl transition-all ${
      isWinner
        ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 transform scale-105'
        : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isWinner && <div className="text-3xl mr-3">🥇</div>}
          <div>
            <p className="font-bold text-lg">{team?.name}</p>
            <p className="text-sm text-gray-500">Finaliste</p>
          </div>
        </div>
        {showScore && (
          <span className="text-3xl font-bold">{score}</span>
        )}
      </div>
    </div>
  )
}

interface PetiteFinaleCardProps {
  match: BracketMatch
  onUpdateScore: (matchId: string) => void
}

function PetiteFinaleCard({ match, onUpdateScore }: PetiteFinaleCardProps) {
  const winnerA = match.status === 'termine' && match.score_a > match.score_b
  const winnerB = match.status === 'termine' && match.score_b > match.score_a

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl shadow-lg p-4">
      <div className="text-center mb-3">
        <span className="text-2xl">🥉</span>
      </div>

      {/* Equipes */}
      <div className="space-y-2">
        <div className={`p-3 rounded-lg bg-white flex items-center justify-between ${
          winnerA ? 'ring-2 ring-orange-400' : ''
        }`}>
          <span className="font-medium">{match.equipe_a?.name}</span>
          {match.status !== 'a_jouer' && (
            <span className="font-bold text-xl">{match.score_a}</span>
          )}
        </div>

        <div className={`p-3 rounded-lg bg-white flex items-center justify-between ${
          winnerB ? 'ring-2 ring-orange-400' : ''
        }`}>
          <span className="font-medium">{match.equipe_b?.name}</span>
          {match.status !== 'a_jouer' && (
            <span className="font-bold text-xl">{match.score_b}</span>
          )}
        </div>
      </div>

      {match.status === 'a_jouer' && (
        <button
          onClick={() => onUpdateScore(match.id)}
          className="w-full mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
        >
          Saisir le score
        </button>
      )}
    </div>
  )
}
