'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

// Icônes premium
const Icons = {
 trophy: (
   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
   </svg>
 ),
 medal: (
   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
   </svg>
 ),
 petanque: (
   <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
 crown: (
   <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
     <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.86-2h8.28l.5-3.5l-2.14-1.5L12 13l-2.5-4l-2.14 1.5l.5 3.5zM19 19H5v2h14v-2z"/>
   </svg>
 ),
 arrow: (
   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
   </svg>
 ),
 loader: (
   <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
   </svg>
 ),
 flag: (
   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
   </svg>
 ),
 users: (
   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
   </svg>
 ),
 play: (
   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
   </svg>
 )
}

interface Team {
 id: string
 name: string
 players?: any[]
}

interface Match {
 id: string
 equipe_a: Team
 equipe_b: Team
 score_a: number
 score_b: number
 status: 'a_jouer' | 'en_cours' | 'termine'
 terrain?: number
 type: 'poule' | 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale'
 round?: string
}

interface Tournament {
 id: string
 name: string
 settings: {
   consolante?: boolean
 }
}

// Composant pour un match dans l'arbre
const BracketMatch = ({ 
 match, 
 position, 
 isLeft = true,
 onUpdateScore 
}: { 
 match?: Match | null, 
 position: string,
 isLeft?: boolean,
 onUpdateScore?: (matchId: string) => void 
}) => {
 const router = useRouter()
 
 if (!match) {
   return (
     <div className={`bracket-match empty ${position}`}>
       <div className="match-card bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 opacity-50">
         <div className="text-center text-gray-400">
           <p className="text-sm">En attente</p>
           <p className="text-xs mt-1">Qualifié des poules</p>
         </div>
       </div>
     </div>
   )
 }

 const winner = match.status === 'termine' 
   ? (match.score_a > match.score_b ? 'A' : 'B')
   : null

 return (
   <div className={`bracket-match ${position} ${isLeft ? 'left' : 'right'}`}>
     <div className={`match-card relative bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:scale-105 ${
       match.status === 'en_cours' ? 'ring-2 ring-orange-500 animate-pulse' : ''
     }`}>
       {/* Badge statut */}
       <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
         match.status === 'termine' ? 'bg-gray-100 text-gray-700' :
         match.status === 'en_cours' ? 'bg-orange-100 text-orange-700' :
         'bg-yellow-100 text-yellow-700'
       }`}>
         {match.status === 'termine' ? 'Terminé' :
          match.status === 'en_cours' ? 'En cours' : 'À jouer'}
       </div>

       {/* Équipes */}
       <div className="p-4">
         {/* Équipe A */}
         <div className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
           winner === 'A' 
             ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500' 
             : match.status === 'termine' && winner !== 'A'
             ? 'opacity-50'
             : 'bg-gray-50'
         }`}>
           <div className="flex items-center">
             {winner === 'A' && (
               <div className="text-green-600 mr-2 animate-bounce">
                 {Icons.trophy}
               </div>
             )}
             <div>
               <p className="font-bold text-gray-900">{match.equipe_a?.name || 'TBD'}</p>
               <p className="text-xs text-gray-500">
                 {match.equipe_a?.players?.length || 0} joueurs
               </p>
             </div>
           </div>
           {match.status !== 'a_jouer' && (
             <span className="text-2xl font-bold text-gray-900">{match.score_a}</span>
           )}
         </div>

         {/* Équipe B */}
         <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
           winner === 'B' 
             ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500' 
             : match.status === 'termine' && winner !== 'B'
             ? 'opacity-50'
             : 'bg-gray-50'
         }`}>
           <div className="flex items-center">
             {winner === 'B' && (
               <div className="text-green-600 mr-2 animate-bounce">
                 {Icons.trophy}
               </div>
             )}
             <div>
               <p className="font-bold text-gray-900">{match.equipe_b?.name || 'TBD'}</p>
               <p className="text-xs text-gray-500">
                 {match.equipe_b?.players?.length || 0} joueurs
               </p>
             </div>
           </div>
           {match.status !== 'a_jouer' && (
             <span className="text-2xl font-bold text-gray-900">{match.score_b}</span>
           )}
         </div>
       </div>

       {/* Actions */}
       {match.status === 'a_jouer' && onUpdateScore && (
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
     <div className={`connector ${isLeft ? 'connector-right' : 'connector-left'}`}></div>
   </div>
 )
}

export default function BracketPage() {
 const params = useParams()
 const router = useRouter()
 const { user } = useAuth()
 const [loading, setLoading] = useState(true)
 const [tournament, setTournament] = useState<Tournament | null>(null)
 const [matches, setMatches] = useState<Match[]>([])
 const [bracketData, setBracketData] = useState<any>({
   huitiemes: [],
   quarts: [],
   demis: [],
   finale: null,
   petiteFinale: null
 })

 useEffect(() => {
   if (params.id) {
     loadBracketData()
   }
 }, [params.id])

 const loadBracketData = async () => {
   try {
     // Charger le tournoi
     const { data: tournamentData } = await supabase
       .from('tournois')
       .select('*')
       .eq('id', params.id)
       .single()

     setTournament(tournamentData)

     // Charger les matchs de phases finales
     const { data: matchesData } = await supabase
       .from('matches')
       .select(`
         *,
         equipe_a:equipes!equipe_a_id(
           *,
           equipes_joueurs(
             joueur:joueurs(*)
           )
         ),
         equipe_b:equipes!equipe_b_id(
           *,
           equipes_joueurs(
             joueur:joueurs(*)
           )
         )
       `)
       .eq('tournoi_id', params.id)
       .in('type', ['huitieme', 'quart', 'demi', 'finale', 'petite_finale'])
       .order('type')

     if (matchesData) {
       setMatches(matchesData)
       
       // Organiser les matchs par type
       const organized = {
         huitiemes: matchesData.filter(m => m.type === 'huitieme'),
         quarts: matchesData.filter(m => m.type === 'quart'),
         demis: matchesData.filter(m => m.type === 'demi'),
         finale: matchesData.find(m => m.type === 'finale'),
         petiteFinale: matchesData.find(m => m.type === 'petite_finale')
       }
       
       setBracketData(organized)
     }
   } catch (error) {
     console.error('Erreur chargement bracket:', error)
   } finally {
     setLoading(false)
   }
 }

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

 // Déterminer le nombre de colonnes selon les phases disponibles
 const hasHuitiemes = bracketData.huitiemes.length > 0
 const hasQuarts = bracketData.quarts.length > 0
 const hasDemis = bracketData.demis.length > 0

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
     {/* Particules animées */}
     <div className="fixed inset-0 overflow-hidden pointer-events-none">
       <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
       <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
       <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
     </div>

     {/* Header */}
     <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
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
                 {Icons.trophy}
               </div>
               <div>
                 <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                   Phases finales
                 </h1>
                 <p className="text-sm text-gray-500">{tournament?.name}</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </header>

     {/* Arbre du tournoi */}
     <div className="p-8 overflow-x-auto">
       <div className="bracket-container min-w-max">
         <div className="bracket-wrapper flex items-center justify-center gap-8">
           
           {/* Huitièmes de finale */}
           {hasHuitiemes && (
             <div className="bracket-column">
               <h3 className="text-center font-bold text-gray-700 mb-4">1/8 Finale</h3>
               <div className="space-y-8">
                 {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                   <BracketMatch 
                     key={`huitieme-${i}`}
                     match={bracketData.huitiemes[i]} 
                     position={`huitieme-${i}`}
                     isLeft={true}
                     onUpdateScore={handleUpdateScore}
                   />
                 ))}
               </div>
             </div>
           )}

           {/* Quarts de finale */}
           {hasQuarts && (
             <div className="bracket-column">
               <h3 className="text-center font-bold text-gray-700 mb-4">1/4 Finale</h3>
               <div className={`space-y-${hasHuitiemes ? '32' : '16'}`}>
                 {[0, 1, 2, 3].map(i => (
                   <BracketMatch 
                     key={`quart-${i}`}
                     match={bracketData.quarts[i]} 
                     position={`quart-${i}`}
                     isLeft={true}
                     onUpdateScore={handleUpdateScore}
                   />
                 ))}
               </div>
             </div>
           )}

           {/* Demi-finales */}
           {hasDemis && (
             <div className="bracket-column">
               <h3 className="text-center font-bold text-gray-700 mb-4">1/2 Finale</h3>
               <div className={`space-y-${hasQuarts ? '64' : '32'}`}>
                 {[0, 1].map(i => (
                   <BracketMatch 
                     key={`demi-${i}`}
                     match={bracketData.demis[i]} 
                     position={`demi-${i}`}
                     isLeft={true}
                     onUpdateScore={handleUpdateScore}
                   />
                 ))}
               </div>
             </div>
           )}

           {/* Finale et Petite finale */}
           <div className="bracket-column finale-column">
             {/* Finale */}
             <div className="finale-wrapper mb-16">
               <h3 className="text-center font-bold text-xl text-gray-900 mb-4 flex items-center justify-center">
                 <div className="text-yellow-500 mr-2">{Icons.crown}</div>
                 FINALE
               </h3>
               <div className="finale-match scale-110">
                 {bracketData.finale ? (
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
                         bracketData.finale.status === 'termine' ? 'bg-green-100 text-green-700' :
                         bracketData.finale.status === 'en_cours' ? 'bg-orange-100 text-orange-700 animate-pulse' :
                         'bg-yellow-100 text-yellow-700'
                       }`}>
                         {bracketData.finale.status === 'termine' ? 'Match terminé' :
                          bracketData.finale.status === 'en_cours' ? 'En cours' : 'À venir'}
                       </div>

                       {/* Équipes */}
                       <div className="space-y-3">
                         {/* Équipe A */}
                         <div className={`p-4 rounded-xl transition-all ${
                           bracketData.finale.status === 'termine' && bracketData.finale.score_a > bracketData.finale.score_b
                             ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 transform scale-105'
                             : 'bg-white'
                         }`}>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center">
                               {bracketData.finale.status === 'termine' && bracketData.finale.score_a > bracketData.finale.score_b && (
                                 <div className="text-3xl mr-3">🥇</div>
                               )}
                               <div>
                                 <p className="font-bold text-lg">{bracketData.finale.equipe_a?.name}</p>
                                 <p className="text-sm text-gray-500">Finaliste</p>
                               </div>
                             </div>
                             {bracketData.finale.status !== 'a_jouer' && (
                               <span className="text-3xl font-bold">{bracketData.finale.score_a}</span>
                             )}
                           </div>
                         </div>

                         <div className="text-center text-gray-400 font-bold">VS</div>

                         {/* Équipe B */}
                         <div className={`p-4 rounded-xl transition-all ${
                           bracketData.finale.status === 'termine' && bracketData.finale.score_b > bracketData.finale.score_a
                             ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 transform scale-105'
                             : 'bg-white'
                         }`}>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center">
                               {bracketData.finale.status === 'termine' && bracketData.finale.score_b > bracketData.finale.score_a && (
                                 <div className="text-3xl mr-3">🥇</div>
                               )}
                               <div>
                                 <p className="font-bold text-lg">{bracketData.finale.equipe_b?.name}</p>
                                 <p className="text-sm text-gray-500">Finaliste</p>
                               </div>
                             </div>
                             {bracketData.finale.status !== 'a_jouer' && (
                               <span className="text-3xl font-bold">{bracketData.finale.score_b}</span>
                             )}
                           </div>
                         </div>
                       </div>

                       {/* Action */}
                       {bracketData.finale.status === 'a_jouer' && (
                         <button
                           onClick={() => handleUpdateScore(bracketData.finale.id)}
                           className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                         >
                           Commencer la finale
                         </button>
                       )}
                     </div>
                   </div>
                 ) : (
                   <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                     <div className="text-gray-400 mb-2">{Icons.trophy}</div>
                     <p className="text-gray-500">En attente des finalistes</p>
                   </div>
                 )}
               </div>
             </div>

             {/* Petite finale */}
             {tournament?.settings?.consolante && (
               <div className="petite-finale-wrapper">
                 <h3 className="text-center font-bold text-gray-700 mb-4">3ème place</h3>
                 {bracketData.petiteFinale ? (
                   <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl shadow-lg p-4">
                     <div className="text-center mb-3">
                       <span className="text-2xl">🥉</span>
                     </div>
                     
                     {/* Équipes */}
                     <div className="space-y-2">
                       <div className={`p-3 rounded-lg bg-white flex items-center justify-between ${
                         bracketData.petiteFinale.status === 'termine' && bracketData.petiteFinale.score_a > bracketData.petiteFinale.score_b
                           ? 'ring-2 ring-orange-400'
                           : ''
                       }`}>
                         <span className="font-medium">{bracketData.petiteFinale.equipe_a?.name}</span>
                         {bracketData.petiteFinale.status !== 'a_jouer' && (
                           <span className="font-bold text-xl">{bracketData.petiteFinale.score_a}</span>
                         )}
                       </div>
                       
                       <div className={`p-3 rounded-lg bg-white flex items-center justify-between ${
                         bracketData.petiteFinale.status === 'termine' && bracketData.petiteFinale.score_b > bracketData.petiteFinale.score_a
                           ? 'ring-2 ring-orange-400'
                           : ''
                       }`}>
                         <span className="font-medium">{bracketData.petiteFinale.equipe_b?.name}</span>
                         {bracketData.petiteFinale.status !== 'a_jouer' && (
                           <span className="font-bold text-xl">{bracketData.petiteFinale.score_b}</span>
                         )}
                       </div>
                     </div>

                     {bracketData.petiteFinale.status === 'a_jouer' && (
                       <button
                         onClick={() => handleUpdateScore(bracketData.petiteFinale.id)}
                         className="w-full mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                       >
                         Saisir le score
                       </button>
                     )}
                   </div>
                 ) : (
                   <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                     <p className="text-gray-500 text-sm">En attente</p>
                   </div>
                 )}
               </div>
             )}
           </div>
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

       .bracket-wrapper {
         position: relative;
       }

       .bracket-column {
         display: flex;
         flex-direction: column;
         justify-content: center;
       }

       .bracket-match {
         position: relative;
         min-width: 280px;
       }

       .connector {
         position: absolute;
         width: 40px;
         height: 2px;
         background: linear-gradient(90deg, transparent, #d1d5db, transparent);
         top: 50%;
         transform: translateY(-50%);
       }

       .connector-right {
         right: -40px;
       }

       .connector-left {
         left: -40px;
       }

       .finale-column {
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
       
       .animate-blob {
         animation: blob 7s infinite;
       }
       
       .animation-delay-2000 {
         animation-delay: 2s;
       }
       
       .animation-delay-4000 {
         animation-delay: 4s;
       }
     `}</style>
   </div>
 )
}