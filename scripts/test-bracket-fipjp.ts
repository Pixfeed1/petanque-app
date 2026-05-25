// scripts/test-bracket-fipjp.ts
// Couvre TOUS les cas de bracket FIPJP pour N=2 à 16 équipes qualifiées

import { generateFirstRoundPairs } from '../lib/services/bracket.service'

const log = {
  step: (s: string) => console.log('\n━━━ ' + s + ' ━━━'),
  ok: (s: string) => console.log('  ✅ ' + s),
  err: (s: string) => console.log('  ❌ ' + s),
  info: (s: string) => console.log('  ℹ️  ' + s)
}

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Seed${i + 1}`
  }))
}

function nextPow2(n: number): number {
  if (n <= 2) return 2
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

let totalTests = 0
let passedTests = 0
const failures: string[] = []

function test(name: string, condition: boolean, detail?: string) {
  totalTests++
  if (condition) {
    log.ok(name)
    passedTests++
  } else {
    log.err(name + (detail ? ` — ${detail}` : ''))
    failures.push(name + (detail ? ` (${detail})` : ''))
  }
}

for (let N = 2; N <= 16; N++) {
  log.step(`N = ${N} équipes qualifiées (round vers ${nextPow2(N)})`)

  const teams = makeTeams(N)
  const pairs = generateFirstRoundPairs(teams)

  const expectedTotal = nextPow2(N) / 2
  const expectedByes = nextPow2(N) - N
  const actualByes = pairs.filter(p => p.isBye).length

  // Test 1 : Nombre total de pairs
  test(
    `Total pairs = ${expectedTotal}`,
    pairs.length === expectedTotal,
    `obtenu ${pairs.length}`
  )

  // Test 2 : Nombre de BYE
  test(
    `BYE = ${expectedByes}`,
    actualByes === expectedByes,
    `obtenu ${actualByes}`
  )

  // Test 3 : Toutes les pairs ont teamA
  test(
    'Toutes les pairs ont teamA',
    pairs.every(p => p.teamA !== null && p.teamA !== undefined)
  )

  // Test 4 : Les pairs non-BYE ont 2 équipes distinctes
  const nonByePairs = pairs.filter(p => !p.isBye)
  test(
    'Pairs non-BYE : teamA ≠ teamB',
    nonByePairs.every(p => p.teamA && p.teamB && p.teamA.id !== p.teamB.id)
  )

  // Test 5 : Pas de doublon (chaque équipe apparaît exactement 1 fois)
  const allTeamIds = new Set<string>()
  let duplicate = false
  for (const p of pairs) {
    if (p.teamA) {
      if (allTeamIds.has(p.teamA.id)) duplicate = true
      allTeamIds.add(p.teamA.id)
    }
    if (p.teamB && !p.isBye) {
      if (allTeamIds.has(p.teamB.id)) duplicate = true
      allTeamIds.add(p.teamB.id)
    }
  }
  test(
    `Chaque équipe apparaît 1 fois (total uniques: ${allTeamIds.size}/${N})`,
    !duplicate && allTeamIds.size === N
  )

  // Test 6 : Top seeds protégés (Seed 1 ne joue pas contre Seed 2 si N < puissance de 2)
  if (N >= 3 && N < nextPow2(N)) {
    const seed1Pair = pairs.find(p => p.teamA?.id === 't1' || p.teamB?.id === 't1')
    const playsAgainstSeed2 = seed1Pair && !seed1Pair.isBye &&
      ((seed1Pair.teamA?.id === 't1' && seed1Pair.teamB?.id === 't2') ||
       (seed1Pair.teamB?.id === 't1' && seed1Pair.teamA?.id === 't2'))
    test(
      `Seed 1 protégé (pas contre Seed 2 au 1er tour)`,
      !playsAgainstSeed2
    )
  }

  // Test 7 : Quand BYE > 0, le top seed (Seed 1) doit l'avoir
  if (expectedByes > 0) {
    const seed1Pair = pairs.find(p => p.teamA?.id === 't1' || p.teamB?.id === 't1')
    test(
      'Seed 1 a un BYE (top seed exempt au 1er tour)',
      seed1Pair?.isBye === true
    )
  }

  // Affichage visuel
  console.log('  Bracket :')
  pairs.forEach((p, i) => {
    if (p.isBye) {
      log.info(`    Match ${i + 1}: ${p.teamA?.name} vs BYE (exempt) [round=${p.round}]`)
    } else {
      log.info(`    Match ${i + 1}: ${p.teamA?.name} vs ${p.teamB?.name} [round=${p.round}]`)
    }
  })
}

log.step(`RÉSUMÉ FINAL`)
console.log(`\n  ${passedTests}/${totalTests} tests passés\n`)

if (failures.length > 0) {
  console.log('  Échecs :')
  failures.forEach(f => console.log('    ❌ ' + f))
  process.exit(1)
} else {
  console.log('  ✅ TOUS LES TESTS PASSÉS — bracket FIPJP correct pour N=2 à 16')
  process.exit(0)
}
