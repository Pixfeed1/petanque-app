'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'
import {
  useCreateTournament,
  usePlayerSelection,
  useTournamentCreation
} from '@/hooks/tournament'
import { Button, BouleSvg, FadeIn } from '@/components/ui'
import { Loader, Plus, X, Check } from '@/components/Icons'
import { computePouleDistributions } from '@/lib/tournament/pouleDistributions'
import { parseTournamentDescription } from '@/lib/tournament/describeParser'
import { AVAILABLE_TERRAINS } from '@/lib/tournament/terrains'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, organization, loading: authLoading } = useAuth()
  const { showError, showWarning } = useToast()

  const {
    formData, currentStep, validationError,
    updateFormField, canProceed, handleContinue, handleBack,
    getTotalPlayers, getMinPlayers, getEstimatedTeams, getEstimatedPools
  } = useCreateTournament()

  const {
    availablePlayers, loadingPlayers, loadPlayers,
    togglePlayer, addNewPlayer, updateNewPlayer, removeNewPlayer,
    selectAllPlayers, deselectAllPlayers, newPlayersRef
  } = usePlayerSelection({
    selectedPlayers: formData.selectedPlayers,
    newPlayers: formData.newPlayers,
    onUpdateSelectedPlayers: (players) => updateFormField('selectedPlayers', players),
    onUpdateNewPlayers: (players) => updateFormField('newPlayers', players)
  })

  const { savingTournament, successAnimation, handleSubmit } = useTournamentCreation({
    formData, availablePlayers, getEstimatedTeams,
    onError: showError, onWarning: showWarning
  })

  useEffect(() => {
    if (!authLoading && !organization && user) {
      showError('Erreur : aucune organisation trouvée')
      router.push('/dashboard')
    }
  }, [organization, user, authLoading, router, showError])

  useEffect(() => {
    if (authLoading) return
    if (user && organization?.id && !organization.id.startsWith('temp-')) {
      loadPlayers()
    } else if (!user) {
      router.push('/login')
    }
  }, [user, organization, authLoading, loadPlayers, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  const stepLabels = ['Le tournoi', 'Le format', 'Les joueurs', 'Options', 'Récap']
  const totalSteps = 5

  // Hero contextuel
  let heroContent: React.ReactNode
  if (currentStep === 1) heroContent = <>D'abord, <span className="accent-italic text-petanque-vert">parle-nous du tournoi.</span></>
  else if (currentStep === 2) heroContent = <>Maintenant, <span className="accent-italic text-petanque-vert">comment veux-tu jouer ?</span></>
  else if (currentStep === 3) heroContent = <>Et qui <span className="accent-italic text-petanque-vert">joue avec nous ?</span></>
  else if (currentStep === 4) heroContent = <>Quelques <span className="accent-italic text-petanque-vert">réglages avant de lancer.</span></>
  else heroContent = <>Tout est prêt, <span className="accent-italic text-petanque-vert">on lance ?</span></>

  // Gratuit pour tous — toutes les options avancées débloquées (Phase 2 : retrait des plans).
  const isClubPlan = true

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
            >
              <span>←</span>
              <span className="hidden sm:inline">Tableau de bord</span>
            </button>
            <span className="font-mono text-xs text-petanque-bois">Nouveau tournoi</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Étape {currentStep} sur {totalSteps} · {stepLabels[currentStep - 1]}
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1] mb-10">
            {heroContent}
          </h1>
        </FadeIn>

        <FadeIn delay={60}>
          <div className="grid grid-cols-5 gap-0 mb-12">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1
              const isActive = currentStep === stepNum
              const isDone = currentStep > stepNum
              return (
                <div key={i} className="flex flex-col items-center gap-2 relative">
                  {i < stepLabels.length - 1 && (
                    <div className={`absolute left-1/2 right-[-50%] top-[9px] h-px ${isDone ? 'bg-petanque-vert' : 'bg-petanque-sable-bord'}`} />
                  )}
                  <div className={`relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-petanque-vert border border-petanque-vert'
                      : isDone
                      ? 'bg-petanque-vert border border-petanque-vert'
                      : 'bg-white border border-petanque-sable-bord'
                  }`}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-petanque-sable-pale"></span>}
                    {isDone && <span className="text-petanque-sable-pale text-[9px]">✓</span>}
                  </div>
                  <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.18em] mt-0.5">0{stepNum}</span>
                  <span className={`text-[10px] md:text-[11px] text-center leading-tight ${isActive ? 'text-petanque-vert-fonce font-medium' : 'text-petanque-bois'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </FadeIn>

        {currentStep === 1 && (
          <FadeIn delay={120} key="s1">
            <Step1 formData={formData} updateFormField={updateFormField} />
          </FadeIn>
        )}
        {currentStep === 2 && (
          <FadeIn delay={120} key="s2">
            <Step2 formData={formData} updateFormField={updateFormField} />
          </FadeIn>
        )}
        {currentStep === 3 && (
          <FadeIn delay={120} key="s3">
            <Step3
              formData={formData}
              availablePlayers={availablePlayers}
              loadingPlayers={loadingPlayers}
              togglePlayer={togglePlayer}
              addNewPlayer={addNewPlayer}
              updateNewPlayer={updateNewPlayer}
              removeNewPlayer={removeNewPlayer}
              selectAllPlayers={selectAllPlayers}
              deselectAllPlayers={deselectAllPlayers}
              newPlayersRef={newPlayersRef}
              getMinPlayers={getMinPlayers}
              getTotalPlayers={getTotalPlayers}
              getEstimatedTeams={getEstimatedTeams}
              getEstimatedPools={getEstimatedPools}
              validationError={validationError}
            />
          </FadeIn>
        )}
        {currentStep === 4 && (
          <FadeIn delay={120} key="s4">
            <Step4 formData={formData} updateFormField={updateFormField} isClubPlan={isClubPlan} />
          </FadeIn>
        )}
        {currentStep === 5 && (
          <FadeIn delay={120} key="s5">
            <Step5
              formData={formData}
              getTotalPlayers={getTotalPlayers}
              getEstimatedTeams={getEstimatedTeams}
              getEstimatedPools={getEstimatedPools}
              successAnimation={successAnimation}
            />
          </FadeIn>
        )}

        <div className="mt-12 pt-6 border-t border-petanque-sable-bord/50 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Retour</span>
            </button>
          ) : (
            <span></span>
          )}

          {currentStep < 5 ? (
            <Button variant="primary" onClick={handleContinue} disabled={!canProceed()}>
              Continuer →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={savingTournament || successAnimation}
              loading={savingTournament}
            >
              {savingTournament ? 'Création…' : successAnimation ? 'Tournoi créé ✓' : 'Créer le tournoi'}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

// =============================================================
// Étape 1 — Le tournoi
// =============================================================
function DescribeTournament({ updateFormField }: any) {
  const [text, setText] = useState('')
  const [detected, setDetected] = useState<string[] | null>(null)

  const apply = () => {
    const { fields, detected } = parseTournamentDescription(text)
    // Pré-remplit les champs reconnus ; l'organisateur relit ensuite le wizard.
    ;(Object.keys(fields) as Array<keyof typeof fields>).forEach((k) => {
      updateFormField(k, fields[k])
    })
    setDetected(detected)
  }

  return (
    <div className="bg-petanque-vert-pale/25 border border-petanque-vert/25 rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-petanque-vert-fonce font-medium">Décris ton tournoi</span>
        <span className="text-[10px] text-petanque-bois">— optionnel</span>
      </div>
      <p className="text-xs text-petanque-bois mb-3">
        Écris en une phrase, et on pré-remplit les réglages. Tu pourras tout relire et ajuster ensuite.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 300))}
        rows={2}
        placeholder="Ex : Doublette mêlée tournante, en 11 points, mixité obligatoire, 4 terrains"
        className="w-full px-4 py-3 bg-white border border-petanque-sable-bord rounded-lg focus:border-petanque-vert focus:outline-none text-sm text-petanque-vert-fonce placeholder:text-petanque-bois/50 resize-none"
      />
      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <Button variant="primary" size="sm" onClick={apply} disabled={!text.trim()}>
          Pré-remplir le formulaire
        </Button>
        {detected && (
          <p className="text-xs text-petanque-bois">
            {detected.length === 0
              ? "Rien de reconnu — remplis le formulaire à la main."
              : `Compris : ${detected.length} réglage${detected.length > 1 ? 's' : ''}`}
          </p>
        )}
      </div>
      {detected && detected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {detected.map((d, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-white border border-petanque-vert/25 rounded-full px-2.5 py-1 text-[11px] text-petanque-vert-fonce">
              <Check className="w-3 h-3 text-petanque-vert" />{d}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Step1({ formData, updateFormField }: any) {
  return (
    <div className="space-y-7">
      <DescribeTournament updateFormField={updateFormField} />
      <div>
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">
          Nom du tournoi *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormField('name', e.target.value.slice(0, 100))}
          className="w-full h-12 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-base text-petanque-vert-fonce"
          placeholder="Ex : Tournoi de printemps 2026"
          maxLength={100}
        />
        <p className="text-[11px] text-petanque-bois mt-1.5 font-mono">{formData.name.length}/100</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => updateFormField('date', e.target.value)}
            className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Heure</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => updateFormField('time', e.target.value)}
            className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Lieu</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => updateFormField('location', e.target.value.slice(0, 100))}
          className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
          placeholder="Ex : boulodrome municipal"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Terrains de jeu</label>
        <p className="text-xs text-petanque-bois mb-3">Sélectionne les terrains disponibles sur le lieu du concours.</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TERRAINS.map((name) => {
            const selected = (formData.terrainNames || []).includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  const cur: string[] = formData.terrainNames || []
                  const next = selected ? cur.filter((n) => n !== name) : [...cur, name]
                  // Garde l'ordre de la liste fixe pour un affichage cohérent
                  const ordered = AVAILABLE_TERRAINS.filter((t) => next.includes(t))
                  updateFormField('terrainNames', ordered)
                  updateFormField('terrains', Math.max(1, ordered.length))
                }}
                className={`w-11 h-11 rounded-lg font-mono text-base font-medium transition-colors ${
                  selected
                    ? 'bg-petanque-vert text-white border border-petanque-vert'
                    : 'bg-white text-petanque-vert-fonce border border-petanque-sable-bord hover:border-petanque-vert/40'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-petanque-bois mt-2 font-mono">
          {(formData.terrainNames || []).length} terrain{(formData.terrainNames || []).length > 1 ? 's' : ''} sélectionné{(formData.terrainNames || []).length > 1 ? 's' : ''}
          {(formData.terrainNames || []).length > 0 ? ` : ${(formData.terrainNames || []).join(' · ')}` : ''}
        </p>
      </div>
    </div>
  )
}

// =============================================================
// Étape 2 — Le format
// =============================================================
function Step2({ formData, updateFormField }: any) {
  const modes = [
    { value: 'choisi', title: 'Mode choisi', desc: "Tu composes les équipes toi-même.", variant: 'acier' as const },
    { value: 'melee_fixe', title: 'Mêlée fixe', desc: 'Équipes tirées au sort, gardées tout le tournoi.', variant: 'vert' as const, recommended: true },
    { value: 'melee_tournante', title: 'Mêlée tournante', desc: 'Équipes redistribuées à chaque tour.', variant: 'cochonnet' as const }
  ]
  const formats = [
    { value: 'tete_a_tete', num: '1', title: 'Tête à tête', desc: '1 joueur' },
    { value: 'doublette', num: '2', title: 'Doublette', desc: '2 joueurs' },
    { value: 'triplette', num: '3', title: 'Triplette', desc: '3 joueurs' }
  ]
  const pointsOptions = [11, 13, 15, 21]

  return (
    <div className="space-y-9">
      <div>
        <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Mode de jeu</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modes.map((mode) => {
            const sel = formData.mode === mode.value
            return (
              <button
                key={mode.value}
                onClick={() => updateFormField('mode', mode.value)}
                className={`relative text-left p-5 rounded-2xl bg-white transition-colors ${
                  sel
                    ? 'border-[1.5px] border-petanque-vert bg-petanque-vert-pale/30'
                    : 'border border-petanque-sable-bord hover:border-petanque-bois/50'
                }`}
              >
                <BouleSvg size={36} variant={mode.variant} stries className="mb-3" />
                <h4 className="font-medium text-petanque-vert-fonce text-base mb-1">{mode.title}</h4>
                <p className="text-xs text-petanque-bois leading-relaxed">{mode.desc}</p>
                {mode.recommended && (
                  <span className="absolute top-3 right-3 font-mono text-[9px] text-petanque-vert uppercase tracking-[0.16em] font-medium">
                    Recommandé
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Format d'équipe</p>
        <div className="grid grid-cols-3 gap-3">
          {formats.map((f) => {
            const sel = formData.format === f.value
            return (
              <button
                key={f.value}
                onClick={() => updateFormField('format', f.value)}
                className={`text-center p-5 rounded-xl bg-white transition-colors ${
                  sel
                    ? 'border-[1.5px] border-petanque-vert bg-petanque-vert-pale/30'
                    : 'border border-petanque-sable-bord hover:border-petanque-bois/50'
                }`}
              >
                <p className={`font-mono text-2xl md:text-3xl font-medium leading-none ${sel ? 'text-petanque-vert' : 'text-petanque-vert-fonce'}`}>
                  {f.num}
                </p>
                <h4 className="font-medium text-petanque-vert-fonce text-sm mt-2">{f.title}</h4>
                <p className="text-[11px] text-petanque-bois mt-0.5">{f.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Points pour gagner</p>
        <div className="flex flex-wrap gap-2">
          {pointsOptions.map((pts) => {
            const sel = formData.maxPoints === pts
            return (
              <button
                key={pts}
                onClick={() => updateFormField('maxPoints', pts)}
                className={`font-mono text-sm rounded-full px-4 py-2 transition-colors ${
                  sel
                    ? 'bg-petanque-vert text-petanque-sable border border-petanque-vert'
                    : 'bg-white border border-petanque-sable-bord text-petanque-vert-fonce hover:border-petanque-bois/50'
                }`}
              >
                {pts}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================================
// Étape 3 — Les joueurs
// =============================================================
function Step3({
  formData, availablePlayers, loadingPlayers,
  togglePlayer, addNewPlayer, updateNewPlayer, removeNewPlayer,
  selectAllPlayers, deselectAllPlayers, newPlayersRef,
  getMinPlayers, getTotalPlayers, getEstimatedTeams, getEstimatedPools,
  validationError
}: any) {
  const total = getTotalPlayers()
  const min = getMinPlayers()
  const teams = getEstimatedTeams()
  const pools = getEstimatedPools()

  return (
    <div className="space-y-7">
      <div className="bg-white border border-petanque-sable-bord rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1">Total sélectionné</p>
          <p className="font-mono text-2xl font-medium text-petanque-vert-fonce leading-none">
            {total}<span className="text-sm text-petanque-bois ml-2 font-sans">joueur{total > 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-petanque-bois">≈ {teams} équipe{teams > 1 ? 's' : ''} · {pools} poule{pools > 1 ? 's' : ''}</p>
          {formData.mode !== 'choisi' && total < min && (
            <p className="text-xs text-petanque-cochonnet mt-1">Minimum {min} requis</p>
          )}
        </div>
      </div>

      {loadingPlayers ? (
        <div className="text-center py-8">
          <Loader className="w-6 h-6 animate-spin mx-auto text-petanque-vert" />
          <p className="text-sm text-petanque-bois mt-3">Chargement des joueurs…</p>
        </div>
      ) : availablePlayers.length > 0 ? (
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Joueurs de l'organisation</p>
            <div className="space-x-3">
              <button onClick={selectAllPlayers} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce font-medium">Tout sélectionner</button>
              <button onClick={deselectAllPlayers} className="text-xs text-petanque-bois hover:text-petanque-vert-fonce font-medium">Désélectionner</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
            {availablePlayers.map((player: any) => {
              const sel = formData.selectedPlayers.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg bg-white transition-colors text-left ${
                    sel ? 'border-[1.5px] border-petanque-vert bg-petanque-vert-pale/30' : 'border border-petanque-sable-bord hover:border-petanque-bois/50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-petanque-vert-pale/40 text-petanque-vert-fonce text-xs font-medium flex-shrink-0 flex items-center justify-center">
                    {player.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-petanque-vert-fonce truncate flex-1">{player.name}</span>
                  {sel && <Check className="w-3.5 h-3.5 text-petanque-vert flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div ref={newPlayersRef}>
        <div className="flex justify-between items-baseline mb-3">
          <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Ajouter des joueurs</p>
          <button onClick={addNewPlayer} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
        {formData.newPlayers.length === 0 ? (
          <p className="text-sm text-petanque-bois italic">Aucun joueur supplémentaire pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {formData.newPlayers.map((player: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white border border-petanque-sable-bord rounded-lg">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updateNewPlayer(i, 'name', e.target.value)}
                  placeholder="Nom"
                  className="flex-1 h-9 px-3 text-base bg-transparent border border-petanque-sable-bord rounded focus:border-petanque-vert focus:outline-none"
                />
                <select
                  value={player.gender}
                  onChange={(e) => updateNewPlayer(i, 'gender', e.target.value)}
                  className="h-9 px-2 text-sm bg-transparent border border-petanque-sable-bord rounded focus:border-petanque-vert focus:outline-none"
                >
                  <option value="H">H</option>
                  <option value="F">F</option>
                </select>
                <button
                  onClick={() => removeNewPlayer(i)}
                  className="w-9 h-9 flex items-center justify-center text-petanque-bois hover:text-petanque-cochonnet rounded"
                  aria-label="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {validationError && (
        <div className="p-3 bg-petanque-cochonnet-pale/30 border border-petanque-cochonnet/40 rounded-lg text-sm text-petanque-cochonnet-fonce">
          {validationError}
        </div>
      )}
    </div>
  )
}

// =============================================================
// Étape 4 — Options avancées
// =============================================================
function Step4({ formData, updateFormField, isClubPlan }: any) {
  const advancedOptions = [
    { key: 'mixiteObligatoire', label: 'Mixité obligatoire', desc: 'H et F dans chaque équipe' },
    { key: 'consolante', label: 'Petite finale', desc: 'Match pour la 3e place' },
    { key: 'fairPlay', label: 'Mode fair-play', desc: 'Pénalités douces, esprit club' },
    { key: 'equilibrageNiveau', label: 'Équilibrage par niveau', desc: 'Compose des équipes et des poules homogènes à partir du niveau cumulé des joueurs (historique entre concours)' }
  ]

  const playersPerTeam = formData.format === 'tete_a_tete' ? 1 : formData.format === 'doublette' ? 2 : 3
  const totalPlayers = (formData.selectedPlayers?.length || 0) + ((formData.newPlayers || []).filter((p: any) => p.name?.trim()).length)
  const nbEquipes = totalPlayers === 0 ? 0 : Math.floor(totalPlayers / playersPerTeam)
  const distributions = computePouleDistributions(nbEquipes)
  const selectedDist = distributions.find((d) => d.pouleSize === formData.pouleSize) || distributions.find((d) => d.recommended) || distributions[0] || null
  const qualifies = formData.qualifiedPerPoule || 2
  const nbQualifies = selectedDist ? selectedDist.nbPoules * qualifies : 0
  const isPow2 = nbQualifies > 0 && (nbQualifies & (nbQualifies - 1)) === 0
  const finalPhaseLabel = nbQualifies <= 2 ? 'finale directe' : nbQualifies <= 4 ? 'demi-finales' : nbQualifies <= 8 ? 'quarts de finale' : 'huitièmes de finale'

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (distributions.length > 0 && !distributions.some((d) => d.pouleSize === formData.pouleSize)) {
      const rec = distributions.find((d) => d.recommended) || distributions[0]
      if (rec) updateFormField('pouleSize', rec.pouleSize)
    }
  }, [nbEquipes])

  return (
    <div className="space-y-9">
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Répartition des poules</label>
        {nbEquipes < 3 ? (
          <p className="text-sm text-petanque-bois italic">Sélectionne d'abord tes joueurs à l'étape précédente pour voir les répartitions possibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {distributions.map((d) => {
              const active = !!selectedDist && d.pouleSize === selectedDist.pouleSize
              return (
                <button
                  key={d.nbPoules}
                  type="button"
                  onClick={() => updateFormField('pouleSize', d.pouleSize)}
                  className={`relative text-left p-4 rounded-xl transition-colors ${active ? 'border-2 border-petanque-vert bg-petanque-vert-pale/20' : 'border border-petanque-sable-bord bg-white hover:border-petanque-vert/40'}`}
                >
                  {d.recommended && (
                    <span className="absolute -top-2 right-3 bg-petanque-vert text-white text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded">Recommandé</span>
                  )}
                  <span className="block text-base font-medium text-petanque-vert-fonce mb-2">{d.label}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {d.sizes.map((s, i) => (
                      <span key={i} className="text-[11px] bg-petanque-sable-pale text-petanque-bois px-2 py-0.5 rounded">
                        {String.fromCharCode(65 + i)} · {s}
                      </span>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Qualifiés par poule</label>
        <select
          value={formData.qualifiedPerPoule}
          onChange={(e) => updateFormField('qualifiedPerPoule', parseInt(e.target.value))}
          className="w-full md:w-1/2 h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:outline-none text-sm text-petanque-vert-fonce"
        >
          {[1, 2, 3].map(n => <option key={n} value={n}>{n} qualifié{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {selectedDist && (
        <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-3.5">
          <span className="text-sm text-petanque-vert-fonce leading-relaxed">
            <span className="font-medium">{selectedDist.label} · {qualifies} qualifié{qualifies > 1 ? 's' : ''}</span> = {nbQualifies} qualifiés → <span className="font-medium">{finalPhaseLabel}</span>{nbQualifies > 2 && !isPow2 ? ' (avec exempts)' : ''}.
          </span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Nombre de parties</label>
        <select
          value={formData.nombreParties || 0}
          onChange={(e) => updateFormField('nombreParties', parseInt(e.target.value) || 0)}
          className="w-full md:w-1/2 h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:outline-none text-sm text-petanque-vert-fonce mb-2"
        >
          <option value={0}>Classique (poules → phases finales)</option>
          <option value={2}>2 parties</option>
          <option value={3}>3 parties</option>
          <option value={4}>4 parties</option>
        </select>
        <p className="text-xs text-petanque-bois">
          {formData.mode === 'melee_tournante'
            ? 'Nombre de parties fixé : équipes et adversaires re-tirés à chaque partie, puis classement individuel.'
            : 'Nombre de parties fixé : mêmes équipes, adversaires re-tirés à chaque partie, puis classement par équipe. (Sinon : poules → phases finales.)'}
        </p>
      </div>

      {formData.mode === 'melee_tournante' && (
        <div>
          <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Rotation des équipes</label>
          <select
            value={formData.meleeRotation}
            onChange={(e) => updateFormField('meleeRotation', e.target.value)}
            className="w-full md:w-1/2 h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:outline-none text-sm text-petanque-vert-fonce"
          >
            <option value="par_tour">Par tour (recommandé)</option>
            <option value="par_match">Par match</option>
          </select>
          <label className="flex items-start gap-3 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={formData.mixiteAdversaire || false}
              onChange={(e) => updateFormField('mixiteAdversaire', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30"
            />
            <div>
              <p className="text-sm text-petanque-vert-fonce font-medium">Mixité des adversaires</p>
              <p className="text-xs text-petanque-bois">
                Chaque partie oppose des équipes de profil compatible (une équipe à majorité féminine ne tombe pas contre une équipe à majorité masculine). Exception tolérée si impossible.
              </p>
            </div>
          </label>
        </div>
      )}

      <div className="space-y-3 border-t border-petanque-sable-bord/50 pt-6">
        {advancedOptions.map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={formData[key] as boolean}
              onChange={(e) => updateFormField(key, e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30"
            />
            <div>
              <p className="text-sm text-petanque-vert-fonce font-medium">{label}</p>
              <p className="text-xs text-petanque-bois">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="border-t border-petanque-sable-bord/50 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-petanque-bois font-medium">Options avancées</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Points personnalisés (7–25)</label>
            <input
              type="number"
              min={7}
              max={25}
              value={formData.maxPoints}
              onChange={(e) => updateFormField('maxPoints', parseInt(e.target.value) || 13)}
              disabled={!isClubPlan}
              className="w-32 h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:outline-none disabled:cursor-not-allowed disabled:bg-petanque-sable-pale/50 text-center font-mono text-base text-petanque-vert-fonce"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.timeLimit || false}
              onChange={(e) => updateFormField('timeLimit', e.target.checked)}
              disabled={!isClubPlan}
              className="w-4 h-4 mt-0.5 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30 disabled:cursor-not-allowed"
            />
            <div>
              <p className="text-sm text-petanque-vert-fonce font-medium">Limite de temps par match</p>
              <p className="text-xs text-petanque-bois">Termine un match à la fin du temps imparti</p>
            </div>
          </label>
          {formData.timeLimit && isClubPlan && (
            <div className="ml-7">
              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Minutes par match</label>
              <input
                type="number"
                min={15}
                max={120}
                value={formData.timeLimitMinutes || 60}
                onChange={(e) => updateFormField('timeLimitMinutes', parseInt(e.target.value) || 60)}
                className="w-32 h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:outline-none text-center font-mono text-base text-petanque-vert-fonce"
              />
            </div>
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.eliminationFormat === 'double'}
              onChange={(e) => updateFormField('eliminationFormat', e.target.checked ? 'double' : 'simple')}
              disabled={!isClubPlan}
              className="w-4 h-4 mt-0.5 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30 disabled:cursor-not-allowed"
            />
            <div>
              <p className="text-sm text-petanque-vert-fonce font-medium">Double élimination</p>
              <p className="text-xs text-petanque-bois">Une équipe doit perdre 2 matchs avant d'être éliminée</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

// =============================================================
// Étape 5 — Récap
// =============================================================
function Step5({ formData, getTotalPlayers, getEstimatedTeams, getEstimatedPools, successAnimation }: any) {
  const items = [
    { label: 'Nom', value: formData.name || '—' },
    { label: 'Date', value: formData.date || '—' },
    { label: 'Lieu', value: formData.location || '—' },
    { label: 'Mode', value: formData.mode === 'choisi' ? 'Choisi' : formData.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante' },
    { label: 'Format', value: formData.format === 'tete_a_tete' ? 'Tête à tête' : formData.format === 'doublette' ? 'Doublette' : 'Triplette' },
    { label: 'Points max', value: formData.maxPoints },
    { label: 'Joueurs', value: getTotalPlayers() },
    { label: 'Équipes', value: getEstimatedTeams() },
    { label: 'Poules', value: getEstimatedPools() },
    { label: 'Terrains', value: formData.terrains }
  ]

  return (
    <div className="space-y-7">
      {!successAnimation ? (
        <div>
          <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Vérifie les paramètres</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 border-t border-petanque-sable-bord/50 pt-5">
            {items.map(({ label, value }) => (
              <div key={label} className="border-b border-petanque-sable-bord/40 pb-3">
                <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.14em] mb-1">{label}</p>
                <p className="text-sm md:text-base text-petanque-vert-fonce font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-5 bg-petanque-vert-pale/40 rounded-full flex items-center justify-center">
            <Check className="w-7 h-7 text-petanque-vert" />
          </div>
          <p className="text-2xl font-medium text-petanque-vert-fonce mb-2">Tournoi créé.</p>
          <p className="text-sm text-petanque-bois italic">Redirection en cours…</p>
        </div>
      )}
    </div>
  )
}
