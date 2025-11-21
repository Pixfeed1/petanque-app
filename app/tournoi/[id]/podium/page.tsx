'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePodium, PodiumTeam } from '@/hooks/podium'
import { Trophy, Crown, Medal, Star, Sparkles, Petanque, Download, Loader } from '@/components/Icons'

// Icones premium
const Icons = {
  trophy: <Trophy className="w-8 h-8" />,
  crown: <Crown className="w-12 h-12" />,
  medal: <Medal className="w-10 h-10" />,
  star: <Star className="w-6 h-6" />,
  sparkles: <Sparkles className="w-8 h-8" />,
  petanque: <Petanque className="w-10 h-10" />,
  share: <Download className="w-6 h-6" />,
  download: <Download className="w-6 h-6" />,
  loader: <Loader className="h-8 w-8" />,
  camera: <Download className="w-6 h-6" />
}

/**
 * Page du podium final
 * - Affichage anime des 3 premiers
 * - Generation de certificats
 * - Partage des resultats
 */
export default function PodiumPage() {
  const params = useParams()
  const router = useRouter()

  const {
    loading,
    tournament,
    podium,
    showAnimation,
    animationStep,
    generatingCertificate,
    handleShare,
    generatePremiumCertificate
  } = usePodium({ tournoiId: params.id })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              {Icons.loader}
              <p className="mt-4 text-lg font-medium text-gray-600">Preparation du podium...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 overflow-hidden">
      {/* Particules animees dorees */}
      <AnimatedBackground />

      {/* Header */}
      <PageHeader
        tournamentName={tournament?.name}
        onBack={() => router.push(`/tournoi/${params.id}`)}
        onShare={handleShare}
      />

      {/* Titre anime */}
      <AnimatedTitle
        showAnimation={showAnimation}
        tournamentName={tournament?.name}
        tournamentDate={tournament?.settings?.date}
      />

      {/* Podium */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-end justify-center space-x-4 md:space-x-8">
          {/* 2eme place */}
          <PodiumPlace
            position={2}
            team={podium[1]}
            animationStep={animationStep}
            generatingCertificate={generatingCertificate}
            onGenerateCertificate={() => generatePremiumCertificate(2, podium[1])}
          />

          {/* 1ere place */}
          <PodiumPlace
            position={1}
            team={podium[0]}
            animationStep={animationStep}
            generatingCertificate={generatingCertificate}
            onGenerateCertificate={() => generatePremiumCertificate(1, podium[0])}
          />

          {/* 3eme place */}
          <PodiumPlace
            position={3}
            team={podium[2]}
            animationStep={animationStep}
            generatingCertificate={generatingCertificate}
            onGenerateCertificate={() => generatePremiumCertificate(3, podium[2])}
          />
        </div>

        {/* Base du podium */}
        <div className="flex justify-center -mt-1">
          <div className="w-full max-w-4xl h-20 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-3xl shadow-2xl"></div>
        </div>
      </div>

      {/* Actions finales */}
      <FinalActions
        tournoiId={params.id as string}
        onNavigate={router.push}
      />

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        @media print {
          header, .no-print { display: none !important; }
        }
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
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-yellow-300 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-orange-300 to-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>
  )
}

interface PageHeaderProps {
  tournamentName?: string
  onBack: () => void
  onShare: () => void
}

function PageHeader({ tournamentName, onBack, onShare }: PageHeaderProps) {
  return (
    <header className="relative z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
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
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl text-white shadow-lg">
                {Icons.trophy}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  Podium Final
                </h1>
                <p className="text-sm text-gray-500">{tournamentName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onShare}
              className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {Icons.share}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

interface AnimatedTitleProps {
  showAnimation: boolean
  tournamentName?: string
  tournamentDate?: string
}

function AnimatedTitle({ showAnimation, tournamentName, tournamentDate }: AnimatedTitleProps) {
  return (
    <div className="text-center mt-12 mb-8">
      <div className={`transition-all duration-1000 transform ${showAnimation ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <h2 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <span className="mr-4">🎉</span>
          Felicitations aux vainqueurs !
          <span className="ml-4">🎉</span>
        </h2>
        <p className="text-xl text-gray-600">
          {tournamentName} - {tournamentDate ? new Date(tournamentDate).toLocaleDateString('fr-FR') : ''}
        </p>
      </div>
    </div>
  )
}

interface PodiumPlaceProps {
  position: 1 | 2 | 3
  team?: PodiumTeam
  animationStep: number
  generatingCertificate: boolean
  onGenerateCertificate: () => void
}

function PodiumPlace({ position, team, animationStep, generatingCertificate, onGenerateCertificate }: PodiumPlaceProps) {
  const isVisible = animationStep >= position

  const config = {
    1: {
      emoji: '🥇',
      title: 'CHAMPION',
      height: 'h-80',
      gradient: 'from-yellow-300 via-amber-300 to-yellow-400',
      textGradient: 'from-yellow-600 to-amber-600',
      buttonGradient: 'from-yellow-600 to-amber-600',
      scale: 'scale-110'
    },
    2: {
      emoji: '🥈',
      title: '2eme',
      height: 'h-64',
      gradient: 'from-gray-100 to-gray-200',
      textGradient: '',
      buttonGradient: 'from-gray-600 to-gray-700',
      scale: ''
    },
    3: {
      emoji: '🥉',
      title: '3eme',
      height: 'h-56',
      gradient: 'from-orange-100 to-orange-200',
      textGradient: '',
      buttonGradient: 'from-orange-600 to-orange-700',
      scale: ''
    }
  }[position]

  return (
    <div className={`flex-1 max-w-xs transition-all duration-1000 transform ${
      isVisible ? `translate-y-0 opacity-100 ${config.scale}` : 'translate-y-20 opacity-0'
    }`}>
      {/* Badge de position */}
      <div className="text-center mb-4">
        <div className={`inline-block ${position === 1 ? 'relative' : ''}`}>
          {position === 1 && (
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
          )}
          <div className={position === 1 ? 'relative' : ''}>
            <div className={`${position === 1 ? 'text-7xl animate-bounce' : 'text-6xl'} mb-2`}>
              {config.emoji}
            </div>
            <h3 className={`${position === 1 ? 'text-3xl' : 'text-2xl'} font-bold ${
              position === 1 ? `bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent` :
              position === 3 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {config.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Carte du podium */}
      <div className={`bg-gradient-to-br ${config.gradient} rounded-t-3xl p-6 shadow-2xl ${config.height} relative overflow-hidden`}>
        {position === 1 && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
          </>
        )}
        {position !== 1 && (
          <div className={`absolute inset-0 bg-gradient-to-t ${position === 2 ? 'from-gray-300/20' : 'from-orange-300/20'} to-transparent`}></div>
        )}

        <div className="relative">
          {position === 1 && (
            <div className="absolute -top-2 -right-2 text-yellow-600 animate-spin-slow">
              {Icons.crown}
            </div>
          )}

          <h4 className={`${position === 1 ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 mb-${position === 1 ? '3' : '2'}`}>
            {team?.team.name || 'Non determine'}
          </h4>

          {team && (
            <>
              <div className="space-y-2 mb-4">
                {team.team.players?.map((player: any, i: number) => (
                  <p key={i} className={`text-sm ${position === 1 ? 'font-medium text-gray-800' : 'text-gray-700'}`}>
                    {position === 1 ? '⭐ ' : ''}{player?.name}
                  </p>
                ))}
              </div>

              {team.stats && (
                <div className={`${position === 1 ? 'bg-white/60 backdrop-blur p-4' : 'bg-white/50 p-3'} rounded-lg ${position === 1 ? '' : 'text-xs'}`}>
                  {position === 1 ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="font-bold text-green-700">{team.stats.victories}</p>
                        <p className="text-xs text-gray-600">Victoires</p>
                      </div>
                      <div>
                        <p className="font-bold text-blue-700">+{team.stats.pointsFor - team.stats.pointsAgainst}</p>
                        <p className="text-xs text-gray-600">Difference</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{team.stats.victories} victoires</p>
                      <p>+{team.stats.pointsFor - team.stats.pointsAgainst} pts</p>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={onGenerateCertificate}
                disabled={generatingCertificate}
                className={`mt-4 w-full px-4 py-${position === 1 ? '3' : '2'} bg-gradient-to-r ${config.buttonGradient} text-white rounded-lg hover:shadow-lg transition-all ${position === 1 ? 'font-bold' : 'text-sm'} flex items-center justify-center disabled:opacity-50`}
              >
                {generatingCertificate ? Icons.loader : Icons.download}
                <span className="ml-2">{position === 1 ? 'Certificat Champion' : 'Certificat'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface FinalActionsProps {
  tournoiId: string
  onNavigate: (path: string) => void
}

function FinalActions({ tournoiId, onNavigate }: FinalActionsProps) {
  const actions = [
    {
      onClick: () => onNavigate(`/export/${tournoiId}`),
      gradient: 'from-blue-600 to-indigo-600',
      icon: Icons.download,
      label: 'Exporter les resultats'
    },
    {
      onClick: () => window.print(),
      gradient: 'from-purple-600 to-pink-600',
      icon: Icons.camera,
      label: 'Imprimer le podium'
    },
    {
      onClick: () => onNavigate('/tournoi/nouveau'),
      gradient: 'from-green-600 to-emerald-600',
      icon: Icons.sparkles,
      label: 'Nouveau tournoi'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Tournoi termine avec succes !
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r ${action.gradient} text-white rounded-xl hover:shadow-lg transition-all`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
          <p className="text-center text-gray-700">
            <span className="font-bold">Merci d'avoir utilise notre application !</span><br />
            N'oubliez pas de partager les resultats avec tous les participants.
          </p>
        </div>
      </div>
    </div>
  )
}
