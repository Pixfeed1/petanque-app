// VRAIES parties jouées dans l'UI (scores mène par mène), en volume, pour les 4 modes.
// MODE=melee_fixe|melee_tournante|choisi|personnalise. Rapporte le nombre RÉELLEMENT
// terminé (interrogeable en base). Aucune API pour scorer — tout passe par l'interface.
import { chromium } from 'playwright'
import fs from 'node:fs'

const TOKEN = fs.readFileSync(process.env.TOKEN_FILE, 'utf8').trim()
const BASE = 'http://localhost:3000'
const H = { Cookie: `auth-token=${TOKEN}` }
const N = parseInt(process.env.N || '30')
const MODE = process.env.MODE || 'melee_fixe'
const PREFIX = process.env.PREFIX || `UITEST-${MODE}`
const D = process.env.OUTDIR
const MODE_CARD = { melee_fixe: 'Mêlée fixe', melee_tournante: 'Mêlée tournante', choisi: 'Mode choisi', personnalise: 'Personnalisé' }[MODE]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ viewport: { width: 1150, height: 1200 } })
await ctx.addCookies([{ name: 'auth-token', value: TOKEN, domain: 'localhost', path: '/' }])
const page = await ctx.newPage()

const click = async (t, to = 10000) => { const e = page.getByText(t, { exact: false }).first(); await e.waitFor({ state: 'visible', timeout: to }); await e.click() }
const tryClick = async (t, to = 4000) => { try { await click(t, to); return true } catch { return false } }
const conf = async () => { await page.waitForTimeout(600); await page.getByRole('button', { name: 'Démarrer', exact: true }).first().click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1800) }
const closeUp = async () => {
  // La clôture est dans le menu « ⋯ » (Actions du tournoi) → « Clôturer le tournoi » → confirmation.
  await page.getByRole('button', { name: 'Actions du tournoi' }).click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(500)
  await tryClick('Clôturer', 4000)
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'Confirmer', exact: true }).first().click({ timeout: 3000 }).catch(() => {})
  await page.getByRole('button', { name: 'Clôturer', exact: true }).first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(1500)
}
const getTournoi = async (tid) => (await (await fetch(`${BASE}/api/tournois/${tid}`, { headers: H })).json())
const pendingMatches = async (tid) => { const d = await (await fetch(`${BASE}/api/matches?tournoi_id=${tid}`, { headers: H })).json(); const ms = Array.isArray(d) ? d : d.matches || []; return ms.filter(m => m.equipe_b && m.status !== 'termine').map(m => m.id) }
const reload = async (tid) => {
  await page.goto(`${BASE}/tournoi/${tid}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !document.body.innerText.includes('Chargement'), { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
}

async function playMatchUI(mid) {
  await page.goto(`${BASE}/match/${mid}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.innerText.includes('Mène') || document.body.innerText.includes('emportent'), { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
  for (let mene = 0; mene < 10; mene++) {
    if (await page.getByText('emportent', { exact: false }).count() > 0) break
    const plusA = page.getByRole('button', { name: '+1' }).first()
    let clicked = 0
    for (let k = 0; k < 7; k++) { if (await plusA.isDisabled().catch(() => true)) break; await plusA.click().catch(() => {}); clicked++; await page.waitForTimeout(70) }
    if (clicked === 0) await plusA.click().catch(() => {})
    const valider = page.getByText('Valider la mène', { exact: false }).first()
    if (await valider.count() === 0) break
    await valider.click().catch(() => {})
    await page.waitForTimeout(600)
    if (await page.getByRole('button', { name: 'Confirmer', exact: true }).count() > 0) {
      await page.getByRole('button', { name: 'Confirmer', exact: true }).first().click().catch(() => {})
      await page.waitForTimeout(1200); break
    }
  }
}
const playPending = async (tid) => { for (const mid of await pendingMatches(tid)) await playMatchUI(mid) }

async function createTournament(name) {
  await page.goto(`${BASE}/tournoi/nouveau`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1000)
  await page.locator('input[placeholder*="printemps"]').fill(name)
  await click('Continuer'); await page.waitForTimeout(300)
  await click(MODE_CARD); await click('Doublette'); await click('Continuer'); await page.waitForTimeout(300)
  await click('Tout sélectionner'); await page.waitForTimeout(200); await click('Continuer'); await page.waitForTimeout(400)
  if (MODE === 'melee_fixe' || MODE === 'choisi') await tryClick('Petite finale', 2500)
  // personnalise : défauts (formation aléatoire, structure manches, 3 manches) → rien à changer
  await click('Continuer'); await page.waitForTimeout(300)
  await click('Créer le tournoi'); await page.waitForURL(/\/tournoi\/\d+/, { timeout: 20000 })
  return page.url().match(/\/tournoi\/(\d+)/)[1]
}

async function startTournament(tid) {
  await reload(tid)
  if (MODE === 'choisi') {
    await click('Créer les équipes', 8000); await page.waitForTimeout(1000)
    await click('Répartir automatiquement', 6000); await page.waitForTimeout(1800)
    await tryClick('Continuer plus tard', 3000)
    await reload(tid)
  }
  await click('Démarrer le tournoi', 8000); await conf()
}

async function playTournament(name) {
  const tid = await createTournament(name)
  await startTournament(tid)

  if (MODE === 'melee_tournante') {
    for (let r = 0; r < 3; r++) { await playPending(tid); await reload(tid); if (!await tryClick('Nouvelle rotation', 5000)) break; await page.waitForTimeout(1500) }
    await playPending(tid); await reload(tid); await closeUp()
  } else if (MODE === 'personnalise') {
    for (let s = 0; s < 10; s++) {
      await playPending(tid); await reload(tid)
      if ((await getTournoi(tid)).status === 'termine') break
      if (!await tryClick('Manche suivante', 5000)) { if ((await pendingMatches(tid)).length === 0) { await closeUp(); break } }
      await page.waitForTimeout(1500)
    }
  } else { // melee_fixe, choisi : poules → élimination
    for (let s = 0; s < 12; s++) {
      await playPending(tid); await reload(tid)
      if ((await getTournoi(tid)).status === 'termine') break
      const adv = await tryClick('Lancer les phases finales', 6000) || await tryClick('Lancer les quarts', 5000) || await tryClick('Lancer les demi', 5000) || await tryClick('Lancer la finale', 5000)
      await page.waitForTimeout(1500)
      if (!adv && (await pendingMatches(tid)).length === 0) { await reload(tid); await closeUp(); break }
    }
  }
  return { tid, status: (await getTournoi(tid)).status }
}

let completed = 0, played = 0
for (let i = 1; i <= N; i++) {
  try {
    const r = await playTournament(`${PREFIX} #${i}`)
    played++; if (r.status === 'termine') completed++
    console.log(`[${MODE}] #${i} tid=${r.tid} status=${r.status} | terminés=${completed}/${played}`)
    if (completed <= 2 && r.status === 'termine') await page.screenshot({ path: `${D}/${MODE}-${i}.png`, fullPage: true }).catch(() => {})
  } catch (e) { console.log(`[${MODE}] #${i} ERREUR: ${(e.message || e).slice(0, 100)}`) }
}
console.log(`\n=== ${MODE} : ${completed} terminés / ${played} joués (cible ${N}) ===`)
await browser.close()
