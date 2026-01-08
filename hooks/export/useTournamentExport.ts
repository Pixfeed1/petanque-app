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
  format: 'doublette' | 'triplette'
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
  exportMatchSheetsPDF: () => Promise<void>
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

      // 🔧 FIX: Compter les matchs nuls (règle FIPJP: nul = 1 point)
      const draws = teamMatches.filter(m =>
        m.score_a === m.score_b
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
        draws,
        pointsFor,
        pointsAgainst,
        difference: pointsFor - pointsAgainst,
        // 🔧 FIX: Points FIPJP = victoires × 3 + nuls × 1
        points: victories * 3 + draws
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
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }
        stats.played++
        // 🔧 FIX: Gérer les matchs nuls (règle FIPJP)
        if (match.score_a > match.score_b) stats.victories++
        else if (match.score_a < match.score_b) stats.defeats++
        else stats.draws++
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
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }
        stats.played++
        // 🔧 FIX: Gérer les matchs nuls (règle FIPJP)
        if (match.score_b > match.score_a) stats.victories++
        else if (match.score_b < match.score_a) stats.defeats++
        else stats.draws++
        stats.pointsFor += match.score_b
        stats.pointsAgainst += match.score_a
        playerStats.set(player.id, stats)
      })
    })

    const individualRankings = Array.from(playerStats.values())
      .map(stats => ({
        ...stats,
        difference: stats.pointsFor - stats.pointsAgainst,
        // 🔧 FIX: Points FIPJP = victoires × 3 + nuls × 1
        points: stats.victories * 3 + stats.draws,
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
        const teamsJson = await teamsResponse.json()
        // 🔧 FIX: Vérifier que teamsData est un tableau avant .map()
        let teamsData = Array.isArray(teamsJson) ? teamsJson : teamsJson.equipes || []

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
        const matchesJson = await matchesResponse.json()
        // 🔧 FIX: Vérifier que matchesData est un tableau avant .map()
        const matchesData = Array.isArray(matchesJson) ? matchesJson : matchesJson.matches || []

        const matchesWithMenes = matchesData.map((match: Match) => ({
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
      pdf.text(`${modeText} - ${tournament.format === 'doublette' ? 'Doublette' : 'Triplette'}`, 105, 30, { align: 'center' })

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
        ['Format', tournament.format === 'doublette' ? 'Doublette' : 'Triplette'],
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
            m.score_a ?? '',
            m.score_b ?? '',
            sanitizeForExcel(m.equipe_b?.name),
            m.terrain ?? '',
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

  /**
   * Export feuilles de match PDF pour arbitres
   * Génère une feuille par match avec espaces pour scores
   */
  const exportMatchSheetsPDF = useCallback(async () => {
    if (!tournament || matches.length === 0) return
    setExporting(true)

    try {
      const pdf = new jsPDF()
      const maxPoints = tournament.settings.maxPoints || 13

      // Filtrer les matchs non terminés (ou tous si on veut imprimer l'historique)
      const matchesToPrint = matches.filter(m => m.status !== 'termine' && m.equipe_b)

      if (matchesToPrint.length === 0) {
        // Si tous les matchs sont terminés, imprimer tous les matchs
        matchesToPrint.push(...matches.filter(m => m.equipe_b))
      }

      matchesToPrint.forEach((match, index) => {
        if (index > 0) {
          pdf.addPage()
        }

        // En-tête vert
        pdf.setFillColor(74, 124, 89)
        pdf.rect(0, 0, 210, 35, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('FEUILLE DE MATCH', 105, 15, { align: 'center' })
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(cleanControlCharacters(tournament.name) || 'Tournoi', 105, 25, { align: 'center' })

        pdf.setTextColor(0, 0, 0)
        let yPos = 45

        // Infos du match
        pdf.setFillColor(240, 240, 240)
        pdf.rect(15, yPos - 5, 180, 25, 'F')
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')

        const matchInfo = []
        if (match.terrain) matchInfo.push(`Terrain ${match.terrain}`)
        if (match.poule) matchInfo.push(`Poule ${match.poule}`)
        if (match.type && match.type !== 'poule') {
          const typeLabels: { [key: string]: string } = {
            'huitieme': '1/8 Finale',
            'quart': '1/4 Finale',
            'demi': 'Demi-finale',
            'finale': 'FINALE',
            'petite_finale': 'Petite finale'
          }
          matchInfo.push(typeLabels[match.type] || match.type)
        }
        matchInfo.push(`Tour ${match.tour}`)

        pdf.text(matchInfo.join('  |  '), 105, yPos + 5, { align: 'center' })
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Premier a ${maxPoints} points`, 105, yPos + 15, { align: 'center' })

        yPos = 80

        // Équipe A
        pdf.setFillColor(220, 252, 231) // vert clair
        pdf.rect(15, yPos, 85, 35, 'F')
        pdf.setDrawColor(74, 124, 89)
        pdf.rect(15, yPos, 85, 35, 'S')
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0, 0, 0)
        pdf.text('EQUIPE A', 57.5, yPos + 10, { align: 'center' })
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        const teamAName = match.equipe_a?.name || 'Equipe A'
        pdf.text(cleanControlCharacters(teamAName).substring(0, 20), 57.5, yPos + 20, { align: 'center' })

        // Joueurs équipe A
        if (match.equipe_a?.players && match.equipe_a.players.length > 0) {
          const playersA = match.equipe_a.players.map((p: any) => p.name || p).join(', ')
          pdf.setFontSize(9)
          pdf.text(cleanControlCharacters(playersA).substring(0, 30), 57.5, yPos + 28, { align: 'center' })
        }

        // VS
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text('VS', 105, yPos + 20, { align: 'center' })

        // Équipe B
        pdf.setFillColor(254, 226, 226) // rouge clair
        pdf.rect(110, yPos, 85, 35, 'F')
        pdf.setDrawColor(220, 38, 38)
        pdf.rect(110, yPos, 85, 35, 'S')
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('EQUIPE B', 152.5, yPos + 10, { align: 'center' })
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        const teamBName = match.equipe_b?.name || 'Equipe B'
        pdf.text(cleanControlCharacters(teamBName).substring(0, 20), 152.5, yPos + 20, { align: 'center' })

        // Joueurs équipe B
        if (match.equipe_b?.players && match.equipe_b.players.length > 0) {
          const playersB = match.equipe_b.players.map((p: any) => p.name || p).join(', ')
          pdf.setFontSize(9)
          pdf.text(cleanControlCharacters(playersB).substring(0, 30), 152.5, yPos + 28, { align: 'center' })
        }

        yPos = 125

        // Tableau des mènes
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('SCORE PAR MENE', 105, yPos, { align: 'center' })
        yPos += 8

        // En-têtes du tableau
        // FIX: Largeur optimisée pour page A4 (210mm) avec marges confortables
        const colWidth = 12  // Colonnes compactes pour les scores (1-13)
        const startX = 15    // Marge gauche standard
        const nbMenes = 10
        // Calcul: 15 + 15 + (10*12) + 20 = 170mm → marge droite 40mm ✓

        pdf.setFillColor(74, 124, 89)
        pdf.rect(startX, yPos, 15, 10, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        pdf.text('Mene', startX + 7.5, yPos + 7, { align: 'center' })

        for (let i = 1; i <= nbMenes; i++) {
          pdf.setFillColor(74, 124, 89)
          pdf.rect(startX + 15 + (i - 1) * colWidth, yPos, colWidth, 10, 'F')
          pdf.text(i.toString(), startX + 15 + (i - 1) * colWidth + colWidth / 2, yPos + 7, { align: 'center' })
        }

        pdf.setFillColor(74, 124, 89)
        pdf.rect(startX + 15 + nbMenes * colWidth, yPos, 20, 10, 'F')
        pdf.text('TOTAL', startX + 15 + nbMenes * colWidth + 10, yPos + 7, { align: 'center' })

        pdf.setTextColor(0, 0, 0)
        yPos += 10

        // Ligne Équipe A
        pdf.setFillColor(220, 252, 231)
        pdf.rect(startX, yPos, 15, 12, 'F')
        pdf.setDrawColor(0, 0, 0)
        pdf.rect(startX, yPos, 15, 12, 'S')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Eq. A', startX + 7.5, yPos + 8, { align: 'center' })

        for (let i = 1; i <= nbMenes; i++) {
          pdf.rect(startX + 15 + (i - 1) * colWidth, yPos, colWidth, 12, 'S')
        }
        pdf.setFillColor(220, 252, 231)
        pdf.rect(startX + 15 + nbMenes * colWidth, yPos, 20, 12, 'F')
        pdf.rect(startX + 15 + nbMenes * colWidth, yPos, 20, 12, 'S')

        yPos += 12

        // Ligne Équipe B
        pdf.setFillColor(254, 226, 226)
        pdf.rect(startX, yPos, 15, 12, 'F')
        pdf.rect(startX, yPos, 15, 12, 'S')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Eq. B', startX + 7.5, yPos + 8, { align: 'center' })

        for (let i = 1; i <= nbMenes; i++) {
          pdf.rect(startX + 15 + (i - 1) * colWidth, yPos, colWidth, 12, 'S')
        }
        pdf.setFillColor(254, 226, 226)
        pdf.rect(startX + 15 + nbMenes * colWidth, yPos, 20, 12, 'F')
        pdf.rect(startX + 15 + nbMenes * colWidth, yPos, 20, 12, 'S')

        yPos += 25

        // Score final
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('SCORE FINAL', 105, yPos, { align: 'center' })
        yPos += 10

        // Grandes cases pour score final
        pdf.setFillColor(220, 252, 231)
        pdf.rect(40, yPos, 40, 25, 'F')
        pdf.setDrawColor(74, 124, 89)
        pdf.setLineWidth(1)
        pdf.rect(40, yPos, 40, 25, 'S')

        pdf.setFillColor(254, 226, 226)
        pdf.rect(130, yPos, 40, 25, 'F')
        pdf.setDrawColor(220, 38, 38)
        pdf.rect(130, yPos, 40, 25, 'S')

        pdf.setLineWidth(0.2)
        pdf.setDrawColor(0, 0, 0)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Eq. A', 60, yPos - 3, { align: 'center' })
        pdf.text('Eq. B', 150, yPos - 3, { align: 'center' })

        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text('-', 105, yPos + 17, { align: 'center' })

        yPos += 40

        // Vainqueur
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('VAINQUEUR :', 50, yPos)
        pdf.setDrawColor(0, 0, 0)
        pdf.line(85, yPos, 180, yPos)

        yPos += 15

        // Signatures
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Signature Eq. A:', 25, yPos)
        pdf.line(60, yPos, 100, yPos)
        pdf.text('Signature Eq. B:', 115, yPos)
        pdf.line(150, yPos, 190, yPos)

        yPos += 15
        pdf.text('Arbitre:', 25, yPos)
        pdf.line(45, yPos, 100, yPos)
        pdf.text('Date:', 115, yPos)
        pdf.line(130, yPos, 190, yPos)

        // Pied de page
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Match ${index + 1}/${matchesToPrint.length} - Genere le ${new Date().toLocaleDateString('fr-FR')}`, 105, 290, { align: 'center' })
      })

      pdf.save(`${tournament.name?.replace(/[^a-z0-9]/gi, '_')}_feuilles_match.pdf`)
    } catch (error) {
      console.error('Erreur export feuilles de match:', error)
    } finally {
      setExporting(false)
    }
  }, [tournament, matches])

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
    exportMatchSheetsPDF,
    handlePrint
  }
}

export default useTournamentExport
