'use client'

import { useMemo } from 'react'
import { Trophy, Flag, Chart, Users, Lightning, Medal } from '@/components/Icons'

interface Team {
  id: string
  name: string
  joueur_ids?: string[]
}

interface Match {
  id: string
  equipe_a: { id: string; name: string } | null
  equipe_b: { id: string; name: string } | null
  equipe_a_id?: string
  equipe_b_id?: string
  score_a: number
  score_b: number
  status: string
  type?: string
  tour: number
  terrain: number | null
  poule?: string
  started_at?: string | null
  ended_at?: string | null
}

interface AdvancedStatsProps {
  matches: Match[]
  teams: Team[]
  maxPoints: number
}

export default function AdvancedStats({ matches, teams, maxPoints }: AdvancedStatsProps) {
  const stats = useMemo(() => {
    const completed = matches.filter(m => m.status === 'termine' && m.type !== 'bye')
    if (completed.length === 0) return null

    // Fanny count (13-0 or maxPoints-0)
    const fannies = completed.filter(m =>
      (m.score_a === maxPoints && m.score_b === 0) ||
      (m.score_b === maxPoints && m.score_a === 0)
    )

    // Best attack (most points scored)
    const teamAttack = new Map<string, { name: string; points: number; matches: number }>()
    const teamDefense = new Map<string, { name: string; points: number; matches: number }>()
    const teamStreaks = new Map<string, { name: string; current: number; best: number }>()

    // Head-to-head matrix
    const h2h = new Map<string, Map<string, { wins: number; losses: number; draws: number }>>()

    // Score distribution
    const scoreDistribution: Record<number, number> = {}

    // Per-round stats
    const roundStats = new Map<number, { total: number; avgScore: number }>()

    completed.forEach(m => {
      const aId = m.equipe_a?.id || m.equipe_a_id || ''
      const bId = m.equipe_b?.id || m.equipe_b_id || ''
      const aName = m.equipe_a?.name || 'Équipe A'
      const bName = m.equipe_b?.name || 'Équipe B'

      // Attack stats
      if (aId) {
        const a = teamAttack.get(aId) || { name: aName, points: 0, matches: 0 }
        a.points += m.score_a
        a.matches++
        teamAttack.set(aId, a)

        const ad = teamDefense.get(aId) || { name: aName, points: 0, matches: 0 }
        ad.points += m.score_b
        ad.matches++
        teamDefense.set(aId, ad)
      }
      if (bId) {
        const b = teamAttack.get(bId) || { name: bName, points: 0, matches: 0 }
        b.points += m.score_b
        b.matches++
        teamAttack.set(bId, b)

        const bd = teamDefense.get(bId) || { name: bName, points: 0, matches: 0 }
        bd.points += m.score_a
        bd.matches++
        teamDefense.set(bId, bd)
      }

      // Score distribution
      scoreDistribution[m.score_a] = (scoreDistribution[m.score_a] || 0) + 1
      scoreDistribution[m.score_b] = (scoreDistribution[m.score_b] || 0) + 1

      // Head-to-head
      if (aId && bId) {
        if (!h2h.has(aId)) h2h.set(aId, new Map())
        if (!h2h.has(bId)) h2h.set(bId, new Map())

        const aVsB = h2h.get(aId)!.get(bId) || { wins: 0, losses: 0, draws: 0 }
        const bVsA = h2h.get(bId)!.get(aId) || { wins: 0, losses: 0, draws: 0 }

        if (m.score_a > m.score_b) {
          aVsB.wins++
          bVsA.losses++
        } else if (m.score_b > m.score_a) {
          aVsB.losses++
          bVsA.wins++
        } else {
          aVsB.draws++
          bVsA.draws++
        }

        h2h.get(aId)!.set(bId, aVsB)
        h2h.get(bId)!.set(aId, bVsA)
      }

      // Round stats
      const r = roundStats.get(m.tour) || { total: 0, avgScore: 0 }
      r.total++
      r.avgScore += m.score_a + m.score_b
      roundStats.set(m.tour, r)
    })

    // Compute streaks from sorted matches
    const sortedMatches = [...completed].sort((a, b) => a.tour - b.tour)
    const currentStreaks = new Map<string, number>()
    const bestStreaks = new Map<string, { name: string; streak: number }>()

    sortedMatches.forEach(m => {
      const aId = m.equipe_a?.id || m.equipe_a_id || ''
      const bId = m.equipe_b?.id || m.equipe_b_id || ''
      const aName = m.equipe_a?.name || ''
      const bName = m.equipe_b?.name || ''

      if (aId) {
        if (m.score_a > m.score_b) {
          const cur = (currentStreaks.get(aId) || 0) + 1
          currentStreaks.set(aId, cur)
          const best = bestStreaks.get(aId) || { name: aName, streak: 0 }
          if (cur > best.streak) best.streak = cur
          best.name = aName
          bestStreaks.set(aId, best)
        } else {
          currentStreaks.set(aId, 0)
          if (!bestStreaks.has(aId)) bestStreaks.set(aId, { name: aName, streak: 0 })
        }
      }
      if (bId) {
        if (m.score_b > m.score_a) {
          const cur = (currentStreaks.get(bId) || 0) + 1
          currentStreaks.set(bId, cur)
          const best = bestStreaks.get(bId) || { name: bName, streak: 0 }
          if (cur > best.streak) best.streak = cur
          best.name = bName
          bestStreaks.set(bId, best)
        } else {
          currentStreaks.set(bId, 0)
          if (!bestStreaks.has(bId)) bestStreaks.set(bId, { name: bName, streak: 0 })
        }
      }
    })

    // Best attack (avg points per match)
    const bestAttack = [...teamAttack.entries()]
      .map(([id, s]) => ({ id, name: s.name, avg: s.matches > 0 ? s.points / s.matches : 0, total: s.points }))
      .sort((a, b) => b.avg - a.avg)[0]

    // Best defense (lowest avg points conceded)
    const bestDefense = [...teamDefense.entries()]
      .filter(([, s]) => s.matches > 0)
      .map(([id, s]) => ({ id, name: s.name, avg: s.points / s.matches, total: s.points }))
      .sort((a, b) => a.avg - b.avg)[0]

    // Longest streak
    const longestStreak = [...bestStreaks.entries()]
      .sort((a, b) => b[1].streak - a[1].streak)[0]

    // Closest match (smallest margin)
    const closestMatch = [...completed]
      .filter(m => m.score_a !== m.score_b)
      .sort((a, b) => Math.abs(a.score_a - a.score_b) - Math.abs(b.score_a - b.score_b))[0]

    // Biggest blowout
    const biggestBlowout = [...completed]
      .sort((a, b) => Math.abs(b.score_a - b.score_b) - Math.abs(a.score_a - a.score_b))[0]

    // Average match score
    const totalScore = completed.reduce((acc, m) => acc + m.score_a + m.score_b, 0)
    const avgMatchScore = totalScore / completed.length

    // Finalize round stats
    roundStats.forEach((v) => {
      v.avgScore = v.total > 0 ? Math.round(v.avgScore / v.total) : 0
    })

    // Score distribution max for bar chart scaling
    const maxDistCount = Math.max(...Object.values(scoreDistribution), 1)

    return {
      totalMatches: completed.length,
      fannies,
      bestAttack,
      bestDefense,
      longestStreak: longestStreak ? longestStreak[1] : null,
      closestMatch,
      biggestBlowout,
      avgMatchScore,
      scoreDistribution,
      maxDistCount,
      h2h,
      roundStats,
      teamAttack
    }
  }, [matches, teams, maxPoints])

  if (!stats || stats.totalMatches === 0) {
    return (
      <div className="text-center py-12">
        <Chart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Aucun match terminé pour générer les statistiques avancées</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Highlight cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Fannies"
          value={stats.fannies.length.toString()}
          sub={`sur ${stats.totalMatches} matchs`}
          icon={<Lightning className="w-5 h-5" />}
          gradient="from-red-500 to-pink-600"
        />
        <StatCard
          label="Meilleure attaque"
          value={stats.bestAttack?.name || '-'}
          sub={`${stats.bestAttack ? stats.bestAttack.avg.toFixed(1) : '0'} pts/match`}
          icon={<Flag className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          label="Meilleure défense"
          value={stats.bestDefense?.name || '-'}
          sub={`${stats.bestDefense ? stats.bestDefense.avg.toFixed(1) : '0'} pts encaissés/match`}
          icon={<Medal className="w-5 h-5" />}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          label="Plus longue série"
          value={stats.longestStreak ? `${stats.longestStreak.streak} victoires` : '-'}
          sub={stats.longestStreak?.name || ''}
          icon={<Trophy className="w-5 h-5" />}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Score distribution */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Chart className="w-5 h-5 text-purple-500" />
          Distribution des scores
        </h3>
        <div className="flex items-end gap-1 h-32">
          {Array.from({ length: maxPoints + 1 }, (_, i) => i).map(score => {
            const count = stats.scoreDistribution[score] || 0
            const height = stats.maxDistCount > 0 ? (count / stats.maxDistCount) * 100 : 0
            return (
              <div key={score} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{count > 0 ? count : ''}</span>
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-sm transition-all"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span className="text-xs text-gray-600 font-medium">{score}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Score moyen par match : {stats.avgMatchScore.toFixed(1)} points</p>
      </div>

      {/* Notable matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.closestMatch && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Match le plus serré</h3>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">{stats.closestMatch.equipe_a?.name || 'Équipe A'}</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.closestMatch.score_a} - {stats.closestMatch.score_b}
              </span>
              <span className="font-bold text-gray-900">{stats.closestMatch.equipe_b?.name || 'Équipe B'}</span>
            </div>
          </div>
        )}
        {stats.biggestBlowout && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Plus grand écart</h3>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">{stats.biggestBlowout.equipe_a?.name || 'Équipe A'}</span>
              <span className="text-2xl font-bold text-red-500">
                {stats.biggestBlowout.score_a} - {stats.biggestBlowout.score_b}
              </span>
              <span className="font-bold text-gray-900">{stats.biggestBlowout.equipe_b?.name || 'Équipe B'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Classement attaque */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-green-500" />
          Classement par moyenne de points
        </h3>
        <div className="space-y-2">
          {[...stats.teamAttack.entries()]
            .map(([id, s]) => ({ id, name: s.name, avg: s.matches > 0 ? s.points / s.matches : 0, total: s.points, matches: s.matches }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 8)
            .map((team, i) => {
              const maxAvg = stats.bestAttack?.avg || 1
              return (
                <div key={team.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className="flex-1 font-medium text-gray-900 text-sm truncate">{team.name}</span>
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${(team.avg / maxAvg) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-20 text-right">{team.avg.toFixed(1)} pts/m</span>
                </div>
              )
            })}
        </div>
      </div>

      {/* Stats par tour */}
      {stats.roundStats.size > 1 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Évolution par tour
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...stats.roundStats.entries()].sort((a, b) => a[0] - b[0]).map(([tour, rs]) => (
              <div key={tour} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Tour {tour}</p>
                <p className="text-lg font-bold text-gray-900">{rs.total} matchs</p>
                <p className="text-xs text-gray-500">{rs.avgScore} pts moy.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, icon, gradient }: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-600">{label}</span>
        <div className={`p-1.5 sm:p-2 bg-gradient-to-br ${gradient} rounded-lg sm:rounded-xl text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-500 truncate">{sub}</p>
    </div>
  )
}
