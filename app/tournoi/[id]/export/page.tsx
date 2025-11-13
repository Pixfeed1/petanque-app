'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Equipe, Joueur, EquipeJoueur } from '@/lib/types'
import { sanitizeForExcel, cleanControlCharacters } from '@/lib/sanitize'
import { Download, Trophy, Users, Calendar, Loader, Flag, Chart, Petanque, Medal, Check, Grid, Settings } from '@/components/Icons'

// Icônes premium
const Icons = {
 download: <Download className="w-6 h-6" />,
 pdf: <Download className="w-8 h-8" />,
 excel: <Chart className="w-8 h-8" />,
 printer: <Download className="w-8 h-8" />,
 trophy: <Trophy className="w-6 h-6" />,
 users: <Users className="w-6 h-6" />,
 calendar: <Calendar className="w-6 h-6" />,
 loader: <Loader className="h-6 w-6" />,
 flag: <Flag className="w-6 h-6" />,
 chart: <Chart className="w-6 h-6" />,
 petanque: <Petanque className="w-8 h-8" />,
 medal: <Medal className="w-8 h-8" />,
 check: <Check className="w-5 h-5" />,
 grid: <Grid className="w-6 h-6" />,
 settings: <Settings className="w-5 h-5" />
}

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
   meleeRotation?: 'par_tour' | 'par_match'
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
 manches_json?: Array<{ points: number, team: 'A' | 'B' }>
 menes?: Array<{ points: number, team: 'A' | 'B' }>
}

interface Player {
 id: string
 name: string
 gender?: 'H' | 'F'
 email?: string
 phone?: string
}

export default function ExportTournamentPage() {
 const params = useParams()
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [exporting, setExporting] = useState(false)
 const [tournament, setTournament] = useState<Tournament | null>(null)
 const [teams, setTeams] = useState<Team[]>([])
 const [matches, setMatches] = useState<Match[]>([])
 const [players, setPlayers] = useState<Player[]>([])
 const [rankings, setRankings] = useState<any[]>([])
 const [exportOptions, setExportOptions] = useState({
   includeMatches: true,
   includeRankings: true,
   includeStatistics: true,
   includePoules: true,
   includePhaseFinale: true,
   includeMenes: false,
   includeContacts: false
 })

 useEffect(() => {
   loadTournamentData()
 }, [params.id])

 const loadTournamentData = async () => {
   try {
     // Charger le tournoi
     const tournamentResponse = await fetch(`/api/tournois/${params.id}`, {
       credentials: 'include'
     })
     if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
     const tournamentData = await tournamentResponse.json()

     if (tournamentData) {
       setTournament(tournamentData)

       // Charger les équipes
       const teamsResponse = await fetch(`/api/equipes?tournoi_id=${params.id}`, {
         credentials: 'include'
       })
       if (!teamsResponse.ok) throw new Error('Erreur chargement équipes')
       let teamsData = await teamsResponse.json()

       // Enrichir chaque équipe avec les joueurs
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

       // Extraire tous les joueurs uniques
       const allPlayers = new Set<Player>()
       teamsData?.forEach((team: Equipe) => {
         (team as any).equipes_joueurs?.forEach((ej: EquipeJoueur) => {
           if (ej.joueur) {
             allPlayers.add(ej.joueur)
           }
         })
       })
       setPlayers(Array.from(allPlayers))

       // Charger les matchs
       const matchesResponse = await fetch(`/api/matches?tournoi_id=${params.id}`, {
         credentials: 'include'
       })
       if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
       const matchesData = await matchesResponse.json()

       // Transformer manches_json en menes pour cohérence
       const matchesWithMenes = matchesData?.map((match: Match) => ({
         ...match,
         menes: match.manches_json || []
       })) || []

       setMatches(matchesWithMenes)

       // Calculer le classement
       if (tournamentData.mode === 'melee_tournante') {
         // Classement individuel pour mêlée tournante
         calculateIndividualRankings(matchesWithMenes, teamsData)
       } else {
         // Classement par équipe
         calculateTeamRankings(matchesWithMenes, teamsData)
       }
     }
   } catch (error) {
     console.error('Erreur chargement données:', error)
   } finally {
     setLoading(false)
   }
 }

 const calculateTeamRankings = (matches: Match[], teams: Team[]) => {
   const rankings = teams.map(team => {
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
     // 1. Nombre de points (victoires x3) - règle FIPJP
     if (b.points !== a.points) return b.points - a.points

     // 2. Confrontation directe (règle FIPJP)
     const directMatch = matches.find(m =>
       m.status === 'termine' &&
       ((m.equipe_a?.id === a.id && m.equipe_b?.id === b.id) ||
        (m.equipe_a?.id === b.id && m.equipe_b?.id === a.id))
     )
     if (directMatch) {
       const aWon = (directMatch.equipe_a?.id === a.id && directMatch.score_a > directMatch.score_b) ||
                    (directMatch.equipe_b?.id === a.id && directMatch.score_b > directMatch.score_a)
       if (aWon) return -1 // a gagne
       else return 1 // b gagne
     }

     // 3. Différence de points (règle FIPJP)
     if (b.difference !== a.difference) return b.difference - a.difference

     // 4. Points marqués (règle FIPJP)
     return b.pointsFor - a.pointsFor
   })

   setRankings(rankings)
 }

 const calculateIndividualRankings = (matches: Match[], teams: Team[]) => {
   // Pour mêlée tournante : calcul par joueur
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
       if (match.score_a > match.score_b) {
         stats.victories++
       } else {
         stats.defeats++
       }
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
       if (match.score_b > match.score_a) {
         stats.victories++
       } else {
         stats.defeats++
       }
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
       // Classement individuel pour mêlée tournante (règle FIPJP)
       if (b.points !== a.points) return b.points - a.points
       if (b.difference !== a.difference) return b.difference - a.difference
       return b.pointsFor - a.pointsFor
     })

   setRankings(individualRankings)
 }

 const exportToPDF = async () => {
   setExporting(true)
   
   try {
     const pdf = new jsPDF()
     let yPosition = 20

     // En-tête avec logo pétanque
     pdf.setFillColor(74, 124, 89)
     pdf.rect(0, 0, 210, 40, 'F')

     pdf.setTextColor(255, 255, 255)
     pdf.setFontSize(24)
     pdf.setFont('helvetica', 'bold')
     // ✅ Nettoyage des caractères de contrôle pour PDF
     pdf.text(cleanControlCharacters(tournament?.name) || 'Tournoi', 105, 20, { align: 'center' })

     pdf.setFontSize(12)
     pdf.setFont('helvetica', 'normal')
     const modeText = tournament?.mode === 'choisi' ? 'Équipes choisies' :
                      tournament?.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante'
     pdf.text(`${modeText} - ${tournament?.format === 'doublette' ? 'Doublette' : 'Triplette'}`, 105, 30, { align: 'center' })

     pdf.setTextColor(0, 0, 0)
     yPosition = 50

     // Informations générales
     pdf.setFontSize(14)
     pdf.setFont('helvetica', 'bold')
     pdf.text('Informations du tournoi', 20, yPosition)
     yPosition += 10

     pdf.setFontSize(10)
     pdf.setFont('helvetica', 'normal')
     pdf.text(`Date: ${new Date(tournament?.settings.date || '').toLocaleDateString('fr-FR')}`, 20, yPosition)
     yPosition += 6
     pdf.text(`Heure: ${tournament?.settings.time}`, 20, yPosition)
     yPosition += 6
     if (tournament?.settings.location) {
       pdf.text(`Lieu: ${tournament.settings.location}`, 20, yPosition)
       yPosition += 6
     }
     pdf.text(`Terrains: ${tournament?.settings.terrains}`, 20, yPosition)
     yPosition += 6
     pdf.text(`Points pour gagner: ${tournament?.settings.maxPoints || 13}`, 20, yPosition)
     yPosition += 15

     // Participants
     if (tournament?.mode === 'melee_tournante') {
       // Liste des joueurs pour mêlée tournante
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
         head: [['#', 'Nom', 'Genre', 'Email', 'Téléphone']],
         body: playerRows,
         theme: 'grid',
         headStyles: { fillColor: [74, 124, 89] }
       })

       yPosition = (pdf as any).lastAutoTable.finalY + 15
     } else {
       // Liste des équipes
       pdf.setFontSize(14)
       pdf.setFont('helvetica', 'bold')
       pdf.text('Équipes', 20, yPosition)
       yPosition += 10

       teams.forEach((team, index) => {
         pdf.setFontSize(11)
         pdf.setFont('helvetica', 'bold')
         pdf.text(`${index + 1}. ${team.name}`, 20, yPosition)
         yPosition += 6

         pdf.setFontSize(10)
         pdf.setFont('helvetica', 'normal')
         team.players?.forEach((player: Joueur) => {
           const role = (player as any).role === 'capitaine' ? ' (C)' : ''
           const gender = player.gender === 'H' ? '♂' : '♀'
           pdf.text(`   ${gender} ${player.name}${role}`, 25, yPosition)
           yPosition += 5
         })
         yPosition += 3

         if (yPosition > 270) {
           pdf.addPage()
           yPosition = 20
         }
       })
     }

     // Nouvelle page pour les matchs
     if (exportOptions.includeMatches) {
       pdf.addPage()
       yPosition = 20

       // Matchs par poule
       if (exportOptions.includePoules) {
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
             match.status === 'termine' ? 'Terminé' : match.status === 'en_cours' ? 'En cours' : 'À jouer'
           ])

           autoTable(pdf, {
             startY: yPosition,
             head: [['Tour', 'Équipe A', 'Score', 'Score', 'Équipe B', 'Terrain', 'Statut']],
             body: matchRows,
             theme: 'striped',
             headStyles: { fillColor: [74, 124, 89] },
             columnStyles: {
               2: { halign: 'center' },
               3: { halign: 'center' },
               5: { halign: 'center' }
             }
           })

           yPosition = (pdf as any).lastAutoTable.finalY + 15
           
           if (yPosition > 250) {
             pdf.addPage()
             yPosition = 20
           }
         })
       }

       // Phases finales
       if (exportOptions.includePhaseFinale) {
         const finaleMatches = matches.filter(m => m.type === 'elimination' || m.type === 'finale')
         
         if (finaleMatches.length > 0) {
           pdf.setFontSize(14)
           pdf.setFont('helvetica', 'bold')
           pdf.text('Phases finales', 20, yPosition)
           yPosition += 10

           const finaleRows = finaleMatches.map(match => {
             const phase = match.type === 'finale' ? 'Finale' : 
                          match.tour === 4 ? '1/2 finale' :
                          match.tour === 3 ? '1/4 finale' : '1/8 finale'
             return [
               phase,
               match.equipe_a?.name || '',
               match.score_a?.toString() || '-',
               match.score_b?.toString() || '-',
               match.equipe_b?.name || '',
               match.status === 'termine' ? 'Terminé' : 'À jouer'
             ]
           })

           autoTable(pdf, {
             startY: yPosition,
             head: [['Phase', 'Équipe A', 'Score', 'Score', 'Équipe B', 'Statut']],
             body: finaleRows,
             theme: 'striped',
             headStyles: { fillColor: [255, 152, 0] }
           })

           yPosition = (pdf as any).lastAutoTable.finalY + 15
         }
       }
     }

     // Classement final
     if (exportOptions.includeRankings && rankings.length > 0) {
       pdf.addPage()
       yPosition = 20

       pdf.setFontSize(16)
       pdf.setFont('helvetica', 'bold')
       pdf.text(tournament?.mode === 'melee_tournante' ? 'Classement Individuel Final' : 'Classement Final', 105, yPosition, { align: 'center' })
       yPosition += 15

       if (tournament?.mode === 'melee_tournante') {
         // Classement individuel
         const rankingRows = rankings.map((player, index) => {
           const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`
           return [
             medal,
             player.name,
             player.gender === 'H' ? '♂' : '♀',
             player.played?.toString() || '0',
             player.victories?.toString() || '0',
             player.defeats?.toString() || '0',
             `${player.pointsFor || 0}`,
             `${player.pointsAgainst || 0}`,
             `${player.difference > 0 ? '+' : ''}${player.difference || 0}`,
             `${player.winRate}%`
           ]
         })

         autoTable(pdf, {
           startY: yPosition,
           head: [['Pos', 'Joueur', 'G', 'J', 'V', 'D', 'Pour', 'Contre', '+/-', 'Taux']],
           body: rankingRows,
           theme: 'grid',
           headStyles: { fillColor: [74, 124, 89] },
           columnStyles: {
             0: { halign: 'center', fontStyle: 'bold' },
             2: { halign: 'center' },
             3: { halign: 'center' },
             4: { halign: 'center' },
             5: { halign: 'center' },
             6: { halign: 'center' },
             7: { halign: 'center' },
             8: { halign: 'center' },
             9: { halign: 'center' }
           }
         })
       } else {
         // Classement par équipe
         const rankingRows = rankings.map((team, index) => {
           const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`
           return [
             medal,
             team.name,
             team.played?.toString() || '0',
             team.victories?.toString() || '0',
             team.defeats?.toString() || '0',
             `${team.pointsFor || 0}`,
             `${team.pointsAgainst || 0}`,
             `${team.difference > 0 ? '+' : ''}${team.difference || 0}`,
             team.points?.toString() || '0'
           ]
         })

         autoTable(pdf, {
           startY: yPosition,
           head: [['Pos', 'Équipe', 'J', 'V', 'D', 'Pour', 'Contre', '+/-', 'Points']],
           body: rankingRows,
           theme: 'grid',
           headStyles: { fillColor: [74, 124, 89] },
           columnStyles: {
             0: { halign: 'center', fontStyle: 'bold' },
             2: { halign: 'center' },
             3: { halign: 'center' },
             4: { halign: 'center' },
             5: { halign: 'center' },
             6: { halign: 'center' },
             7: { halign: 'center' },
             8: { halign: 'center', fontStyle: 'bold' }
           }
         })
       }
     }

     // Statistiques
     if (exportOptions.includeStatistics) {
       yPosition = (pdf as any).lastAutoTable.finalY + 20

       pdf.setFontSize(14)
       pdf.setFont('helvetica', 'bold')
       pdf.text('Statistiques du tournoi', 20, yPosition)
       yPosition += 10

       const totalMatches = matches.length
       const playedMatches = matches.filter(m => m.status === 'termine').length
       const totalPoints = matches.reduce((acc, m) => acc + (m.score_a || 0) + (m.score_b || 0), 0)
       const avgPoints = playedMatches > 0 ? (totalPoints / playedMatches).toFixed(1) : 0
       const maxScore = Math.max(...matches.map(m => Math.max(m.score_a || 0, m.score_b || 0)))
       const fannyMatches = matches.filter(m => 
         m.status === 'termine' && (m.score_a === 0 || m.score_b === 0)
       ).length

       pdf.setFontSize(10)
       pdf.setFont('helvetica', 'normal')
       pdf.text(`Matchs joués: ${playedMatches} / ${totalMatches}`, 20, yPosition)
       yPosition += 6
       pdf.text(`Points totaux marqués: ${totalPoints}`, 20, yPosition)
       yPosition += 6
       pdf.text(`Moyenne de points par match: ${avgPoints}`, 20, yPosition)
       yPosition += 6
       pdf.text(`Plus gros score: ${maxScore} points`, 20, yPosition)
       yPosition += 6
       if (fannyMatches > 0) {
         pdf.text(`Matchs avec fanny (13-0): ${fannyMatches}`, 20, yPosition)
       }
     }

     // Pied de page
     const pageCount = pdf.getNumberOfPages()
     for (let i = 1; i <= pageCount; i++) {
       pdf.setPage(i)
       pdf.setFontSize(8)
       pdf.setTextColor(128, 128, 128)
       pdf.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' })
       pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 290)
     }

     // Télécharger
     pdf.save(`${tournament?.name?.replace(/[^a-z0-9]/gi, '_')}_export.pdf`)
   } catch (error) {
     console.error('Erreur export PDF:', error)
   } finally {
     setExporting(false)
   }
 }

 const exportToExcel = async () => {
   setExporting(true)

   try {
     const wb = XLSX.utils.book_new()

     // Feuille Informations
     const infoData = [
       ['Tournoi', tournament?.name],
       ['Mode', tournament?.mode === 'choisi' ? 'Équipes choisies' : 
                tournament?.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante'],
       ['Format', tournament?.format === 'doublette' ? 'Doublette' : 'Triplette'],
       ['Date', new Date(tournament?.settings.date || '').toLocaleDateString('fr-FR')],
       ['Heure', tournament?.settings.time],
       ['Lieu', tournament?.settings.location || '-'],
       ['Terrains', tournament?.settings.terrains],
       ['Points pour gagner', tournament?.settings.maxPoints || 13],
       [''],
       ['Statistiques'],
       ['Total matchs', matches.length],
       ['Matchs joués', matches.filter(m => m.status === 'termine').length],
       ['Total équipes', teams.length],
       ['Total joueurs', players.length]
     ]
     const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
     XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations')

     // Feuille Joueurs/Équipes
     if (tournament?.mode === 'melee_tournante') {
       // Export joueurs pour mêlée tournante
       const playersData = [
         ['Nom', 'Genre', 'Email', 'Téléphone'],
         ...players.map(p => [
           sanitizeForExcel(p.name),  // ✅ Protection CSV Formula Injection
           p.gender === 'H' ? 'Homme' : 'Femme',
           sanitizeForExcel(p.email),  // ✅ Protection CSV Formula Injection
           sanitizeForExcel(p.phone)   // ✅ Protection CSV Formula Injection
         ])
       ]
       const wsPlayers = XLSX.utils.aoa_to_sheet(playersData)
       XLSX.utils.book_append_sheet(wb, wsPlayers, 'Joueurs')
     } else {
       // Export équipes
       const teamsData = [
         ['Équipe', 'Joueur', 'Genre', 'Rôle'],
         ...teams.flatMap(team =>
           team.players?.map((p: Joueur) => [
             sanitizeForExcel(team.name),  // ✅ Protection CSV Formula Injection
             sanitizeForExcel(p.name),     // ✅ Protection CSV Formula Injection
             p.gender === 'H' ? 'Homme' : 'Femme',
             (p as any).role === 'capitaine' ? 'Capitaine' : 'Joueur'
           ]) || []
         )
       ]
       const wsTeams = XLSX.utils.aoa_to_sheet(teamsData)
       XLSX.utils.book_append_sheet(wb, wsTeams, 'Équipes')
     }

     // Feuille Matchs
     if (exportOptions.includeMatches) {
       const matchesData = [
         ['Tour', 'Type', 'Poule', 'Équipe A', 'Score A', 'Score B', 'Équipe B', 'Terrain', 'Statut'],
         ...matches.map(m => [
           m.tour,
           m.type === 'poule' ? 'Poule' : m.type === 'finale' ? 'Finale' : 'Élimination',
           sanitizeForExcel(m.poule),          // ✅ Protection CSV Formula Injection
           sanitizeForExcel(m.equipe_a?.name), // ✅ Protection CSV Formula Injection
           m.score_a || '',
           m.score_b || '',
           sanitizeForExcel(m.equipe_b?.name), // ✅ Protection CSV Formula Injection
           m.terrain || '',
           m.status === 'termine' ? 'Terminé' : m.status === 'en_cours' ? 'En cours' : 'À jouer'
         ])
       ]
       const wsMatches = XLSX.utils.aoa_to_sheet(matchesData)
       XLSX.utils.book_append_sheet(wb, wsMatches, 'Matchs')
     }

     // Feuille Classement
     if (exportOptions.includeRankings) {
       if (tournament?.mode === 'melee_tournante') {
         // Classement individuel
         const rankingData = [
           ['Position', 'Joueur', 'Genre', 'Joués', 'Victoires', 'Défaites', 'Points Pour', 'Points Contre', 'Différence', 'Taux Victoire', 'Points'],
           ...rankings.map((player, index) => [
             index + 1,
             sanitizeForExcel(player.name), // ✅ Protection CSV Formula Injection
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
         // Classement par équipe
         const rankingData = [
           ['Position', 'Équipe', 'Joués', 'Victoires', 'Défaites', 'Points Pour', 'Points Contre', 'Différence', 'Points'],
           ...rankings.map((team, index) => [
             index + 1,
             sanitizeForExcel(team.name), // ✅ Protection CSV Formula Injection
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

     // Feuille Mènes détaillées
     if (exportOptions.includeMenes) {
       const menesData = [
         ['Match', 'Mène #', 'Points', 'Équipe'],
         ...matches.flatMap(m => 
           m.menes?.map((mene, index) => [
             `${m.equipe_a?.name} vs ${m.equipe_b?.name}`,
             index + 1,
             mene.points,
             mene.team === 'A' ? m.equipe_a?.name : m.equipe_b?.name
           ]) || []
         )
       ]
       const wsMenes = XLSX.utils.aoa_to_sheet(menesData)
       XLSX.utils.book_append_sheet(wb, wsMenes, 'Mènes')
     }

     // Télécharger
     XLSX.writeFile(wb, `${tournament?.name?.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`)
   } catch (error) {
     console.error('Erreur export Excel:', error)
   } finally {
     setExporting(false)
   }
 }

 const handlePrint = () => {
   window.print()
 }

 if (loading) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
       <div className="text-center">
         <div className="relative">
           <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
           <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
             {Icons.loader}
             <p className="mt-4 text-lg font-medium text-gray-600">Chargement des données...</p>
           </div>
         </div>
       </div>
     </div>
   )
 }

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
     {/* Header */}
     <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center h-20">
           <div className="flex items-center space-x-4">
             <button 
               onClick={() => router.push(`/tournoi/${params.id}`)}
               className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all"
             >
               ← <span className="font-medium">Retour au tournoi</span>
             </button>
             
             <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
             
             <div className="flex items-center space-x-3">
               <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
                 {Icons.download}
               </div>
               <div>
                 <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                   Export du tournoi
                 </h1>
                 <p className="text-sm text-gray-500">{tournament?.name}</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </header>

     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Options d'export */}
         <div className="lg:col-span-1">
           <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
               {Icons.settings}
               <span className="ml-2">Options d'export</span>
             </h2>

             <div className="space-y-3">
               {[
                 { key: 'includeMatches', label: 'Inclure les matchs' },
                 { key: 'includeRankings', label: tournament?.mode === 'melee_tournante' ? 'Inclure classement individuel' : 'Inclure le classement' },
                 { key: 'includeStatistics', label: 'Inclure les statistiques' },
                 { key: 'includePoules', label: 'Inclure les poules' },
                 { key: 'includePhaseFinale', label: 'Inclure phases finales' },
                 { key: 'includeMenes', label: 'Inclure détail des mènes' },
                 { key: 'includeContacts', label: 'Inclure contacts joueurs' }
               ].map(option => (
                 <label key={option.key} className="flex items-center space-x-3 cursor-pointer group">
                   <input
                     type="checkbox"
                     checked={exportOptions[option.key as keyof typeof exportOptions]}
                     onChange={(e) => setExportOptions({
                       ...exportOptions,
                       [option.key]: e.target.checked
                     })}
                     className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                   />
                   <span className="text-gray-700 group-hover:text-gray-900">{option.label}</span>
                 </label>
               ))}
             </div>
           </div>
         </div>

         {/* Aperçu et actions */}
         <div className="lg:col-span-2 space-y-6">
           {/* Résumé du tournoi */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
               {Icons.petanque}
               <span className="ml-2">Résumé du tournoi</span>
             </h2>

             <div className="grid grid-cols-2 gap-4">
               {[
                 { 
                   label: 'Mode', 
                   value: tournament?.mode === 'choisi' ? 'Équipes choisies' :
                          tournament?.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante',
                   icon: Icons.users 
                 },
                 { 
                   label: 'Format', 
                   value: tournament?.format === 'doublette' ? 'Doublette' : 'Triplette',
                   icon: Icons.petanque 
                 },
                 { 
                   label: tournament?.mode === 'melee_tournante' ? 'Joueurs' : 'Équipes', 
                   value: tournament?.mode === 'melee_tournante' ? players.length : teams.length,
                   icon: Icons.flag 
                 },
                 { 
                   label: 'Matchs joués', 
                   value: `${matches.filter(m => m.status === 'termine').length}/${matches.length}`,
                   icon: Icons.chart 
                 }
               ].map((stat, index) => (
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

           {/* Top 3 du classement */}
           {rankings.length > 0 && (
             <div className="bg-white rounded-2xl shadow-lg p-6">
               <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                 {Icons.trophy}
                 <span className="ml-2">
                   {tournament?.mode === 'melee_tournante' ? 'Top 3 Joueurs' : 'Top 3 Équipes'}
                 </span>
               </h2>

               <div className="space-y-3">
                 {rankings.slice(0, 3).map((item, index) => (
                   <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${
                     index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' :
                     index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
                     'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
                   }`}>
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
           )}

           {/* Actions d'export */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Formats d'export disponibles</h2>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button
                 onClick={exportToPDF}
                 disabled={exporting}
                 className="group relative p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
               >
                 <div className="text-red-600 mb-3">{Icons.pdf}</div>
                 <h3 className="font-bold text-gray-900 mb-1">Export PDF</h3>
                 <p className="text-sm text-gray-600">Document complet prêt à imprimer</p>
                 {exporting && (
                   <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                     {Icons.loader}
                   </div>
                 )}
               </button>

               <button
                 onClick={exportToExcel}
                 disabled={exporting}
                 className="group relative p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
               >
                 <div className="text-green-600 mb-3">{Icons.excel}</div>
                 <h3 className="font-bold text-gray-900 mb-1">Export Excel</h3>
                 <p className="text-sm text-gray-600">Tableaux pour analyses</p>
                 {exporting && (
                   <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                     {Icons.loader}
                   </div>
                 )}
               </button>

               <button
                 onClick={handlePrint}
                 className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105"
               >
                 <div className="text-blue-600 mb-3">{Icons.printer}</div>
                 <h3 className="font-bold text-gray-900 mb-1">Imprimer</h3>
                 <p className="text-sm text-gray-600">Impression directe</p>
               </button>
             </div>
           </div>
         </div>
       </div>
     </div>

     <style jsx>{`
       @media print {
         body {
           font-family: Arial, sans-serif;
         }
         
         .no-print {
           display: none !important;
         }
         
         .print-break {
           page-break-after: always;
         }
       }
     `}</style>
   </div>
 )
}