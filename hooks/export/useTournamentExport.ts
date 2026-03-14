/**
 * Hook pour l'export de tournoi
 * - Chargement des données
 * - Calcul des classements (équipes/individuel)
 * - Export PDF et Excel
 */

import { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { sanitizeForExcel, cleanControlCharacters } from '@/lib/sanitize'
import type { Joueur, Equipe, EquipeJoueur } from '@/lib/types'

interface Tournament {
  id: string
  name: string
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  status: string
  settings: {
    date: string
    time: string
    location?: string
    terrains: number
    maxPoints: number
    pouleSize?: number
  }
}

interface Team {
  id: string
  name: string
  players: Joueur[]
}

interface Match {
  id: string
  equipe_a: Team
  equipe_b: Team
  score_a: number
  score_b: number
  status: string
  terrain?: number
  tour: number
  type?: 'poule' | 'elimination' | 'finale'
  poule?: string
  manches_json?: Array<{ points: number; team: 'A' | 'B' }>
  menes?: Array<{ points: number; team: 'A' | 'B' }>
}

interface Player {
  id: string
  name: string
  gender?: 'H' | 'F'
  email?: string
  phone?: string
}

export interface ExportOptions {
  includeMatches: boolean
  includeRankings: boolean
  includeStatistics: boolean
  includePoules: boolean
  includePhaseFinale: boolean
  includeMenes: boolean
  includeContacts: boolean
}

interface UseTournamentExportProps {
  tournoiId: string | string[] | undefined
}

interface UseTournamentExportReturn {
  // State
  loading: boolean
  exporting: boolean
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  players: Player[]
  rankings: any[]
  exportOptions: ExportOptions

  // Actions
  setExportOptions: (options: ExportOptions) => void
  exportToPDF: () => Promise<void>
  exportToExcel: () => Promise<void>
  handlePrint: () => void
}

export function useTournamentExport({ tournoiId }: UseTournamentExportProps): UseTournamentExportReturn {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMatches: true,
    includeRankings: true,
    includeStatistics: true,
    includePoules: true,
    includePhaseFinale: true,
    includeMenes: false,
    includeContacts: false
  })

  /**
   * Calcul du classement par équipe (règles FIPJP)
   */
  const calculateTeamRankings = useCallback((matches: Match[], teams: Team[]) => {
    const teamRankings = teams.map(team => {
      const teamMatches = matches.filter(m =>
        (m.equipe_a?.id === team.id || m.equipe_b?.id === team.id) &&
        m.status === 'termine'
      )

      const victories = teamMatches.filter(m =>
        (m.equipe_a?.id === team.id && m.score_a > m.score_b) ||
        (m.equipe_b?.id === team.id && m.score_b > m.score_a)
      ).length

      const defeats = teamMatches.filter(m =>
        (m.equipe_a?.id === team.id && m.score_a < m.score_b) ||
        (m.equipe_b?.id === team.id && m.score_b < m.score_a)
      ).length

      const pointsFor = teamMatches.reduce((acc, m) =>
        acc + (m.equipe_a?.id === team.id ? m.score_a : m.score_b), 0
      )

      const pointsAgainst = teamMatches.reduce((acc, m) =>
        acc + (m.equipe_a?.id === team.id ? m.score_b : m.score_a), 0
      )

      return {
        ...team,
        played: teamMatches.length,
        victories,
        defeats,
        pointsFor,
        pointsAgainst,
        difference: pointsFor - pointsAgainst,
        points: victories * 3
      }
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.difference !== a.difference) return b.difference - a.difference

      // Confrontation directe
      const directMatch = matches.find(m =>
        m.status === 'termine' &&
        ((m.equipe_a?.id === a.id && m.equipe_b?.id === b.id) ||
         (m.equipe_a?.id === b.id && m.equipe_b?.id === a.id))
      )
      if (directMatch) {
        const aWon = (directMatch.equipe_a?.id === a.id && directMatch.score_a > directMatch.score_b) ||
                     (directMatch.equipe_b?.id === a.id && directMatch.score_b > directMatch.score_a)
        if (aWon) return -1
        return 1
      }

      return b.pointsFor - a.pointsFor
    })

    setRankings(teamRankings)
  }, [])

  /**
   * Calcul du classement individuel (mêlée tournante)
   */
  const calculateIndividualRankings = useCallback((matches: Match[]) => {
    const playerStats = new Map()

    matches.filter(m => m.status === 'termine').forEach(match => {
      // Joueurs équipe A
      match.equipe_a?.players?.forEach((player: Joueur) => {
        if (!player) return
        const stats = playerStats.get(player.id) || {
          ...player,
          played: 0,
          victories: 0,
          defeats: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }
        stats.played++
        if (match.score_a > match.score_b) stats.victories++
        else stats.defeats++
        stats.pointsFor += match.score_a
        stats.pointsAgainst += match.score_b
        playerStats.set(player.id, stats)
      })

      // Joueurs équipe B
      match.equipe_b?.players?.forEach((player: Joueur) => {
        if (!player) return
        const stats = playerStats.get(player.id) || {
          ...player,
          played: 0,
          victories: 0,
          defeats: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }
        stats.played++
        if (match.score_b > match.score_a) stats.victories++
        else stats.defeats++
        stats.pointsFor += match.score_b
        stats.pointsAgainst += match.score_a
        playerStats.set(player.id, stats)
      })
    })

    const individualRankings = Array.from(playerStats.values())
      .map(stats => ({
        ...stats,
        difference: stats.pointsFor - stats.pointsAgainst,
        points: stats.victories * 3,
        winRate: stats.played > 0 ? (stats.victories / stats.played * 100).toFixed(1) : 0
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.difference !== a.difference) return b.difference - a.difference
        return b.pointsFor - a.pointsFor
      })

    setRankings(individualRankings)
  }, [])

  /**
   * Charge les données du tournoi
   */
  const loadTournamentData = useCallback(async () => {
    if (!tournoiId) return

    try {
      // Charger le tournoi
      const tournamentResponse = await fetch(`/api/tournois/${tournoiId}`, {
        credentials: 'include'
      })
      if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
      const tournamentData = await tournamentResponse.json()

      if (tournamentData) {
        setTournament(tournamentData)

        // Charger les équipes
        const teamsResponse = await fetch(`/api/equipes?tournoi_id=${tournoiId}`, {
          credentials: 'include'
        })
        if (!teamsResponse.ok) throw new Error('Erreur chargement équipes')
        let teamsData = await teamsResponse.json()

        // Enrichir avec les joueurs
        teamsData = await Promise.all(
          teamsData.map(async (team: Equipe) => {
            if (team.joueur_ids && team.joueur_ids.length > 0) {
              const enrichedResponse = await fetch(`/api/equipes/${team.id}`, {
                credentials: 'include'
              })
              if (enrichedResponse.ok) {
                const enrichedTeam = await enrichedResponse.json()
                if (enrichedTeam.joueurs) {
                  (team as any).equipes_joueurs = enrichedTeam.joueurs.map((j: Joueur) => ({
                    joueur: j,
                    role: 'joueur'
                  }))
                }
              }
            }
            return team
          })
        )

        setTeams(teamsData || [])

        // Extraire joueurs uniques
        const allPlayers = new Set<Player>()
        teamsData?.forEach((team: Equipe) => {
          (team as any).equipes_joueurs?.forEach((ej: EquipeJoueur) => {
            if (ej.joueur) allPlayers.add(ej.joueur)
          })
        })
        setPlayers(Array.from(allPlayers))

        // Charger les matchs
        const matchesResponse = await fetch(`/api/matches?tournoi_id=${tournoiId}`, {
          credentials: 'include'
        })
        if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
        const matchesData = await matchesResponse.json()

        const matchesWithMenes = matchesData?.map((match: Match) => ({
          ...match,
          menes: match.manches_json || []
        })) || []

        setMatches(matchesWithMenes)

        // Calculer classement
        if (tournamentData.mode === 'melee_tournante') {
          calculateIndividualRankings(matchesWithMenes)
        } else {
          calculateTeamRankings(matchesWithMenes, teamsData)
        }
      }
    } catch (error) {
      console.error('Erreur chargement donnees:', error)
    } finally {
      setLoading(false)
    }
  }, [tournoiId, calculateTeamRankings, calculateIndividualRankings])

  useEffect(() => {
    loadTournamentData()
  }, [loadTournamentData])

  /**
   * Export PDF
   */
  const exportToPDF = useCallback(async () => {
    if (!tournament) return
    setExporting(true)

    try {
      const pdf = new jsPDF()
      let yPosition = 20

      // En-tête
      pdf.setFillColor(74, 124, 89)
      pdf.rect(0, 0, 210, 40, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text(cleanControlCharacters(tournament.name) || 'Tournoi', 105, 20, { align: 'center' })

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const modeText = tournament.mode === 'choisi' ? 'Equipes choisies' :
                       tournament.mode === 'melee_fixe' ? 'Melee fixe' : 'Melee tournante'
      pdf.text(`${modeText} - ${tournament.format === 'tete_a_tete' ? 'Tete-a-tete' : tournament.format === 'doublette' ? 'Doublette' : 'Triplette'}`, 105, 30, { align: 'center' })

      pdf.setTextColor(0, 0, 0)
      yPosition = 50

      // Informations
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Informations du tournoi', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Date: ${new Date(tournament.settings.date || '').toLocaleDateString('fr-FR')}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Heure: ${tournament.settings.time}`, 20, yPosition)
      yPosition += 6
      if (tournament.settings.location) {
        pdf.text(`Lieu: ${tournament.settings.location}`, 20, yPosition)
        yPosition += 6
      }
      pdf.text(`Terrains: ${tournament.settings.terrains}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Points pour gagner: ${tournament.settings.maxPoints || 13}`, 20, yPosition)
      yPosition += 15

      // Participants
      if (tournament.mode === 'melee_tournante') {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Participants', 20, yPosition)
        yPosition += 10

        const playerRows = players.map((player, index) => [
          (index + 1).toString(),
          player.name,
          player.gender === 'H' ? 'Homme' : 'Femme',
          player.email || '-',
          player.phone || '-'
        ])

        autoTable(pdf, {
          startY: yPosition,
          head: [['#', 'Nom', 'Genre', 'Email', 'Telephone']],
          body: playerRows,
          theme: 'grid',
          headStyles: { fillColor: [74, 124, 89] }
        })

        yPosition = (pdf as any).lastAutoTable.finalY + 15
      } else {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Equipes', 20, yPosition)
        yPosition += 10

        teams.forEach((team, index) => {
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${index + 1}. ${team.name}`, 20, yPosition)
          yPosition += 6

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          team.players?.forEach((player: Joueur) => {
            const gender = player.gender === 'H' ? '(H)' : '(F)'
            pdf.text(`   ${gender} ${player.name}`, 25, yPosition)
            yPosition += 5
          })
          yPosition += 3

          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
        })
      }

      // Matchs
      if (exportOptions.includeMatches && exportOptions.includePoules) {
        pdf.addPage()
        yPosition = 20

        const poules = [...new Set(matches.filter(m => m.poule).map(m => m.poule))]

        poules.forEach(poule => {
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`Poule ${poule}`, 20, yPosition)
          yPosition += 10

          const pouleMatches = matches.filter(m => m.poule === poule)
          const matchRows = pouleMatches.map(match => [
            `Tour ${match.tour}`,
            match.equipe_a?.name || '',
            match.score_a?.toString() || '-',
            match.score_b?.toString() || '-',
            match.equipe_b?.name || '',
            match.terrain ? `T${match.terrain}` : '-',
            match.status === 'termine' ? 'Termine' : match.status === 'en_cours' ? 'En cours' : 'A jouer'
          ])

          autoTable(pdf, {
            startY: yPosition,
            head: [['Tour', 'Equipe A', 'Score', 'Score', 'Equipe B', 'Terrain', 'Statut']],
            body: matchRows,
            theme: 'striped',
            headStyles: { fillColor: [74, 124, 89] }
          })

          yPosition = (pdf as any).lastAutoTable.finalY + 15

          if (yPosition > 250) {
            pdf.addPage()
            yPosition = 20
          }
        })
      }

      // Classement
      if (exportOptions.includeRankings && rankings.length > 0) {
        pdf.addPage()
        yPosition = 20

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text(tournament.mode === 'melee_tournante' ? 'Classement Individuel Final' : 'Classement Final', 105, yPosition, { align: 'center' })
        yPosition += 15

        const rankingRows = rankings.map((item, index) => {
          const medal = index === 0 ? '1er' : index === 1 ? '2e' : index === 2 ? '3e' : `${index + 1}`
          if (tournament.mode === 'melee_tournante') {
            return [
              medal,
              item.name,
              item.gender === 'H' ? 'H' : 'F',
              item.played?.toString() || '0',
              item.victories?.toString() || '0',
              item.defeats?.toString() || '0',
              `${item.pointsFor || 0}`,
              `${item.pointsAgainst || 0}`,
              `${item.difference > 0 ? '+' : ''}${item.difference || 0}`,
              `${item.winRate}%`
            ]
          }
          return [
            medal,
            item.name,
            item.played?.toString() || '0',
            item.victories?.toString() || '0',
            item.defeats?.toString() || '0',
            `${item.pointsFor || 0}`,
            `${item.pointsAgainst || 0}`,
            `${item.difference > 0 ? '+' : ''}${item.difference || 0}`,
            item.points?.toString() || '0'
          ]
        })

        const headers = tournament.mode === 'melee_tournante'
          ? [['Pos', 'Joueur', 'G', 'J', 'V', 'D', 'Pour', 'Contre', '+/-', 'Taux']]
          : [['Pos', 'Equipe', 'J', 'V', 'D', 'Pour', 'Contre', '+/-', 'Points']]

        autoTable(pdf, {
          startY: yPosition,
          head: headers,
          body: rankingRows,
          theme: 'grid',
          headStyles: { fillColor: [74, 124, 89] }
        })
      }

      // Pied de page
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' })
        pdf.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 20, 290)
      }

      pdf.save(`${tournament.name?.replace(/[^a-z0-9]/gi, '_')}_export.pdf`)
    } catch (error) {
      console.error('Erreur export PDF:', error)
    } finally {
      setExporting(false)
    }
  }, [tournament, players, teams, matches, rankings, exportOptions])

  /**
   * Export Excel
   */
  const exportToExcel = useCallback(async () => {
    if (!tournament) return
    setExporting(true)

    try {
      const wb = XLSX.utils.book_new()

      // Feuille Informations
      const infoData = [
        ['Tournoi', tournament.name],
        ['Mode', tournament.mode === 'choisi' ? 'Equipes choisies' :
                 tournament.mode === 'melee_fixe' ? 'Melee fixe' : 'Melee tournante'],
        ['Format', tournament.format === 'tete_a_tete' ? 'Tete-a-tete' : tournament.format === 'doublette' ? 'Doublette' : 'Triplette'],
        ['Date', new Date(tournament.settings.date || '').toLocaleDateString('fr-FR')],
        ['Heure', tournament.settings.time],
        ['Lieu', tournament.settings.location || '-'],
        ['Terrains', tournament.settings.terrains],
        ['Points pour gagner', tournament.settings.maxPoints || 13],
        [''],
        ['Statistiques'],
        ['Total matchs', matches.length],
        ['Matchs joues', matches.filter(m => m.status === 'termine').length],
        ['Total equipes', teams.length],
        ['Total joueurs', players.length]
      ]
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations')

      // Feuille Joueurs/Équipes
      if (tournament.mode === 'melee_tournante') {
        const playersData = [
          ['Nom', 'Genre', 'Email', 'Telephone'],
          ...players.map(p => [
            sanitizeForExcel(p.name),
            p.gender === 'H' ? 'Homme' : 'Femme',
            sanitizeForExcel(p.email),
            sanitizeForExcel(p.phone)
          ])
        ]
        const wsPlayers = XLSX.utils.aoa_to_sheet(playersData)
        XLSX.utils.book_append_sheet(wb, wsPlayers, 'Joueurs')
      } else {
        const teamsData = [
          ['Equipe', 'Joueur', 'Genre', 'Role'],
          ...teams.flatMap(team =>
            team.players?.map((p: Joueur) => [
              sanitizeForExcel(team.name),
              sanitizeForExcel(p.name),
              p.gender === 'H' ? 'Homme' : 'Femme',
              (p as any).role === 'capitaine' ? 'Capitaine' : 'Joueur'
            ]) || []
          )
        ]
        const wsTeams = XLSX.utils.aoa_to_sheet(teamsData)
        XLSX.utils.book_append_sheet(wb, wsTeams, 'Equipes')
      }

      // Feuille Matchs
      if (exportOptions.includeMatches) {
        const matchesData = [
          ['Tour', 'Type', 'Poule', 'Equipe A', 'Score A', 'Score B', 'Equipe B', 'Terrain', 'Statut'],
          ...matches.map(m => [
            m.tour,
            m.type === 'poule' ? 'Poule' : m.type === 'finale' ? 'Finale' : 'Elimination',
            sanitizeForExcel(m.poule),
            sanitizeForExcel(m.equipe_a?.name),
            m.score_a || '',
            m.score_b || '',
            sanitizeForExcel(m.equipe_b?.name),
            m.terrain || '',
            m.status === 'termine' ? 'Termine' : m.status === 'en_cours' ? 'En cours' : 'A jouer'
          ])
        ]
        const wsMatches = XLSX.utils.aoa_to_sheet(matchesData)
        XLSX.utils.book_append_sheet(wb, wsMatches, 'Matchs')
      }

      // Feuille Classement
      if (exportOptions.includeRankings) {
        if (tournament.mode === 'melee_tournante') {
          const rankingData = [
            ['Position', 'Joueur', 'Genre', 'Joues', 'Victoires', 'Defaites', 'Points Pour', 'Points Contre', 'Difference', 'Taux Victoire', 'Points'],
            ...rankings.map((player, index) => [
              index + 1,
              sanitizeForExcel(player.name),
              player.gender === 'H' ? 'Homme' : 'Femme',
              player.played || 0,
              player.victories || 0,
              player.defeats || 0,
              player.pointsFor || 0,
              player.pointsAgainst || 0,
              player.difference || 0,
              `${player.winRate}%`,
              player.points || 0
            ])
          ]
          const wsRanking = XLSX.utils.aoa_to_sheet(rankingData)
          XLSX.utils.book_append_sheet(wb, wsRanking, 'Classement Individuel')
        } else {
          const rankingData = [
            ['Position', 'Equipe', 'Joues', 'Victoires', 'Defaites', 'Points Pour', 'Points Contre', 'Difference', 'Points'],
            ...rankings.map((team, index) => [
              index + 1,
              sanitizeForExcel(team.name),
              team.played || 0,
              team.victories || 0,
              team.defeats || 0,
              team.pointsFor || 0,
              team.pointsAgainst || 0,
              team.difference || 0,
              team.points || 0
            ])
          ]
          const wsRanking = XLSX.utils.aoa_to_sheet(rankingData)
          XLSX.utils.book_append_sheet(wb, wsRanking, 'Classement')
        }
      }

      XLSX.writeFile(wb, `${tournament.name?.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`)
    } catch (error) {
      console.error('Erreur export Excel:', error)
    } finally {
      setExporting(false)
    }
  }, [tournament, players, teams, matches, rankings, exportOptions])

  /**
   * Impression
   */
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return {
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
  }
}

export default useTournamentExport
