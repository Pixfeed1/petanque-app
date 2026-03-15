'use client'

import { useParams, useRouter } from 'next/navigation'
import { useTournamentExport, ExportOptions } from '@/hooks/export'
import {
  Download, Trophy, Users, Calendar, Loader, Flag,
  Chart, Petanque, Settings
} from '@/components/Icons'

/**
 * Page d'export du tournoi
 * - Export PDF avec classements et matchs
 * - Export Excel multi-feuilles
 * - Impression directe
 */
export default function ExportTournamentPage() {
  const params = useParams()
  const router = useRouter()

  const {
    loading,
    exporting,
    tournament,
    teams,
    matches,
    players,
    rankings,
    exportOptions,
    setExportOptions,
    exportToPDF,
    exportToExcel,
    handlePrint
  } = useTournamentExport({ tournoiId: params?.id })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <Loader className="h-6 w-6 animate-spin" />
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement des donnees...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Header */}
      <PageHeader
        tournamentName={tournament?.name}
        onBack={() => router.push(`/tournoi/${params?.id}`)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Options d'export */}
          <div className="md:col-span-1">
            <ExportOptionsPanel
              options={exportOptions}
              isMeleeTournante={tournament?.mode === 'melee_tournante'}
              onChange={setExportOptions}
            />
          </div>

          {/* Aperçu et actions */}
          <div className="md:col-span-2 space-y-6">
            {/* Résumé du tournoi */}
            <TournamentSummary
              tournament={tournament}
              teamsCount={teams.length}
              playersCount={players.length}
              matchesCount={matches.length}
              playedMatchesCount={matches.filter(m => m.status === 'termine').length}
            />

            {/* Top 3 */}
            {rankings.length > 0 && (
              <Top3Rankings
                rankings={rankings}
                isMeleeTournante={tournament?.mode === 'melee_tournante'}
              />
            )}

            {/* Actions d'export */}
            <ExportActions
              exporting={exporting}
              onExportPDF={exportToPDF}
              onExportExcel={exportToExcel}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body { font-family: Arial, sans-serif; }
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Composants internes
// ============================================================================

interface PageHeaderProps {
  tournamentName?: string
  onBack: () => void
}

function PageHeader({ tournamentName, onBack }: PageHeaderProps) {
  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
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
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Export du tournoi
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

interface ExportOptionsPanelProps {
  options: ExportOptions
  isMeleeTournante?: boolean
  onChange: (options: ExportOptions) => void
}

function ExportOptionsPanel({ options, isMeleeTournante, onChange }: ExportOptionsPanelProps) {
  const optionsList = [
    { key: 'includeMatches', label: 'Inclure les matchs' },
    { key: 'includeRankings', label: isMeleeTournante ? 'Inclure classement individuel' : 'Inclure le classement' },
    { key: 'includeStatistics', label: 'Inclure les statistiques' },
    { key: 'includePoules', label: 'Inclure les poules' },
    { key: 'includePhaseFinale', label: 'Inclure phases finales' },
    { key: 'includeMenes', label: 'Inclure detail des menes' },
    { key: 'includeContacts', label: 'Inclure contacts joueurs' }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Settings className="w-5 h-5" />
        <span className="ml-2">Options d'export</span>
      </h2>

      <div className="space-y-3">
        {optionsList.map(option => (
          <label key={option.key} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options[option.key as keyof ExportOptions]}
              onChange={(e) => onChange({
                ...options,
                [option.key]: e.target.checked
              })}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-gray-700 group-hover:text-gray-900">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

interface TournamentSummaryProps {
  tournament: any
  teamsCount: number
  playersCount: number
  matchesCount: number
  playedMatchesCount: number
}

function TournamentSummary({
  tournament, teamsCount, playersCount, matchesCount, playedMatchesCount
}: TournamentSummaryProps) {
  const stats = [
    {
      label: 'Mode',
      value: tournament?.mode === 'choisi' ? 'Equipes choisies' :
             tournament?.mode === 'melee_fixe' ? 'Melee fixe' : 'Melee tournante',
      icon: <Users className="w-6 h-6" />
    },
    {
      label: 'Format',
      value: tournament?.format === 'doublette' ? 'Doublette' : 'Triplette',
      icon: <Petanque className="w-8 h-8" />
    },
    {
      label: tournament?.mode === 'melee_tournante' ? 'Joueurs' : 'Equipes',
      value: tournament?.mode === 'melee_tournante' ? playersCount : teamsCount,
      icon: <Flag className="w-6 h-6" />
    },
    {
      label: 'Matchs joues',
      value: `${playedMatchesCount}/${matchesCount}`,
      icon: <Chart className="w-6 h-6" />
    }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Petanque className="w-8 h-8" />
        <span className="ml-2">Resume du tournoi</span>
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
            <div className="text-gray-400">{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Top3RankingsProps {
  rankings: any[]
  isMeleeTournante?: boolean
}

function Top3Rankings({ rankings, isMeleeTournante }: Top3RankingsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Trophy className="w-6 h-6" />
        <span className="ml-2">
          {isMeleeTournante ? 'Top 3 Joueurs' : 'Top 3 Equipes'}
        </span>
      </h2>

      <div className="space-y-3">
        {rankings.slice(0, 3).map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-xl ${
              index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' :
              index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
              'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div>
                <p className="font-bold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {item.victories} victoire{item.victories > 1 ? 's' : ''} -
                  {item.difference > 0 ? '+' : ''}{item.difference} pts
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {item.points} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ExportActionsProps {
  exporting: boolean
  onExportPDF: () => void
  onExportExcel: () => void
  onPrint: () => void
}

function ExportActions({ exporting, onExportPDF, onExportExcel, onPrint }: ExportActionsProps) {
  const actions = [
    {
      onClick: onExportPDF,
      gradient: 'from-red-50 to-red-100',
      iconColor: 'text-red-600',
      title: 'Export PDF',
      description: 'Document complet pret a imprimer'
    },
    {
      onClick: onExportExcel,
      gradient: 'from-green-50 to-green-100',
      iconColor: 'text-green-600',
      title: 'Export Excel',
      description: 'Tableaux pour analyses'
    },
    {
      onClick: onPrint,
      gradient: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      title: 'Imprimer',
      description: 'Impression directe',
      noLoading: true
    }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Formats d'export disponibles</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={exporting && !action.noLoading}
            className={`group relative p-6 bg-gradient-to-br ${action.gradient} rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
          >
            <div className={`${action.iconColor} mb-3`}>
              <Download className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
            {exporting && !action.noLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
