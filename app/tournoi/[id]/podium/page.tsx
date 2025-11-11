'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import type { Match, Equipe, Joueur } from '@/lib/types'

// Icônes premium
const Icons = {
 trophy: (
   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
   </svg>
 ),
 crown: (
   <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
     <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.86-2h8.28l.5-3.5l-2.14-1.5L12 13l-2.5-4l-2.14 1.5l.5 3.5zM19 19H5v2h14v-2z"/>
   </svg>
 ),
 medal: (
   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
   </svg>
 ),
 star: (
   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
   </svg>
 ),
 sparkles: (
   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
   </svg>
 ),
 petanque: (
   <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
     <circle cx="32" cy="32" r="28" fill="url(#metalGradient)" stroke="currentColor" strokeWidth="2"/>
     <circle cx="26" cy="24" r="3" fill="white" opacity="0.8"/>
     <circle cx="36" cy="36" r="2" fill="currentColor" opacity="0.3"/>
     <defs>
       <radialGradient id="metalGradient">
         <stop offset="0%" stopColor="#a8b2c3"/>
         <stop offset="100%" stopColor="#8e9aaf"/>
       </radialGradient>
     </defs>
   </svg>
 ),
 share: (
   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9 9.032a3 3 0 00-4.516-3.89L8.39 17.89m0 0a3 3 0 004.516 3.89L17.684 19.89m0 0A3 3 0 1020.684 17l-4.516 2.09z" />
   </svg>
 ),
 download: (
   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
   </svg>
 ),
 loader: (
   <svg className="animate-spin h-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
   </svg>
 ),
 camera: (
   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
   </svg>
 )
}

interface Team {
 id: string
 name: string
 players?: Joueur[]
}

interface PodiumTeam {
 position: number
 team: Team
 score?: number
 stats?: {
   victories: number
   defeats: number
   pointsFor: number
   pointsAgainst: number
 }
}

interface TeamClassement {
 team: Equipe
 victories: number
 difference: number
 pointsFor: number
}

export default function PodiumPage() {
 const params = useParams()
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [tournament, setTournament] = useState<any>(null)
 const [podium, setPodium] = useState<PodiumTeam[]>([])
 const [showAnimation, setShowAnimation] = useState(false)
 const [animationStep, setAnimationStep] = useState(0)
 const [generatingCertificate, setGeneratingCertificate] = useState(false)

 useEffect(() => {
   if (params.id) {
     loadPodiumData()
   }
 }, [params.id])

 const loadPodiumData = async () => {
   try {
     // Charger le tournoi
     const tournamentResponse = await fetch(`/api/tournois/${params.id}`, {
       credentials: 'include'
     })
     if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
     const tournamentData = await tournamentResponse.json()
     setTournament(tournamentData)

     // Charger tous les matchs du tournoi
     const matchesResponse = await fetch(`/api/matches?tournoi_id=${params.id}`, {
       credentials: 'include'
     })
     if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
     const allMatches = await matchesResponse.json()

     // Trouver la finale et la petite finale
     const finaleData = allMatches.find((m: Match) => m.type === 'finale')
     const petiteFinaleData = allMatches.find((m: Match) => m.type === 'petite_finale')

     // Construire le podium
     const podiumData: PodiumTeam[] = []

     // Champion (1er)
     if (finaleData && finaleData.status === 'termine') {
       const champion = finaleData.score_a > finaleData.score_b
         ? finaleData.equipe_a
         : finaleData.equipe_b
       const finaliste = finaleData.score_a > finaleData.score_b
         ? finaleData.equipe_b
         : finaleData.equipe_a

       podiumData.push({
         position: 1,
         team: champion,
         score: Math.max(finaleData.score_a, finaleData.score_b)
       })

       podiumData.push({
         position: 2,
         team: finaliste,
         score: Math.min(finaleData.score_a, finaleData.score_b)
       })
     } else {
       // Fallback: Utiliser le classement général des poules
       const equipesResponse = await fetch(`/api/equipes?tournoi_id=${params.id}`, { credentials: 'include' })
       if (equipesResponse.ok) {
         const equipesData = await equipesResponse.json()
         const classement: TeamClassement[] = equipesData.map((team: Equipe) => {
           const teamMatches = allMatches.filter((m: Match) =>
             m.status === 'termine' && m.type === 'poule' &&
             (m.equipe_a_id === team.id || m.equipe_b_id === team.id)
           )
           let victories = 0, pointsFor = 0, pointsAgainst = 0
           teamMatches.forEach((m: Match) => {
             if (m.equipe_a_id === team.id) {
               if ((m.score_a ?? 0) > (m.score_b ?? 0)) victories++
               pointsFor += m.score_a || 0
               pointsAgainst += m.score_b || 0
             } else if (m.equipe_b_id === team.id) {
               if ((m.score_b ?? 0) > (m.score_a ?? 0)) victories++
               pointsFor += m.score_b || 0
               pointsAgainst += m.score_a || 0
             }
           })
           return { team, victories, difference: pointsFor - pointsAgainst, pointsFor }
         }).sort((a: TeamClassement, b: TeamClassement) => {
           // 1. Nombre de victoires (règle FIPJP)
           if (b.victories !== a.victories) return b.victories - a.victories

           // 2. Confrontation directe (règle FIPJP)
           const directMatch = allMatches.find((m: Match) =>
             m.status === 'termine' && m.type === 'poule' &&
             ((m.equipe_a_id === a.team.id && m.equipe_b_id === b.team.id) ||
              (m.equipe_a_id === b.team.id && m.equipe_b_id === a.team.id))
           )
           if (directMatch) {
             const aWon = (directMatch.equipe_a?.id === a.team.id && directMatch.score_a > directMatch.score_b) ||
                          (directMatch.equipe_b?.id === a.team.id && directMatch.score_b > directMatch.score_a)
             if (aWon) return -1 // a gagne
             else return 1 // b gagne
           }

           // 3. Différence de points (règle FIPJP)
           if (b.difference !== a.difference) return b.difference - a.difference

           // 4. Nombre de points marqués (règle FIPJP complète)
           return b.pointsFor - a.pointsFor
         })
         if (classement[0]) podiumData.push({ position: 1, team: classement[0].team, score: classement[0].pointsFor })
         if (classement[1]) podiumData.push({ position: 2, team: classement[1].team, score: classement[1].pointsFor })
         if (classement[2]) podiumData.push({ position: 3, team: classement[2].team, score: classement[2].pointsFor })
       }
     }

     // 3ème place (écrase le fallback si petite finale existe)
     if (petiteFinaleData && petiteFinaleData.status === 'termine') {
       const troisieme = petiteFinaleData.score_a > petiteFinaleData.score_b
         ? petiteFinaleData.equipe_a
         : petiteFinaleData.equipe_b
       const idx = podiumData.findIndex(p => p.position === 3)
       const newThird = { position: 3, team: troisieme, score: Math.max(petiteFinaleData.score_a, petiteFinaleData.score_b) }
       if (idx >= 0) podiumData[idx] = newThird
       else podiumData.push(newThird)
     }

     // Charger les stats complètes pour chaque équipe du podium
     for (const item of podiumData) {
       if (!item.team?.id) continue // Sécurité
       // Filtrer les matchs terminés pour cette équipe
       const matchesData = allMatches.filter((match: Match) =>
         match.status === 'termine' &&
         (match.equipe_a_id === item.team.id || match.equipe_b_id === item.team.id)
       )

       if (matchesData.length > 0) {
         const stats = {
           victories: 0,
           defeats: 0,
           pointsFor: 0,
           pointsAgainst: 0
         }

         matchesData.forEach((match: Match) => {
           if (match.equipe_a?.id === item.team.id) {
             if (match.score_a > match.score_b) stats.victories++
             else stats.defeats++
             stats.pointsFor += match.score_a
             stats.pointsAgainst += match.score_b
           } else if (match.equipe_b?.id === item.team.id) {
             if (match.score_b > match.score_a) stats.victories++
             else stats.defeats++
             stats.pointsFor += match.score_b
             stats.pointsAgainst += match.score_a
           }
         })

         item.stats = stats
       }
     }

     setPodium(podiumData)

     // Lancer l'animation après chargement
     setTimeout(() => {
       setShowAnimation(true)
       animatePodium()
     }, 500)

   } catch (error) {
     console.error('Erreur chargement podium:', error)
   } finally {
     setLoading(false)
   }
 }

 const animatePodium = () => {
   // Animation progressive du podium
   setTimeout(() => setAnimationStep(3), 300)  // 3ème
   setTimeout(() => setAnimationStep(2), 600)  // 2ème
   setTimeout(() => setAnimationStep(1), 900)  // 1er
   
   // Confettis pour le champion
   setTimeout(() => {
     fireConfetti()
   }, 1200)
 }

 const fireConfetti = () => {
   const duration = 5000
   const animationEnd = Date.now() + duration
   const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

   function randomInRange(min: number, max: number) {
     return Math.random() * (max - min) + min
   }

   const interval: NodeJS.Timeout = setInterval(function() {
     const timeLeft = animationEnd - Date.now()

     if (timeLeft <= 0) {
       return clearInterval(interval)
     }

     const particleCount = 50 * (timeLeft / duration)
     
     // Confettis depuis la gauche
     confetti({
       ...defaults,
       particleCount,
       origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
       colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3']
     })
     
     // Confettis depuis la droite
     confetti({
       ...defaults,
       particleCount,
       origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
       colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3']
     })
   }, 250)
 }

 const handleShare = async () => {
   const shareData = {
     title: `Podium - ${tournament?.name}`,
     text: `🏆 Champion: ${podium[0]?.team.name}\n🥈 Finaliste: ${podium[1]?.team.name}\n🥉 3ème: ${podium[2]?.team.name}`,
     url: window.location.href
   }

   try {
     if (navigator.share) {
       await navigator.share(shareData)
     } else {
       // Fallback : copier dans le presse-papier
       await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
       alert('Lien copié dans le presse-papier !')
     }
   } catch (error) {
     console.error('Erreur partage:', error)
   }
 }

 const generatePremiumCertificate = async (position: number, team: PodiumTeam) => {
   setGeneratingCertificate(true)
   
   // Créer un canvas haute résolution
   const canvas = document.createElement('canvas')
   const scale = 2 // Pour une meilleure qualité
   canvas.width = 1200 * scale
   canvas.height = 850 * scale
   const ctx = canvas.getContext('2d')
   
   if (!ctx) return

   // Mise à l'échelle pour la haute résolution
   ctx.scale(scale, scale)

   // 1. FOND PREMIUM avec gradient complexe
   const bgGradient = ctx.createLinearGradient(0, 0, 1200, 850)
   if (position === 1) {
     // Champion - Or
     bgGradient.addColorStop(0, '#fff9e6')
     bgGradient.addColorStop(0.5, '#fff4cc')
     bgGradient.addColorStop(1, '#ffecb3')
   } else if (position === 2) {
     // Finaliste - Argent
     bgGradient.addColorStop(0, '#f5f5f5')
     bgGradient.addColorStop(0.5, '#eeeeee')
     bgGradient.addColorStop(1, '#e0e0e0')
   } else {
     // 3ème - Bronze
     bgGradient.addColorStop(0, '#fff3e0')
     bgGradient.addColorStop(0.5, '#ffe0b2')
     bgGradient.addColorStop(1, '#ffcc80')
   }
   ctx.fillStyle = bgGradient
   ctx.fillRect(0, 0, 1200, 850)

   // 2. MOTIF DE FOND subtil
   ctx.globalAlpha = 0.05
   for (let i = 0; i < 20; i++) {
     for (let j = 0; j < 15; j++) {
       ctx.beginPath()
       ctx.arc(i * 60 + 30, j * 60 + 30, 20, 0, Math.PI * 2)
       ctx.strokeStyle = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'
       ctx.lineWidth = 1
       ctx.stroke()
     }
   }
   ctx.globalAlpha = 1

   // 3. DOUBLE BORDURE élégante
   // Bordure extérieure
   const borderGradient = ctx.createLinearGradient(0, 0, 1200, 850)
   if (position === 1) {
     borderGradient.addColorStop(0, '#FFD700')
     borderGradient.addColorStop(0.5, '#FFA500')
     borderGradient.addColorStop(1, '#FFD700')
   } else if (position === 2) {
     borderGradient.addColorStop(0, '#C0C0C0')
     borderGradient.addColorStop(0.5, '#E5E5E5')
     borderGradient.addColorStop(1, '#C0C0C0')
   } else {
     borderGradient.addColorStop(0, '#CD7F32')
     borderGradient.addColorStop(0.5, '#DDA15E')
     borderGradient.addColorStop(1, '#CD7F32')
   }
   ctx.strokeStyle = borderGradient
   ctx.lineWidth = 15
   ctx.strokeRect(20, 20, 1160, 810)
   
   // Bordure intérieure
   ctx.strokeStyle = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'
   ctx.lineWidth = 2
   ctx.strokeRect(40, 40, 1120, 770)

   // 4. COINS DÉCORATIFS
   const cornerSize = 60
   ctx.strokeStyle = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'
   ctx.lineWidth = 3
   // Coin haut gauche
   ctx.beginPath()
   ctx.moveTo(40, 100)
   ctx.lineTo(40, 40)
   ctx.lineTo(100, 40)
   ctx.stroke()
   // Coin haut droit
   ctx.beginPath()
   ctx.moveTo(1100, 40)
   ctx.lineTo(1160, 40)
   ctx.lineTo(1160, 100)
   ctx.stroke()
   // Coin bas gauche
   ctx.beginPath()
   ctx.moveTo(40, 750)
   ctx.lineTo(40, 810)
   ctx.lineTo(100, 810)
   ctx.stroke()
   // Coin bas droit
   ctx.beginPath()
   ctx.moveTo(1100, 810)
   ctx.lineTo(1160, 810)
   ctx.lineTo(1160, 750)
   ctx.stroke()

   // 5. LOGO PÉTANQUE stylisé
   ctx.save()
   ctx.translate(600, 150)
   // Boule principale
   const bouleGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 40)
   bouleGradient.addColorStop(0, '#e0e0e0')
   bouleGradient.addColorStop(0.5, '#a8a8a8')
   bouleGradient.addColorStop(1, '#707070')
   ctx.fillStyle = bouleGradient
   ctx.beginPath()
   ctx.arc(0, 0, 40, 0, Math.PI * 2)
   ctx.fill()
   // Reflet
   ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
   ctx.beginPath()
   ctx.arc(-10, -10, 12, 0, Math.PI * 2)
   ctx.fill()
   // Cochonnet
   ctx.fillStyle = '#FFD700'
   ctx.beginPath()
   ctx.arc(25, 25, 8, 0, Math.PI * 2)
   ctx.fill()
   ctx.restore()

   // 6. TITRE PRINCIPAL avec ombre
   ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
   ctx.shadowBlur = 4
   ctx.shadowOffsetY = 3
   ctx.fillStyle = '#1a1a1a'
   ctx.font = 'bold 72px "Inter", "Helvetica", sans-serif'
   ctx.textAlign = 'center'
   ctx.fillText('CERTIFICAT', 600, 250)
   ctx.shadowBlur = 0

   // Sous-titre
   ctx.font = '36px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#4a4a4a'
   ctx.fillText('DE RÉUSSITE', 600, 300)

   // 7. POSITION avec médaille
   const positionY = 380
   // Médaille emoji grand format
   ctx.font = '80px serif'
   ctx.fillText(position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉', 600, positionY)
   
   // Texte position
   ctx.font = 'bold 48px "Inter", "Helvetica", sans-serif'
   const positionText = position === 1 ? 'CHAMPION' : position === 2 ? 'FINALISTE' : 'TROISIÈME PLACE'
   const textGradient = ctx.createLinearGradient(400, positionY, 800, positionY)
   if (position === 1) {
     textGradient.addColorStop(0, '#FFD700')
     textGradient.addColorStop(0.5, '#FFA500')
     textGradient.addColorStop(1, '#FFD700')
   } else if (position === 2) {
     textGradient.addColorStop(0, '#A0A0A0')
     textGradient.addColorStop(0.5, '#C0C0C0')
     textGradient.addColorStop(1, '#A0A0A0')
   } else {
     textGradient.addColorStop(0, '#CD7F32')
     textGradient.addColorStop(0.5, '#DDA15E')
     textGradient.addColorStop(1, '#CD7F32')
   }
   ctx.fillStyle = textGradient
   ctx.fillText(positionText, 600, positionY + 70)

   // 8. NOM DE L'ÉQUIPE dans un cadre
   ctx.strokeStyle = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'
   ctx.lineWidth = 3
   ctx.strokeRect(200, 480, 800, 80)
   
   ctx.font = 'bold 42px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#1a1a1a'
   ctx.fillText(team.team.name.toUpperCase(), 600, 530)

   // 9. DÉTAILS DU TOURNOI
   ctx.font = '28px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#4a4a4a'
   ctx.fillText(tournament?.name || 'Tournoi de Pétanque', 600, 610)
   
   // Lieu si disponible
   if (tournament?.settings?.location) {
     ctx.font = '24px "Inter", "Helvetica", sans-serif'
     ctx.fillStyle = '#6a6a6a'
     ctx.fillText(`📍 ${tournament.settings.location}`, 600, 645)
   }

   // Date avec format français
   ctx.font = '24px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#6a6a6a'
   const date = new Date(tournament?.settings?.date || new Date())
   const formattedDate = date.toLocaleDateString('fr-FR', { 
     weekday: 'long',
     year: 'numeric', 
     month: 'long', 
     day: 'numeric' 
   })
   ctx.fillText(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), 600, 680)

   // 10. STATISTIQUES si disponibles
   if (team.stats) {
     // Cadre pour les stats
     ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
     ctx.lineWidth = 1
     ctx.strokeRect(350, 710, 500, 60)
     
     ctx.font = '20px "Inter", "Helvetica", sans-serif'
     ctx.fillStyle = '#6a6a6a'
     const statsText = `${team.stats.victories} victoires • ${team.stats.pointsFor} points marqués • Différence: +${team.stats.pointsFor - team.stats.pointsAgainst}`
     ctx.fillText(statsText, 600, 745)
   }

   // 11. SIGNATURE et validation
   ctx.font = 'italic 20px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#8a8a8a'
   ctx.fillText('Le Comité d\'Organisation', 600, 800)

   // Ligne de signature
   ctx.beginPath()
   ctx.moveTo(450, 810)
   ctx.lineTo(750, 810)
   ctx.strokeStyle = '#cccccc'
   ctx.lineWidth = 1
   ctx.stroke()

   // 12. Filigrane subtil
   ctx.save()
   ctx.globalAlpha = 0.03
   ctx.translate(600, 425)
   ctx.rotate(-Math.PI / 8)
   ctx.font = 'bold 120px "Inter", "Helvetica", sans-serif'
   ctx.fillStyle = '#000000'
   ctx.textAlign = 'center'
   ctx.fillText('PÉTANQUE', 0, 0)
   ctx.restore()

   // Convertir et télécharger
   canvas.toBlob(blob => {
     if (blob) {
       const url = URL.createObjectURL(blob)
       const a = document.createElement('a')
       a.href = url
       a.download = `certificat-${position === 1 ? 'champion' : position === 2 ? 'finaliste' : '3eme'}-${team.team.name.replace(/\s/g, '-').toLowerCase()}.png`
       a.click()
       URL.revokeObjectURL(url)
     }
     setGeneratingCertificate(false)
   }, 'image/png', 1.0) // Qualité maximale
 }

 if (loading) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
       <div className="text-center">
         <div className="relative">
           <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
           <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
             {Icons.loader}
             <p className="mt-4 text-lg font-medium text-gray-600">Préparation du podium...</p>
           </div>
         </div>
       </div>
     </div>
   )
 }

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 overflow-hidden">
     {/* Particules animées dorées */}
     <div className="fixed inset-0 overflow-hidden pointer-events-none">
       <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-yellow-300 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
       <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-orange-300 to-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
       <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
     </div>

     {/* Header */}
     <header className="relative z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
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
               <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl text-white shadow-lg">
                 {Icons.trophy}
               </div>
               <div>
                 <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                   Podium Final
                 </h1>
                 <p className="text-sm text-gray-500">{tournament?.name}</p>
               </div>
             </div>
           </div>

           <div className="flex items-center space-x-3">
             <button
               onClick={handleShare}
               className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
             >
               {Icons.share}
             </button>
           </div>
         </div>
       </div>
     </header>

     {/* Titre animé */}
     <div className="text-center mt-12 mb-8">
       <div className={`transition-all duration-1000 transform ${showAnimation ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
         <h2 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center">
           <span className="mr-4">🎉</span>
           Félicitations aux vainqueurs !
           <span className="ml-4">🎉</span>
         </h2>
         <p className="text-xl text-gray-600">
           {tournament?.name} - {new Date(tournament?.settings?.date).toLocaleDateString('fr-FR')}
         </p>
       </div>
     </div>

     {/* Podium */}
     <div className="max-w-6xl mx-auto px-4 pb-20">
       <div className="flex items-end justify-center space-x-4 md:space-x-8">
         
         {/* 2ème place */}
         <div className={`flex-1 max-w-xs transition-all duration-1000 transform ${
           animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
         }`}>
           <div className="text-center mb-4">
             <div className="inline-block">
               <div className="text-6xl mb-2">🥈</div>
               <h3 className="text-2xl font-bold text-gray-700">2ème</h3>
             </div>
           </div>
           
           <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-3xl p-6 shadow-2xl h-64 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-gray-300/20 to-transparent"></div>
             <div className="relative">
               <h4 className="text-xl font-bold text-gray-900 mb-2">{podium[1]?.team.name}</h4>
               
               <div className="space-y-2 mb-4">
                 {podium[1]?.team.players?.map((player: any, i: number) => (
                   <p key={i} className="text-sm text-gray-700">
                     {player?.name}
                   </p>
                 ))}
               </div>

               {podium[1]?.stats && (
                 <div className="bg-white/50 rounded-lg p-3 text-xs">
                   <p>{podium[1].stats.victories} victoires</p>
                   <p>+{podium[1].stats.pointsFor - podium[1].stats.pointsAgainst} pts</p>
                 </div>
               )}

               <button
                 onClick={() => generatePremiumCertificate(2, podium[1])}
                 disabled={generatingCertificate}
                 className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:shadow-lg transition-all text-sm flex items-center justify-center disabled:opacity-50"
               >
                 {generatingCertificate ? Icons.loader : Icons.download}
                 <span className="ml-2">Certificat</span>
               </button>
             </div>
           </div>
         </div>

         {/* 1ère place */}
         <div className={`flex-1 max-w-xs transition-all duration-1000 transform ${
           animationStep >= 1 ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-20 opacity-0 scale-100'
         }`}>
           <div className="text-center mb-4">
             <div className="inline-block relative">
               <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
               <div className="relative">
                 <div className="text-7xl mb-2 animate-bounce">🥇</div>
                 <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                   CHAMPION
                 </h3>
               </div>
             </div>
           </div>
           
           <div className="bg-gradient-to-br from-yellow-300 via-amber-300 to-yellow-400 rounded-t-3xl p-6 shadow-2xl h-80 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent"></div>
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
             
             <div className="relative">
               <div className="absolute -top-2 -right-2 text-yellow-600 animate-spin-slow">
                 {Icons.crown}
               </div>
               
               <h4 className="text-2xl font-bold text-gray-900 mb-3">{podium[0]?.team.name}</h4>
               
               <div className="space-y-2 mb-4">
                 {podium[0]?.team.players?.map((player: any, i: number) => (
                   <p key={i} className="text-sm font-medium text-gray-800">
                     ⭐ {player?.name}
                   </p>
                 ))}
               </div>

               {podium[0]?.stats && (
                 <div className="bg-white/60 rounded-lg p-4 backdrop-blur">
                   <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>
                       <p className="font-bold text-green-700">{podium[0].stats.victories}</p>
                       <p className="text-xs text-gray-600">Victoires</p>
                     </div>
                     <div>
                       <p className="font-bold text-blue-700">+{podium[0].stats.pointsFor - podium[0].stats.pointsAgainst}</p>
                       <p className="text-xs text-gray-600">Différence</p>
                     </div>
                   </div>
                 </div>
               )}

               <button
                 onClick={() => generatePremiumCertificate(1, podium[0])}
                 disabled={generatingCertificate}
                 className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg hover:shadow-lg transition-all font-bold flex items-center justify-center disabled:opacity-50"
               >
                 {generatingCertificate ? Icons.loader : Icons.download}
                 <span className="ml-2">Certificat Champion</span>
               </button>
             </div>
           </div>
         </div>

         {/* 3ème place */}
         <div className={`flex-1 max-w-xs transition-all duration-1000 transform ${
           animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
         }`}>
           <div className="text-center mb-4">
             <div className="inline-block">
               <div className="text-6xl mb-2">🥉</div>
               <h3 className="text-2xl font-bold text-orange-700">3ème</h3>
             </div>
           </div>
           
           <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-3xl p-6 shadow-2xl h-56 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-orange-300/20 to-transparent"></div>
             <div className="relative">
               <h4 className="text-xl font-bold text-gray-900 mb-2">{podium[2]?.team.name || 'Non déterminé'}</h4>
               
               {podium[2] && (
                 <>
                   <div className="space-y-2 mb-4">
                     {podium[2]?.team.players?.map((player: any, i: number) => (
                       <p key={i} className="text-sm text-gray-700">
                         {player?.name}
                       </p>
                     ))}
                   </div>

                   {podium[2]?.stats && (
                     <div className="bg-white/50 rounded-lg p-3 text-xs">
                       <p>{podium[2].stats.victories} victoires</p>
                       <p>+{podium[2].stats.pointsFor - podium[2].stats.pointsAgainst} pts</p>
                     </div>
                   )}

                   <button
                     onClick={() => generatePremiumCertificate(3, podium[2])}
                     disabled={generatingCertificate}
                     className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all text-sm flex items-center justify-center disabled:opacity-50"
                   >
                     {generatingCertificate ? Icons.loader : Icons.download}
                     <span className="ml-2">Certificat</span>
                   </button>
                 </>
               )}
             </div>
           </div>
         </div>
       </div>

       {/* Base du podium */}
       <div className="flex justify-center -mt-1">
         <div className="w-full max-w-4xl h-20 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-3xl shadow-2xl"></div>
       </div>
     </div>

     {/* Actions finales */}
     <div className="max-w-4xl mx-auto px-4 pb-12">
       <div className="bg-white rounded-3xl shadow-xl p-8">
         <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
           Tournoi terminé avec succès !
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <button
             onClick={() => router.push(`/export/${params.id}`)}
             className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
           >
             {Icons.download}
             <span>Exporter les résultats</span>
           </button>

           <button
             onClick={() => window.print()}
             className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
           >
             {Icons.camera}
             <span>Imprimer le podium</span>
           </button>

           <button
             onClick={() => router.push('/tournoi/nouveau')}
             className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
           >
             {Icons.sparkles}
             <span>Nouveau tournoi</span>
           </button>
         </div>

         <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
           <p className="text-center text-gray-700">
             <span className="font-bold">Merci d'avoir utilisé notre application !</span><br />
             N'oubliez pas de partager les résultats avec tous les participants.
           </p>
         </div>
       </div>
     </div>

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
       
       .animate-blob {
         animation: blob 7s infinite;
       }
       
       .animation-delay-2000 {
         animation-delay: 2s;
       }
       
       .animation-delay-4000 {
         animation-delay: 4s;
       }

       .animate-spin-slow {
         animation: spin-slow 10s linear infinite;
       }

       @media print {
         header, .no-print {
           display: none !important;
         }
       }
     `}</style>
   </div>
 )
}