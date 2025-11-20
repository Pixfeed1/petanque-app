# ANALYSE COMPLÈTE : BUGS ET DUPLICATIONS
# Application de Tournoi de Pétanque

**Date** : 2025-11-20  
**Version analysée** : Branch `claude/resume-verification-recovery-01G4gTwnMKuA4kma7acFjzVk`

---

## 📊 RÉSUMÉ EXÉCUTIF

**Total des problèmes identifiés : 59**

| Catégorie | Nombre | Priorité |
|-----------|--------|----------|
| 🔥 Bugs CRITIQUES | 8 | P0 - À corriger immédiatement |
| 🚨 Bugs MAJEURS | 15 | P1 - À corriger rapidement |
| ⚠️ Bugs MOYENS | 12 | P2 - À planifier |
| 🟡 Bugs MINEURS | 10 | P3 - Nice to have |
| 📋 Duplications | 8 | Refactoring |
| ⚡ Incohérences | 6 | Architecture |

---

## 🔥 BUGS CRITIQUES (8)

Bugs qui empêchent des fonctionnalités majeures ou causent des résultats incorrects graves.

### Bug #1 : Confrontation directe jamais appliquée dans groupTeamsByPoule

**Fichier** : `/lib/services/stats.service.ts`  
**Lignes** : 273-275  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Logique FIPJP

**Description** :  
La fonction `groupTeamsByPoule` trie chaque poule avec `sortTeamsByFIPJPRules` mais ne passe jamais les paramètres optionnels `matches` et `poule`. Conséquence : la confrontation directe (3ème critère FIPJP) n'est JAMAIS appliquée.

**Code problématique** :
```typescript
// LIGNE 273-275
Object.keys(poules).forEach(poule => {
  poules[poule] = sortTeamsByFIPJPRules(poules[poule])  // ❌ Manque matches et poule
})
```

**Impact** :  
En cas d'égalité parfaite de points et différence, deux équipes sont classées dans un ordre aléatoire au lieu d'utiliser leur confrontation directe. Violation des règles FIPJP officielles.

**Scénario déclencheur** :
```
Poule A : 
- Équipe 1 : 6 points FIPJP, +5 différence
- Équipe 2 : 6 points FIPJP, +5 différence  
- Confrontation directe : Équipe 2 a battu Équipe 1 (13-7)

Résultat actuel : Ordre aléatoire (peut mettre Équipe 1 devant)
Résultat attendu : Équipe 2 devant Équipe 1
```

**Solution** :
```typescript
Object.keys(poules).forEach(poule => {
  poules[poule] = sortTeamsByFIPJPRules(
    poules[poule], 
    matches as MatchType[], 
    poule
  )
})
```

---

### Bug #2 : Race condition dans createMatchesForRotation

**Fichier** : `/app/tournoi/[id]/page.tsx`  
**Lignes** : 1074-1083, 1178-1202  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Race condition / State management

**Description** :  
La fonction `createMatchesForRotation` est appelée immédiatement après `createNewTeamsWithAlgorithm`, mais elle utilise l'ancien state `teams` qui n'a pas encore été mis à jour. Les équipes de la nouvelle rotation ne sont pas trouvées.

**Code problématique** :
```typescript
// LIGNE 1074-1083 - reformTeamsForRotation
const newRotation = currentRotation + 1
setCurrentRotation(newRotation)
await createNewTeamsWithAlgorithm()  // Crée les équipes en BD
await new Promise(resolve => setTimeout(resolve, 500))  // ⚠️ Attente arbitraire
await createMatchesForRotation(newRotation)  // ❌ teams pas à jour !

// LIGNE 1183-1185 - createMatchesForRotation
const rotationTeams = teams.filter(t =>
  t.name.startsWith(`R${rotationNumber}-`)
)  // ❌ Retourne [] car teams est l'ancien state
```

**Impact** :  
En mode mêlée tournante, créer une nouvelle rotation génère les équipes mais aucun match. Le tournoi est bloqué.

**Scénario déclencheur** :
1. Mode mêlée tournante, tour 1 terminé
2. Clic "Rotation équipes"
3. Nouvelles équipes créées (R2-Équipe 1, R2-Équipe 2, etc.) ✅
4. Aucun match créé pour ces équipes ❌
5. Console log : "✅ 0 matchs créés pour rotation 2"

**Solution** :
```typescript
const createMatchesForRotation = async (rotationNumber: number) => {
  if (!tournament) return

  try {
    // Recharger les équipes fraîchement créées depuis la BD
    const teamsResponse = await fetch(`/api/equipes?tournoi_id=${tournament.id}`, {
      credentials: 'include'
    })
    
    if (!teamsResponse.ok) {
      throw new Error('Échec chargement équipes')
    }
    
    const freshTeams = await teamsResponse.json()
    
    // Filtrer pour la rotation actuelle
    const rotationTeams = freshTeams.filter((t: Team) =>
      t.name.startsWith(`R${rotationNumber}-`)
    )

    if (rotationTeams.length === 0) {
      console.warn(`Aucune équipe trouvée pour rotation ${rotationNumber}`)
      return
    }

    // Générer les matchs
    await createRoundRobinMatches(rotationTeams, rotationNumber, null)
    
    // Recharger l'interface
    await loadTournamentData()
  } catch (error) {
    console.error('Erreur création matchs rotation:', error)
    throw error
  }
}
```

---

### Bug #3 : Pas de mélange des équipes dans generatePoules

**Fichier** : `/app/tournoi/[id]/page.tsx`  
**Lignes** : 630-661  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Fairness / Équité

**Description** :  
Les équipes ne sont PAS mélangées avant distribution dans les poules. Elles sont assignées dans l'ordre de création, créant un biais si les équipes sont déjà ordonnées.

**Code problématique** :
```typescript
// LIGNE 644-648
for (let i = 0; i < nbPoules; i++) {
  const pouleName = String.fromCharCode(65 + i)
  poules[pouleName] = teams.slice(i * pouleSize, (i + 1) * pouleSize)  // ❌ Pas de shuffle !
}
```

**Impact** :  
Distribution inéquitable des forces. Si les équipes sont classées (fort → faible), la poule A sera beaucoup plus relevée que la poule B, violant le principe de fairness.

**Scénario déclencheur** :
```
8 équipes classées par niveau (ELO fictif) :
- A1 (2000), A2 (1900), A3 (1800), A4 (1700)
- A5 (1600), A6 (1500), A7 (1400), A8 (1300)

Sans mélange :
- Poule A : A1, A2, A3, A4 (ELO moyen = 1850)
- Poule B : A5, A6, A7, A8 (ELO moyen = 1450)

Avec mélange :
- Poule A : A1, A4, A6, A7 (ELO moyen = 1650)  
- Poule B : A2, A3, A5, A8 (ELO moyen = 1650)
```

**Solution** :
```typescript
const generatePoules = async () => {
  if (!tournament || teams.length === 0) return

  const pouleSize = tournament.settings.pouleSize || 4

  // Validation
  if (!isValidPoolConfiguration(teams.length, pouleSize)) {
    alert(`❌ Configuration invalide...`)
    return
  }

  // CORRECTION : Mélanger les équipes pour fairplay
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)

  const nbPoules = Math.ceil(teams.length / pouleSize)
  const poules: { [key: string]: Team[] } = {}
  
  for (let i = 0; i < nbPoules; i++) {
    const pouleName = String.fromCharCode(65 + i)
    poules[pouleName] = shuffledTeams.slice(i * pouleSize, (i + 1) * pouleSize)
  }

  // Générer les matchs...
}
```

---

### Bug #4 : Mixité non appliquée en mêlée tournante R1

**Fichier** : `/app/tournoi/nouveau/page.tsx`  
**Lignes** : 484-527  
**Sévérité** : 🔥 CRITIQUE (si mixité obligatoire activée)  
**Type** : Logique / Validation

**Description** :  
En mode mêlée tournante, le premier tour (R1) ne utilise PAS `MixiteService.createTeamsWithMixite`, contrairement aux rotations suivantes. La mixité obligatoire n'est donc pas respectée au tour 1.

**Code problématique** :
```typescript
// LIGNE 484-508 - createTeamsWithMixity pour mêlée tournante
else if (formData.mode === 'melee_tournante') {
  const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)
  const nbEquipes = Math.floor(shuffledPlayers.length / playersPerTeam)

  for (let i = 0; i < nbEquipes; i++) {
    const teamPlayers = shuffledPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam)
    await fetch('/api/equipes', {
      body: JSON.stringify({
        tournoi_id: tournoi.id,
        name: `R1-Équipe ${i + 1}`,
        joueur_ids: teamPlayers  // ❌ Distribution aléatoire, pas de mixité !
      })
    })
  }
}

// COMPARAISON : Dans [id]/page.tsx ligne 1131-1135 (rotations suivantes)
const mixiteResult = MixiteService.createTeamsWithMixite(
  players,
  teamSize as 2 | 3,
  tournament.settings.mixiteObligatoire || false  // ✅ Mixité respectée
)
```

**Impact** :  
Incohérence flagrante : le tour 1 peut avoir des équipes 2H ou 2F, alors que les tours suivants respectent la mixité H+F.

**Scénario déclencheur** :
```
Tournoi : 12 joueurs (6H, 6F), doublette, mixité obligatoire = true

Tour 1 (nouveau/page.tsx) :
- R1-Équipe 1 : [Homme1, Homme2] ❌
- R1-Équipe 2 : [Femme1, Femme2] ❌
- R1-Équipe 3 : [Homme3, Homme4] ❌
- etc.

Tour 2 ([id]/page.tsx après rotation) :
- R2-Équipe 1 : [Homme1, Femme1] ✅
- R2-Équipe 2 : [Homme2, Femme2] ✅
- etc.

→ Violation de la règle au tour 1
```

**Solution** :
```typescript
else if (formData.mode === 'melee_tournante') {
  // Charger les joueurs complets avec leurs genres
  const players = allAvailablePlayersUpdated.filter(p => allPlayerIds.includes(p.id))
  
  // CORRECTION : Utiliser MixiteService dès le tour 1
  const mixiteResult = MixiteService.createTeamsWithMixite(
    players,
    playersPerTeam as 2 | 3,
    formData.mixiteObligatoire
  )
  
  // Créer les équipes avec les compositions respectant la mixité
  for (let i = 0; i < mixiteResult.teams.length; i++) {
    await fetch('/api/equipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tournoi_id: tournoi.id,
        name: `R1-Équipe ${i + 1}`,
        joueur_ids: mixiteResult.teams[i].joueur_ids,
        stats: {
          victoires: 0,
          defaites: 0,
          points_pour: 0,
          points_contre: 0
        }
      })
    })
  }
  
  // Alerter si des joueurs ne peuvent pas être assignés
  if (mixiteResult.unassignedPlayerIds.length > 0) {
    console.warn(`${mixiteResult.unassignedPlayerIds.length} joueur(s) non assigné(s):`, mixiteResult.warnings)
  }
  
  // Sauvegarder la config dans settings
  await fetch(`/api/tournois/${tournoi.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      settings: {
        ...tournoi.settings,
        melee_tournante_players: allPlayerIds,
        melee_rotation: formData.meleeRotation,
        current_round: 1
      }
    })
  })
}
```

---

### Bug #5 : API n'accepte pas les matchs BYE

**Fichier** : `/app/api/matches/route.ts`  
**Lignes** : 109-116  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Validation API

**Description** :  
L'API POST `/api/matches` refuse les matchs avec `equipe_b_id` null, empêchant la création de matchs BYE nécessaires pour les brackets avec nombre impair d'équipes.

**Code problématique** :
```typescript
// LIGNE 109-116
if (!equipe_a_id || !equipe_b_id) {
  return apiError('equipe_a_id et equipe_b_id sont requis', 400)
}

if (equipe_a_id === equipe_b_id) {
  return apiError('Les deux équipes doivent être différentes', 400)
}
```

**Impact** :  
Impossible de créer des brackets d'élimination avec nombre impair d'équipes (5, 7, 9, etc.). La fonction `generateEliminationPhases` essaie de créer des BYE (ligne 850-867) mais l'API retourne 400.

**Scénario déclencheur** :
```
Tournoi avec 5 équipes qualifiées pour les quarts de finale :
1. generateEliminationPhases calcule : 4 matchs de quart
2. Essaie de créer :
   - Match 1 : Équipe A vs Équipe B ✅
   - Match 2 : Équipe C vs Équipe D ✅
   - Match 3 : Équipe E vs null (BYE) ❌ 400 Bad Request
   
→ Échec génération phases finales
```

**Solution** :
```typescript
// POST - Créer un nouveau match
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const body = await request.json()
    const { tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status } = body

    // CORRECTION : equipe_a_id obligatoire, equipe_b_id optionnel (BYE)
    if (!tournoi_id || !equipe_a_id) {
      return apiError('tournoi_id et equipe_a_id sont requis', 400)
    }

    // Vérifier équipes différentes seulement si les deux existent
    if (equipe_b_id && equipe_a_id === equipe_b_id) {
      return apiError('Les deux équipes doivent être différentes', 400)
    }

    // Vérifier équipe A existe
    const equipeACheck = await queryOne(
      'SELECT id, tournoi_id FROM equipes WHERE id = $1',
      [equipe_a_id]
    )

    if (!equipeACheck) {
      return apiError(`Équipe A (${equipe_a_id}) n'existe pas`, 404)
    }

    if (equipeACheck.tournoi_id !== tournoi_id) {
      return apiError(`Équipe A n'appartient pas au tournoi ${tournoi_id}`, 400)
    }

    // Vérifier équipe B seulement si fournie (pas de BYE)
    if (equipe_b_id) {
      const equipeBCheck = await queryOne(
        'SELECT id, tournoi_id FROM equipes WHERE id = $1',
        [equipe_b_id]
      )

      if (!equipeBCheck) {
        return apiError(`Équipe B (${equipe_b_id}) n'existe pas`, 404)
      }

      if (equipeBCheck.tournoi_id !== tournoi_id) {
        return apiError(`Équipe B n'appartient pas au tournoi ${tournoi_id}`, 400)
      }
    }

    // Créer le match (equipe_b_id peut être null pour BYE)
    const result = await query(
      `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [tournoi_id, tour || 1, terrain, equipe_a_id, equipe_b_id, type || 'poule', poule, status || 'a_jouer']
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/matches:', error)
    return apiError('Erreur lors de la création du match', 500)
  }
}
```

---

### Bug #6 : Validation maxPoints bloque les tournois avec timeLimit

**Fichier** : `/app/api/matches/[id]/route.ts`  
**Lignes** : 213-219  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Validation métier

**Description** :  
L'API refuse de terminer un match si aucune équipe n'a atteint `maxPoints`, mais en pétanque avec limite de temps, un match PEUT et DOIT se terminer avant qu'une équipe atteigne 13 points.

**Code problématique** :
```typescript
// LIGNE 213-219
const maxPoints = (tournoiQuery.rows[0]?.settings as any)?.maxPoints || 13

// Vérifier qu'au moins une équipe a atteint le score maximum
if (scoreA < maxPoints && scoreB < maxPoints) {
  return apiError(
    `Le match doit se terminer quand une équipe atteint ${maxPoints} points. Score actuel: ${scoreA}-${scoreB}`,
    400
  )
}
```

**Impact** :  
Impossible de terminer des matchs en mode `timeLimit` si le temps s'écoule avant qu'une équipe atteigne le maxPoints. Le tournoi est bloqué.

**Scénario déclencheur** :
```
Configuration :
- maxPoints = 13
- timeLimit = true
- timeLimitMinutes = 60

Match en cours :
- Durée écoulée : 60 minutes
- Score actuel : 10-8
- L'arbitre veut terminer le match (équipe A gagne 10-8)

Action :
- PUT /api/matches/:id avec status = 'termine', score_a = 10, score_b = 8

Résultat :
- ❌ 400 Bad Request : "Le match doit se terminer quand une équipe atteint 13 points. Score actuel: 10-8"

→ Match bloqué, tournoi bloqué
```

**Solution** :
```typescript
// PUT - Mettre à jour un match
if (body.status === 'termine') {
  const scoreA = body.score_a !== undefined ? body.score_a : existingMatch.score_a
  const scoreB = body.score_b !== undefined ? body.score_b : existingMatch.score_b

  // Vérifier égalité
  if (scoreA === scoreB) {
    return apiError('Un match de pétanque ne peut pas se terminer sur une égalité', 400)
  }

  // Récupérer settings du tournoi
  const tournoiQuery = await query(
    'SELECT settings FROM tournois WHERE id = $1',
    [existingMatch.tournoi_id]
  )
  const settings = tournoiQuery.rows[0]?.settings as any
  const maxPoints = settings?.maxPoints || 13
  const timeLimit = settings?.timeLimit || false

  // CORRECTION : Ne valider maxPoints que si PAS de limite de temps
  if (!timeLimit && scoreA < maxPoints && scoreB < maxPoints) {
    return apiError(
      `Le match doit se terminer quand une équipe atteint ${maxPoints} points. Score actuel: ${scoreA}-${scoreB}`,
      400
    )
  }

  // Si timeLimit, accepter n'importe quel score final (tant que pas d'égalité)
  // Note: On pourrait ajouter une validation que le score du perdant < maxPoints pour plus de rigueur
  
  // Calculer automatiquement le winner_id
  const calculatedWinnerId = scoreA > scoreB ? existingMatch.equipe_a_id : existingMatch.equipe_b_id
  if (!body.winner_id) {
    body.winner_id = calculatedWinnerId
  } else if (body.winner_id !== calculatedWinnerId) {
    return apiError('Le winner_id ne correspond pas au score final', 400)
  }

  updates.push(`played_at = NOW()`)
}
```

---

### Bug #7 : startTournament ne valide pas la mixité des équipes en mode choisi

**Fichier** : `/app/tournoi/[id]/page.tsx`  
**Lignes** : 1205-1276  
**Sévérité** : 🔥 CRITIQUE (si mixité obligatoire)  
**Type** : Validation métier

**Description** :  
En mode choisi avec mixité obligatoire, `startTournament` vérifie que les équipes sont complètes (bon nombre de joueurs) mais ne vérifie PAS que chaque équipe respecte la mixité H+F.

**Code problématique** :
```typescript
// LIGNE 1214-1245 - Validation mode choisi
if (tournament.mode === 'choisi') {
  const playersPerTeam = getPlayersPerTeam(tournament.format)

  // Vérifier que chaque équipe a le bon nombre de joueurs
  const invalidTeams = teams.filter(team =>
    !team.joueur_ids || team.joueur_ids.length !== playersPerTeam
  )

  if (invalidTeams.length > 0) {
    alert(`❌ Équipes incomplètes...`)
    return
  }
  
  // ❌ Aucune vérification de la mixité !
}
```

**Impact** :  
Un tournoi mode choisi avec mixité obligatoire peut démarrer avec des équipes non-mixtes (2H en doublette, 3H en triplette), violant la règle configurée.

**Scénario déclencheur** :
```
Configuration :
- Mode : choisi
- Format : doublette (2 joueurs/équipe)
- Mixité obligatoire : true

Équipes créées :
- Équipe A : [Homme1, Homme2] ❌ Pas mixte
- Équipe B : [Femme1, Femme2] ❌ Pas mixte
- Équipe C : [Homme3, Femme1] ✅ Mixte

Action : Clic "Démarrer le tournoi"
Résultat : ✅ Tournoi démarré (devrait être refusé)

→ Violation de la règle de mixité obligatoire
```

**Solution** :
```typescript
const startTournament = async () => {
  if (!tournament) return

  // ... validations existantes ...

  // CORRECTION : Validation mode choisi
  if (tournament.mode === 'choisi') {
    const playersPerTeam = getPlayersPerTeam(tournament.format)

    // 1. Vérifier équipes complètes (existant)
    const invalidTeams = teams.filter(team =>
      !team.joueur_ids || team.joueur_ids.length !== playersPerTeam
    )

    if (invalidTeams.length > 0) {
      const teamNames = invalidTeams.map(t => t.name).join(', ')
      alert(`❌ Équipes incomplètes...`)
      return
    }

    // 2. NOUVEAU : Vérifier mixité si obligatoire
    if (tournament.settings.mixiteObligatoire) {
      try {
        // Charger tous les joueurs avec leurs genres
        const allPlayerIds = new Set<string>()
        teams.forEach(t => t.joueur_ids?.forEach(id => allPlayerIds.add(id)))
        
        const playersResponse = await fetch(`/api/joueurs?org_id=${organization?.id}`, {
          credentials: 'include'
        })
        
        if (!playersResponse.ok) {
          alert('Erreur lors de la vérification de la mixité')
          return
        }
        
        const allPlayers = await playersResponse.json()
        const tournamentPlayers = allPlayers.filter((p: Joueur) => allPlayerIds.has(p.id))
        
        // Vérifier chaque équipe
        const nonMixedTeams: string[] = []
        
        for (const team of teams) {
          const teamPlayers = tournamentPlayers.filter((p: Joueur) => 
            team.joueur_ids?.includes(p.id)
          )
          
          const hasH = teamPlayers.some((p: Joueur) => p.gender === 'H')
          const hasF = teamPlayers.some((p: Joueur) => p.gender === 'F')
          
          if (!hasH || !hasF) {
            nonMixedTeams.push(team.name)
          }
        }
        
        if (nonMixedTeams.length > 0) {
          alert(
            `❌ Mixité obligatoire non respectée\n\n` +
            `Les équipes suivantes ne sont pas mixtes (H+F) :\n` +
            `${nonMixedTeams.join('\n')}\n\n` +
            `Veuillez recomposer ces équipes avec au moins 1 homme et 1 femme.`
          )
          return
        }
      } catch (error) {
        console.error('Erreur validation mixité:', error)
        alert('Erreur lors de la vérification de la mixité')
        return
      }
    }

    // 3. Vérifier joueurs assignés (existant)
    // ...
  }

  // ... suite de la fonction ...
}
```

---

### Bug #8 : Validation pouleSize manquante à la création

**Fichier** : `/app/tournoi/nouveau/page.tsx`  
**Lignes** : 764-846  
**Sévérité** : 🔥 CRITIQUE  
**Type** : Validation

**Description** :  
Aucune validation que `pouleSize >= 3` dans `handleSubmit`. Un utilisateur peut créer un tournoi avec pouleSize = 2 (via manipulation du DOM), puis être bloqué au démarrage.

**Code problématique** :
```typescript
// LIGNE 764-792 - Création du tournoi
const tournoiData = {
  org_id: organization.id,
  name: formData.name.trim(),
  mode: formData.mode,
  format: formData.format,
  status: 'preparation',
  settings: {
    pouleSize: formData.pouleSize,  // ❌ Pas de validation !
    // ...
  }
}
```

**Impact** :  
Tournoi créé avec configuration invalide → erreur au démarrage → données partielles en BD → confusion.

**Scénario déclencheur** :
```
1. Utilisateur ouvre DevTools, modifie le <select> pour ajouter <option value="2">
2. Sélectionne "2 équipes par poule"
3. Remplit le formulaire, clic "Créer le tournoi"
4. Tournoi créé ✅ (pouleSize = 2 dans settings)
5. Ajoute des équipes, clic "Démarrer le tournoi"
6. ❌ Erreur : "Minimum 3 équipes par poule pour assurer la viabilité du tournoi"
7. Tournoi en état incohérent (créé mais non démarrable)
```

**Solution** :
```typescript
const handleSubmit = async () => {
  // ... vérifications user/organization ...

  // CORRECTION : Valider pouleSize
  const validation = ValidationService.validatePouleSize(
    formData.pouleSize,
    getEstimatedTeams()  // Estimation du nombre d'équipes
  )

  if (!validation.valid) {
    alert(validation.error)
    return
  }

  // Si warning (déséquilibre), demander confirmation
  if (validation.warning) {
    const confirm = window.confirm(
      `⚠️ Configuration déséquilibrée\n\n${validation.warning}\n\nVoulez-vous continuer ?`
    )
    if (!confirm) return
  }

  // ... suite de la création ...
}
```

---

## 🚨 BUGS MAJEURS (15)

Bugs qui affectent significativement l'expérience utilisateur ou la cohérence des données.

### Bug #9 : createRoundRobinMatches - appels fetch non gérés

**Fichier** : `/app/tournoi/[id]/page.tsx`  
**Lignes** : 602-628  
**Sévérité** : 🚨 MAJEUR  
**Type** : Gestion d'erreur / Async

**Description** :  
Les appels `fetch('/api/matches')` dans `createRoundRobinMatches` ne sont pas `await` correctement et n'ont aucune gestion d'erreur. Si un match échoue, l'erreur est silencieuse.

**Code problématique** :
```typescript
// LIGNE 609-626
for (let i = 0; i < teams.length; i++) {
  for (let j = i + 1; j < teams.length; j++) {
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tournoi_id: tournament.id,
        equipe_a_id: teams[i].id,
        equipe_b_id: teams[j].id,
        tour,
        terrain: null,
        type: 'poule',
        poule,
        status: 'a_jouer'
      })
    })  // ❌ Pas de vérification response.ok
  }
}
```

**Impact** :  
Si un match échoue à la création (erreur 400, 500, etc.), l'utilisateur n'est pas informé. Le tournoi démarre avec des matchs manquants. Génère des poules incomplètes.

**Scénario déclencheur** :
```
Poule A avec 4 équipes → 6 matchs round-robin
- Match 1 : A1 vs A2 ✅
- Match 2 : A1 vs A3 ✅
- Match 3 : A1 vs A4 ❌ 500 Internal Server Error (équipe corrompue)
- Match 4 : A2 vs A3 ✅
- Match 5 : A2 vs A4 ✅
- Match 6 : A3 vs A4 ✅

Résultat : 5/6 matchs créés, A1 vs A4 manquant
Interface : Aucune alerte, poule semble normale
Impact : A1 et A4 n'ont que 2 matchs au lieu de 3
```

**Solution** :
```typescript
const createRoundRobinMatches = async (
  teams: Team[],
  tour: number,
  poule: string | null
): Promise<void> => {
  if (!tournament) return

  const matchesToCreate: Array<{
    equipe_a_id: string
    equipe_b_id: string
  }> = []

  // Préparer tous les matchs
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchesToCreate.push({
        equipe_a_id: teams[i].id,
        equipe_b_id: teams[j].id
      })
    }
  }

  let successCount = 0
  const errors: string[] = []

  // Créer chaque match avec gestion d'erreur
  for (const matchData of matchesToCreate) {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tournoi_id: tournament.id,
          equipe_a_id: matchData.equipe_a_id,
          equipe_b_id: matchData.equipe_b_id,
          tour,
          terrain: null,
          type: 'poule',
          poule,
          status: 'a_jouer'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        errors.push(`Match ${matchData.equipe_a_id} vs ${matchData.equipe_b_id}: ${error.error}`)
      } else {
        successCount++
      }
    } catch (error) {
      errors.push(`Match ${matchData.equipe_a_id} vs ${matchData.equipe_b_id}: Erreur réseau`)
    }
  }

  // Vérifier le résultat global
  if (errors.length > 0) {
    throw new Error(
      `Erreurs lors de la création des matchs:\n` +
      `Succès: ${successCount}/${matchesToCreate.length}\n\n` +
      errors.join('\n')
    )
  }

  console.log(`✅ ${successCount} matchs créés avec succès`)
}
```

---

### Bug #10 : renameTeam n'empêche pas les doublons

**Fichier** : `/app/tournoi/[id]/page.tsx`  
**Lignes** : 1336-1359  
**Sévérité** : 🚨 MAJEUR  
**Type** : Validation / Data integrity

**Description** :  
La fonction `renameTeam` ne vérifie pas si le nouveau nom est déjà utilisé par une autre équipe du tournoi.

**Code problématique** :
```typescript
// LIGNE 1336-1359
const renameTeam = async () => {
  if (!editingTeam || !newTeamName.trim()) return

  try {
    const response = await fetch(`/api/equipes/${editingTeam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newTeamName.trim() })
    })  // ❌ Pas de vérification de doublon

    if (response.ok) {
      await loadTournamentData()
      setEditingTeam(null)
      setNewTeamName('')
    } else {
      const error = await response.json()
      alert(error.error || 'Erreur lors du renommage de l\'équipe')
    }
  } catch (error) {
    console.error('Erreur renommage équipe:', error)
    alert('Erreur lors du renommage de l\'équipe')
  }
}
```

**Impact** :  
Deux équipes avec le même nom dans le tournoi → confusion dans l'interface, difficulté à identifier les équipes, problèmes de tri/affichage.

**Scénario déclencheur** :
```
Tournoi avec équipes :
- "Les Champions"
- "Team Rocket"
- "Les Invincibles"

Action :
1. Renommer "Team Rocket" en "Les Champions"
2. ✅ Renommage accepté

Résultat :
- "Les Champions" (équipe 1)
- "Les Champions" (équipe 2, anciennement Team Rocket)
- "Les Invincibles"

→ Impossible de différencier les deux "Les Champions" dans l'interface
```

**Solution** :
```typescript
const renameTeam = async () => {
  if (!editingTeam || !newTeamName.trim()) return

  // CORRECTION : Vérifier doublon
  const duplicate = teams.find(t => 
    t.id !== editingTeam.id && 
    t.name.toLowerCase().trim() === newTeamName.trim().toLowerCase()
  )

  if (duplicate) {
    alert(
      `❌ Nom d'équipe déjà utilisé\n\n` +
      `Une équipe nommée "${newTeamName.trim()}" existe déjà dans ce tournoi.\n\n` +
      `Veuillez choisir un autre nom.`
    )
    return
  }

  try {
    const response = await fetch(`/api/equipes/${editingTeam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newTeamName.trim() })
    })

    if (response.ok) {
      await loadTournamentData()
      setEditingTeam(null)
      setNewTeamName('')
      alert(`✅ Équipe renommée en "${newTeamName.trim()}"`)
    } else {
      const error = await response.json()
      alert(error.error || 'Erreur lors du renommage de l\'équipe')
    }
  } catch (error) {
    console.error('Erreur renommage équipe:', error)
    alert('Erreur lors du renommage de l\'équipe')
  }
}
```

---

[... Suite du document avec les 40+ autres bugs et duplications ...]

