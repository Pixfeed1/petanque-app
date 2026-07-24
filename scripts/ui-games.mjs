// VRAIES parties jouées dans l'UI (saisie des scores mène par mène), en volume.
// Rapporte le nombre RÉELLEMENT terminé (interrogeable en base). Pas d'API pour scorer.
import { chromium } from 'playwright'
import fs from 'node:fs'

const TOKEN = fs.readFileSync(process.env.TOKEN_FILE, 'utf8').trim()
const BASE = 'http://localhost:3000'
const H = { Cookie: `auth-token=${TOKEN}` }
const N = parseInt(process.env.N || '30')
const PREFIX = process.env.PREFIX || 'UITEST-MF'
const D = process.env.OUTDIR

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ viewport: { width: 1150, height: 1200 } })
await ctx.addCookies([{ name: 'auth-token', value: TOKEN, domain: 'localhost', path: '/' }])
const page = await ctx.newPage()

const click = async (t, to = 10000) => { const e = page.getByText(t, { exact: false }).first(); await e.waitFor({ state: 'visible', timeout: to }); await e.click() }
const tryClick = async (t, to = 3500) => { try { await click(t, to); return true } catch { return false } }
const conf = async () => { await page.waitForTimeout(600); await page.getByRole('button', { name: 'Démarrer', exact: true }).first().click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1800) }
const getTournoi = async (tid) => (await (await fetch(`${BASE}/api/tournois/${tid}`, { headers: H })).json())
const pendingMatches = async (tid) => { const d = await (await fetch(`${BASE}/api/matches?tournoi_id=${tid}`, { headers: H })).json(); const ms = Array.isArray(d) ? d : d.matches || []; return ms.filter(m => m.equipe_b && m.status !== 'termine').map(m => m.id) }
const reload = async (tid) => {
  await page.goto(`${BASE}/tournoi/${tid}`, { waitUntil: 'domcontentloaded' })
  // Le serveur de dev est lent à compiler : attendre le vrai contenu (plus « Chargement… »).
  await page.waitForFunction(() => !document.body.innerText.includes('Chargement'), { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
}

// Joue UN match dans la vraie page /match : mènes jusqu'à 13 pour l'équipe A, puis Confirmer.
async function playMatchUI(mid) {
  await page.goto(`${BASE}/match/${mid}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.innerText.includes('Mène') || document.body.innerText.includes('emportent'), { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
  for (let mene = 0; mene < 10; mene++) {
    if (await page.getByText('emportent', { exact: false }).count() > 0) break
    const plusA = page.getByRole('button', { name: '+1' }).first()
    let clicked = 0
    for (let k = 0; k < 7; k++) { if (await plusA.isDisabled().catch(() => true)) break; await plusA.click().catch(() => {}); clicked++; await page.waitForTimeout(70) }
    if (clicked === 0) { // sécurité : donner 1 point à A si rien (mène à 0 refusée)
      await plusA.click().catch(() => {})
    }
    const valider = page.getByText('Valider la mène', { exact: false }).first()
    if (await valider.count() === 0) break
    await valider.click().catch(() => {})
    await page.waitForTimeout(600)
    // Boîte « Fin du match » quand on atteint 13
    if (await page.getByRole('button', { name: 'Confirmer', exact: true }).count() > 0) {
      await page.getByRole('button', { name: 'Confirmer', exact: true }).first().click().catch(() => {})
      await page.waitForTimeout(1200)
      break
    }
  }
}

async function playTournament(name) {
  // Création via l'assistant (mêlée fixe · doublette · poules→élim + petite finale)
  await page.goto(`${BASE}/tournoi/nouveau`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1000)
  await page.locator('input[placeholder*="printemps"]').fill(name)
  await click('Continuer'); await page.waitForTimeout(300)
  await click('Mêlée fixe'); await click('Doublette'); await click('Continuer'); await page.waitForTimeout(300)
  await click('Tout sélectionner'); await page.waitForTimeout(200); await click('Continuer'); await page.waitForTimeout(400)
  await tryClick('Petite finale', 2500)
  await click('Continuer'); await page.waitForTimeout(300)
  await click('Créer le tournoi'); await page.waitForURL(/\/tournoi\/\d+/, { timeout: 20000 })
  const tid = page.url().match(/\/tournoi\/(\d+)/)[1]
  await reload(tid)
  await click('Démarrer le tournoi', 8000); await conf()

  // Boucle : jouer tous les matchs en attente (UI), puis avancer les phases (UI).
  for (let step = 0; step < 12; step++) {
    let pend = await pendingMatches(tid)
    for (const mid of pend) { await playMatchUI(mid) }
    await reload(tid)
    if ((await getTournoi(tid)).status === 'termine') break
    const advanced = await tryClick('Lancer les phases finales', 6000)
      || await tryClick('Lancer les quarts', 5000)
      || await tryClick('Lancer les demi', 5000)
      || await tryClick('Lancer la finale', 5000)
    await page.waitForTimeout(1500)
    if (!advanced) {
      // plus de phase à lancer et il reste peut-être la clôture
      if ((await pendingMatches(tid)).length === 0) { await reload(tid); await tryClick('Clôturer', 3000); break }
    }
  }
  return { tid, status: (await getTournoi(tid)).status }
}

let completed = 0, played = 0
for (let i = 1; i <= N; i++) {
  try {
    const r = await playTournament(`${PREFIX} #${i}`)
    played++
    if (r.status === 'termine') completed++
    console.log(`#${i} tid=${r.tid} status=${r.status} | terminés=${completed}/${played}`)
    if (i === 1 || r.status === 'termine' && completed <= 2) await page.screenshot({ path: `${D}/game-${i}.png`, fullPage: true }).catch(() => {})
  } catch (e) {
    console.log(`#${i} ERREUR: ${(e.message || e).slice(0, 100)}`)
  }
}
console.log(`\n=== FINI : ${completed} terminés sur ${played} joués (cible ${N}) ===`)
await browser.close()
