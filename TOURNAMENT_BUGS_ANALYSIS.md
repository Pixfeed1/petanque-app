# Tournament Logic Bug Analysis - /app/tournoi/[id]/page.tsx

## Critical Bugs

### BUG #1: Elimination Bracket Match Creation Loop Condition (Line 666)
**Severity: CRITICAL** - Teams will be excluded from elimination rounds

**Location:** Lines 629-689, specifically line 666
```typescript
for (let i = 0; i < nbMatches && i * 2 + 1 < qualified.length; i++) {
  // Creates matches using qualified[i * 2] and qualified[i * 2 + 1]
}
```

**Problem:**
The loop condition checks `i * 2 + 1 < qualified.length`, which prevents matches from being created if there isn't a second team at that index. This causes:
- **For 5 qualified teams**: nextPower = 8, nbMatches = 4 set (lines 653-655)
  - i=0: teams[0] vs teams[1] ✓ created (0*2+1=1 < 5)
  - i=1: teams[2] vs teams[3] ✓ created (1*2+1=3 < 5)
  - i=2: teams[4] vs teams[5] ✗ NOT created (2*2+1=5 NOT < 5)
  - i=3: teams[6] vs teams[7] ✗ NOT created (3*2+1=7 NOT < 5)
  - **Result: Only 2 matches created instead of 4, team 4 gets no opponent**

- **For 3 qualified teams**: nextPower = 4, nbMatches = 2 set (lines 656-658)
  - i=0: teams[0] vs teams[1] ✓ created (0*2+1=1 < 3)
  - i=1: teams[2] vs teams[3] ✗ NOT created (1*2+1=3 NOT < 3)
  - **Result: Only 1 match created instead of 2**

**What Goes Wrong:**
- Fewer matches than expected are created
- Some teams don't have opponents in elimination rounds
- User is told nbMatches matches will be created (line 683) but fewer actually get created
- Some qualified teams are eliminated without playing

**Fix Needed:**
The loop should allow creating matches with null opponents or use bracket logic that properly handles odd numbers:
```typescript
// Option 1: Create all nbMatches, some with bye rounds
for (let i = 0; i < nbMatches; i++) {
  // Handle case where i * 2 + 1 >= qualified.length (add bye or leave null)
}
```

---

### BUG #2: Player Exclusion in Mêlée Tournante Team Creation (Lines 813-831)
**Severity: CRITICAL** - Players will not participate in some rotations

**Location:** Lines 813-831, specifically line 814
```typescript
const nbEquipes = Math.floor(players.length / teamSize)
// ... later in non-mixed case:
for (let i = 0; i < nbEquipes; i++) {
  const teamPlayers = shuffled.slice(i * teamSize, (i + 1) * teamSize).map(p => p.id)
  newTeams.push({ name: `R${rotationNumber}-Équipe ${teamNumber}`, joueur_ids: teamPlayers })
}
```

**Problem:**
When teamSize divides unevenly into players.length, leftover players are completely excluded:
- **11 players, doublette (teamSize=2)**: nbEquipes = Math.floor(11/2) = 5
  - Creates 5 teams (10 players), **1 player excluded**
- **11 players, triplette (teamSize=3)**: nbEquipes = Math.floor(11/3) = 3
  - Creates 3 teams (9 players), **2 players excluded**
- **7 players, triplette**: nbEquipes = Math.floor(7/3) = 2
  - Creates 2 teams (6 players), **1 player excluded**

**What Goes Wrong:**
- Excluded players get no match in that rotation
- Unfair tournament as some players play while others don't
- Creates gaps in player statistics tracking
- Breaks "mêlée tournante" principle where everyone should rotate together

**Fix Needed:**
```typescript
// Create all possible teams, even if the last one is incomplete
// OR require that the pool size evenly divides player count
// OR implement a proper bye round system
const nbEquipes = Math.ceil(players.length / teamSize)
// Then handle the last team being potentially incomplete
```

---

### BUG #3: Elimination Match Creation Creates Null Team IDs (Line 674)
**Severity: CRITICAL** - Invalid match data with null team IDs

**Location:** Lines 667-680
```typescript
body: JSON.stringify({
  tournoi_id: tournament.id,
  equipe_a_id: qualified[i * 2].id,
  equipe_b_id: qualified[i * 2 + 1]?.id || null,  // ← NULL TEAM ID!
  tour: 1,
  terrain: null,
  type: matchType,
  status: 'a_jouer'
})
```

**Problem:**
When a team doesn't exist at index `i * 2 + 1`, the code uses `|| null`, creating matches with null team IDs.

Combined with Bug #1, this creates invalid match states:
- Match object has equipe_b_id = null
- This breaks downstream logic that expects both teams to exist
- Can't render match UI properly
- Can't calculate results or rankings

**What Goes Wrong:**
- Database corruption with invalid match records
- Frontend crashes when trying to display null team
- Qualification logic fails when trying to find team stats
- Reports showing incomplete/invalid matches

**Fix Needed:**
Either:
1. Don't create matches if both teams aren't available
2. Implement proper bye round handling (team automatically advances)
3. Pad the bracket with placeholder teams

---

## High-Priority Bugs

### BUG #4: Draw Handling in Finals Generation (Lines 717, 720)
**Severity: HIGH** - Draw matches don't have winners determined

**Location:** Lines 716-724
```typescript
demiMatches.forEach(match => {
  if (match.score_a > match.score_b) {
    winners.push(match.equipe_a_id || '')
    losers.push(match.equipe_b_id || '')
  } else {  // ← This also catches score_a === score_b (draw!)
    winners.push(match.equipe_b_id || '')
    losers.push(match.equipe_a_id || '')
  }
})
```

**Problem:**
If a semi-final match ends in a draw (score_a === score_b), the code treats it as team B winning. There's no handling for:
- Determining actual winner in case of draw
- Extra time/penalty rounds
- Disallowing draws in elimination format

**What Goes Wrong:**
- Wrong team advances to final
- Wrong team goes to petite finale
- Results are incorrect and unfair
- User has no way to specify who won on draws

**Fix Needed:**
```typescript
// Either prevent draws in elimination format
// OR handle draws explicitly with extra rules
if (match.score_a > match.score_b) {
  // team A wins
} else if (match.score_b > match.score_a) {
  // team B wins  
} else {
  // Handle draw: need extra time, penalties, or validation
  console.warn('Draw in elimination match - needs manual resolution')
}
```

---

### BUG #5: Draw Handling in Pool Qualification (Lines 584-591)
**Severity: HIGH** - Draws count as defeats in pool rankings

**Location:** Lines 573-619, specifically lines 584-591
```typescript
teamMatches.forEach(m => {
  if (m.equipe_a_id === team.id) {
    if (m.score_a > m.score_b) victories++
    pointsFor += m.score_a
    pointsAgainst += m.score_b
    // ← Missing: else if (m.score_a === m.score_b) draw++
  } else {
    if (m.score_b > m.score_a) victories++
    pointsFor += m.score_b
    pointsAgainst += m.score_a
    // ← Missing: else if (m.score_b === m.score_a) draw++
  }
})
```

**Problem:**
If score_a === score_b (draw), neither victory nor defeat is counted, which loses the match from rankings calculation. The team appears to have fewer played matches than they actually did.

Also FIPJP rules don't distinguish draws from defeats, so ranking could be unfair.

**What Goes Wrong:**
- Team that draws a match disappears from standings
- Fewer victories + fewer defeats = lower win rate but unfairly
- Pool standings are incomplete and inaccurate
- Teams with draws appear to have fewer games played than reality

**Fix Needed:**
```typescript
// Track draws separately or count them appropriately
if (m.equipe_a_id === team.id) {
  if (m.score_a > m.score_b) victories++
  else if (m.score_a < m.score_b) defeats++
  // else it's a draw - may need special handling per FIPJP rules
}
```

---

### BUG #6: Draw Handling in Individual Rankings (Lines 415-427)
**Severity: HIGH** - Individual player stats don't count draws

**Location:** Lines 415-427
```typescript
teamMatches.forEach((match: Match) => {
  if (match.equipe_a_id === team.id) {
    pointsFor += match.score_a || 0
    pointsAgainst += match.score_b || 0
    if (match.score_a > match.score_b) victories++
    else defeats++  // ← Draws counted as defeats!
  } else {
    pointsFor += match.score_b || 0
    pointsAgainst += match.score_a || 0
    if (match.score_b > match.score_a) victories++
    else defeats++  // ← Draws counted as defeats!
  }
})
```

**Problem:**
When score_a === score_b, the code falls through to `defeats++`. This means:
- Draws are incorrectly counted as defeats
- Player win/loss ratio is artificially worse
- Individual rankings are unfair
- Classement individuel (mêlée tournante mode) is corrupted

**What Goes Wrong:**
- Individual player ranking shows worse record than they have
- Players with draws penalized compared to players with wins/losses balance
- Unfair player selection for subsequent rounds
- Historical data is incorrect

**Fix Needed:**
```typescript
if (match.score_a > match.score_b) victories++
else if (match.score_a < match.score_b) defeats++
else { 
  // Handle draw: may need separate tracking or per FIPJP rules
  draws++ // track draws separately
}
```

---

### BUG #7: Pool Names Extraction Filters Out Potential Valid Pools (Line 557)
**Severity: MEDIUM-HIGH** - Could silently drop entire pools from qualification

**Location:** Lines 555-558
```typescript
const pouleMatches = matches.filter(m => m.type === 'poule')
const allPouleMatchesFinished = pouleMatches.every(m => m.status === 'termine')
// ...
const pouleNames = [...new Set(pouleMatches.map(m => m.poule))].filter(Boolean)
```

**Problem:**
The `.filter(Boolean)` at the end removes any pool with a falsy poule value (null, undefined, empty string, 0, false). If any pool matches have missing poule names due to data corruption or bugs, those teams are silently excluded from qualification.

**What Goes Wrong:**
- Teams from unnamed pools don't qualify for elimination rounds
- Silent failure with no error message
- User thinks all teams qualified when some didn't
- Some tournament participants get no elimination matches

**Fix Needed:**
```typescript
// Explicitly check for valid pool names
const pouleNames = [...new Set(
  pouleMatches
    .map(m => m.poule)
    .filter(name => name && typeof name === 'string')
)]

// Or add validation earlier
if (pouleMatches.some(m => !m.poule)) {
  console.warn('Some pool matches missing pool name')
}
```

---

## Medium-Priority Bugs

### BUG #8: Pool Team Distribution Not Shuffled (Lines 505-509)
**Severity: MEDIUM** - Pool seeding can be unfair

**Location:** Lines 505-509
```typescript
const poules: { [key: string]: Team[] } = {}
for (let i = 0; i < nbPoules; i++) {
  const pouleName = String.fromCharCode(65 + i)
  poules[pouleName] = teams.slice(i * pouleSize, (i + 1) * pouleSize)
}
```

**Problem:**
Teams are distributed to pools in the exact order they exist in the array without shuffling. If teams are ranked or sorted (strong teams first), all strong teams end up in early pools.

**What Goes Wrong:**
- Pool A has the 4 strongest teams
- Pool B has next 4 strongest
- etc.
- Creates unfair competition where some pools are much harder than others
- Top teams might eliminate each other in same pool while weaker pools produce weak qualifiers

**Fix Needed:**
```typescript
// Shuffle teams before distributing to pools
const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
const poules: { [key: string]: Team[] } = {}
for (let i = 0; i < nbPoules; i++) {
  const pouleName = String.fromCharCode(65 + i)
  poules[pouleName] = shuffledTeams.slice(i * pouleSize, (i + 1) * pouleSize)
}
```

---

### BUG #9: Finals Generation Doesn't Validate Semi-final Order (Lines 716-724)
**Severity: MEDIUM** - Wrong bracket seeding in finals

**Location:** Lines 716-724
```typescript
const winners: string[] = []
const losers: string[] = []

demiMatches.forEach(match => {
  if (match.score_a > match.score_b) {
    winners.push(match.equipe_a_id || '')
    losers.push(match.equipe_b_id || '')
  } else {
    winners.push(match.equipe_b_id || '')
    losers.push(match.equipe_a_id || '')
  }
})

// Then uses winners[0], winners[1], losers[0], losers[1]
```

**Problem:**
The code assumes:
1. demiMatches are in consistent order (not guaranteed)
2. demiMatches[0] winner vs demiMatches[1] winner in final (not specified)
3. demiMatches[0] loser vs demiMatches[1] loser in petite finale (not specified)

If demiMatches come back in random order, the bracket seeding is unpredictable.

**What Goes Wrong:**
- Finals bracket seeding is unclear/random
- Not following standard tournament rules (e.g., winner of match 1 vs winner of match 2)
- Could create situation where 1st vs 2nd in same semi don't meet in final
- Unfair advantage from arbitrary bracket ordering

**Fix Needed:**
```typescript
// Sort demiMatches by ID or explicit round number
// Then properly pair them: match[0] vs match[1], etc.
const sortedDemis = demiMatches.sort((a, b) => (a.id || '').localeCompare(b.id || ''))
if (sortedDemis.length >= 2) {
  const winner1 = sortedDemis[0].score_a > sortedDemis[0].score_b ? sortedDemis[0].equipe_a_id : sortedDemis[0].equipe_b_id
  const winner2 = sortedDemis[1].score_a > sortedDemis[1].score_b ? sortedDemis[1].equipe_a_id : sortedDemis[1].equipe_b_id
  // etc.
}
```

---

### BUG #10: Rotation Number Calculation Doesn't Account for Incomplete Last Rotation (Line 821)
**Severity: MEDIUM** - Incorrect rotation numbering in mêlée tournante

**Location:** Line 821
```typescript
const rotationNumber = Math.floor(teams.length / nbEquipes) + 1
```

**Problem:**
This assumes all rotations have created the same number of teams, but due to Bug #2 (player exclusion), the last rotation might have fewer teams. This makes the calculation incorrect.

**Example:**
- 11 players, triplette (teamSize=3)
- Rotation 1: 3 teams created (9 players), 2 excluded
- Rotation 2: teams.length = 3, nbEquipes = 3
- rotationNumber = floor(3/3) + 1 = 1 + 1 = 2 ✓ (correct by accident)
- Rotation 3: teams.length = 6, nbEquipes = 3
- rotationNumber = floor(6/3) + 1 = 2 + 1 = 3 ✓ (correct by accident)

But if previous rotation had fewer teams created, this breaks.

**What Goes Wrong:**
- Rotation names might be out of sequence
- Difficult to track which rotation teams belong to
- Analytics and reporting on rotations becomes confusing

**Fix Needed:**
```typescript
// Track rotation number explicitly as state
// Or use tournament state to determine current rotation
// Rather than calculating from team count
```

---

### BUG #11: Terrain Assignment Missing Validation (Line 955)
**Severity: MEDIUM** - Terrain conflicts not fully prevented

**Location:** Lines 946-990, specifically lines 953-956
```typescript
const conflicts = matches.filter(m =>
  m.id !== matchId &&
  m.terrain === terrain &&
  (m.status === 'en_cours' || m.status === 'a_jouer')
)
```

**Problem:**
The conflict check only looks for 'en_cours' and 'a_jouer' status, but doesn't check:
1. If the new match's status would conflict (if match hasn't started yet)
2. If both matches would play at overlapping times (no time data in filter)
3. If terrain is within valid range (1 to settings.terrains)
4. If terrain is null/undefined

Also, the user can confirm conflicts (line 974), allowing truly invalid states.

**What Goes Wrong:**
- Multiple matches can be assigned the same terrain during same timeframe
- No validation that terrain number exists (could be terrain 99 when only 3 exist)
- Terrain 0 might get assigned (invalid)
- Matches assigned to wrong terrain despite confirmation dialog

**Fix Needed:**
```typescript
// Validate terrain number
if (terrain < 1 || terrain > tournament.settings.terrains) {
  alert(`Terrain must be between 1 and ${tournament.settings.terrains}`)
  return
}

// Check all active matches, not just en_cours
const conflicts = matches.filter(m =>
  m.id !== matchId &&
  m.terrain === terrain &&
  (m.status === 'en_cours' || m.status === 'a_jouer' || m.status === 'en_attente_validation')
)

// Don't allow confirmation to override invalid data
```

---

### BUG #12: No Validation for Null Terrain on Match Start (Implicit)
**Severity: MEDIUM** - Matches can be played without assigned terrain

**Location:** Lines 525, 676, 737, 755 (match creation) + implicit lack of validation before play

**Problem:**
All matches are created with `terrain: null`, but there's no validation requiring terrain assignment before a match can start or be marked as 'en_cours'.

**What Goes Wrong:**
- Matches can be played without knowing which terrain they're on
- Tournament organization becomes chaotic
- Can't track terrain usage for scheduling
- Conflicts between matches not properly managed

**Fix Needed:**
```typescript
// Before allowing a match to start
if (!match.terrain) {
  alert('Vous devez assigner un terrain avant de démarrer le match')
  return
}

// Prevent saving 'en_cours' status without terrain
if (newStatus === 'en_cours' && !match.terrain) {
  throw new Error('Terrain required before starting match')
}
```

---

## Summary Table

| Bug # | Severity | Category | Issue | Fix Complexity |
|-------|----------|----------|-------|-----------------|
| 1 | CRITICAL | Elimination | Match loop creates wrong # of matches | High |
| 2 | CRITICAL | Mêlée | Players excluded from rotations | High |
| 3 | CRITICAL | Elimination | Null team IDs in matches | High |
| 4 | HIGH | Finals | Draw handling in finals | Medium |
| 5 | HIGH | Pools | Draw handling in pool ranking | Medium |
| 6 | HIGH | Individual | Draw handling in individual stats | Medium |
| 7 | HIGH | Pools | Pool name filtering | Low |
| 8 | MEDIUM | Pools | No pool shuffling | Low |
| 9 | MEDIUM | Finals | Finals bracket seeding | Medium |
| 10 | MEDIUM | Mêlée | Rotation number calculation | Medium |
| 11 | MEDIUM | Terrain | Terrain validation gaps | Low |
| 12 | MEDIUM | Terrain | No terrain requirement validation | Low |

