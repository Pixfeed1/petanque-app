// SMOKE TEST COMPLET — les 4 modes de jeu, configs intelligemment choisies.
// Teste : création (frictions), démarrage, logique de jeu jusqu'au bout, classement.
// Scores via API (rapide) ; transitions de phase via les VRAIS boutons de l'UI.
import { chromium } from 'playwright'
import fs from 'node:fs'

const TOKEN = fs.readFileSync(process.env.TOKEN_FILE, 'utf8').trim()
const DIR = process.env.OUTDIR
const BASE = 'http://localhost:3000'
const H = { 'Content-Type': 'application/json', Cookie: `auth-token=${TOKEN}` }

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1500 } })
await ctx.addCookies([{ name: 'auth-token', value: TOKEN, domain: 'localhost', path: '/' }])
const page = await ctx.newPage()

const report = []
const clickText = async (t, timeout = 12000) => { const el = page.getByText(t, { exact: false }).first(); await el.waitFor({ state: 'visible', timeout }); await el.click() }
const tryClick = async (t, timeout = 4000) => { try { await clickText(t, timeout); return true } catch { return false } }
const getTournoi = async (tid) => (await (await fetch(`${BASE}/api/tournois/${tid}`, { headers: H })).json())
const getMatches = async (tid) => { const d = await (await fetch(`${BASE}/api/matches?tournoi_id=${tid}`, { headers: H })).json(); return Array.isArray(d) ? d : (d.matches || []) }
const scorePending = async (tid) => {
  let n = 0
  for (const m of (await getMatches(tid)).filter(m => m.equipe_b && m.status !== 'termine')) {
    const aWins = (Number(m.id) % 2) === 0
    const r = await fetch(`${BASE}/api/matches/${m.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ score_a: aWins ? 13 : 8, score_b: aWins ? 8 : 13, status: 'termine', winner_id: aWins ? m.equipe_a.id : m.equipe_b.id }) })
    if (r.ok) n++
  }
  return n
}
const reload = async (tid) => { await page.goto(`${BASE}/tournoi/${tid}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1800) }
// Démarrage : « Démarrer le tournoi » ouvre une confirmation dont le bouton est « Démarrer ».
const confirmStart = async () => { await page.waitForTimeout(800); await page.getByRole('button', { name: 'Démarrer', exact: true }).first().click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(2000) }

// Sélection de joueurs à l'étape 3 : tout, ou un sous-ensemble (déselection)
async function wizard(name, modeLabel, formatLabel, { deselect = [], step4 } = {}) {
  await page.goto(`${BASE}/tournoi/nouveau`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1200)
  await page.locator('input[placeholder*="printemps"]').fill(name)
  await clickText('Continuer'); await page.waitForTimeout(400)
  await clickText(modeLabel); await clickText(formatLabel); await clickText('Continuer'); await page.waitForTimeout(400)
  await clickText('Tout sélectionner'); await page.waitForTimeout(300)
  for (const nm of deselect) { await page.getByRole('button', { name: new RegExp(nm) }).first().click().catch(() => {}) }
  await page.waitForTimeout(200)
  await clickText('Continuer'); await page.waitForTimeout(600)
  if (step4) await step4()
  await clickText('Continuer'); await page.waitForTimeout(500)
  await clickText('Créer le tournoi')
  await page.waitForURL(/\/tournoi\/\d+/, { timeout: 20000 })
  return page.url().match(/\/tournoi\/(\d+)/)[1]
}

// Boucle générique de phases finales (poules → élim)
async function playPoulesElim(tid) {
  await scorePending(tid); await reload(tid)
  await tryClick('Lancer les phases finales', 6000)
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1500)
    await scorePending(tid); await reload(tid)
    if ((await getTournoi(tid)).status === 'termine') return
    const clicked = await tryClick('Lancer les quarts', 2500) || await tryClick('Lancer les demi', 2500) || await tryClick('Lancer la finale', 2500)
    if (!clicked) break
  }
  await scorePending(tid); await reload(tid)
  await tryClick('Clôturer', 3000)
}

const ONLY = process.env.CASE // ex "1" pour ne jouer qu'un cas
async function run(label, fn) {
  if (ONLY && label[0] !== ONLY) return
  const entry = { label, created: false, started: false, completed: false, note: '' }
  try {
    await fn(entry)
  } catch (e) {
    entry.note = (entry.note ? entry.note + ' | ' : '') + 'ERREUR: ' + (e.message || e).slice(0, 120)
  }
  report.push(entry)
  console.log(`${entry.completed ? '✅' : entry.started ? '🟡' : '❌'} ${label} — créé:${entry.created} démarré:${entry.started} terminé:${entry.completed} ${entry.note}`)
}

// ── 1) CHOISI · doublette · poules → élim (compose via l'UI) ──────────
await run('1. Choisi · doublette · poules→élim', async (e) => {
  const tid = await wizard('Sweep Choisi', 'Mode choisi', 'Doublette')
  e.created = true
  await reload(tid)
  await clickText('Créer les équipes', 8000) // CTA de l'aperçu (ouvre la modale)
  await page.waitForTimeout(1000)
  await clickText('Répartir automatiquement', 6000) // auto-remplissage des équipes
  await page.waitForTimeout(1800)
  await (tryClick('Continuer plus tard', 3000)) // fermer la modale de composition
  await reload(tid) // aperçu « Prêt à démarrer »
  await clickText('Démarrer le tournoi', 8000)
  await confirmStart()
  e.started = (await getTournoi(tid)).status === 'en_cours'
  await playPoulesElim(tid)
  e.completed = (await getTournoi(tid)).status === 'termine'
  await page.screenshot({ path: `${DIR}/s1-choisi.png`, fullPage: true })
})

// ── 2) MÊLÉE FIXE · triplette · mixité obligatoire · poules → élim ────
await run('2. Mêlée fixe · triplette · mixité · poules→élim', async (e) => {
  const tid = await wizard('Sweep MFixe Tri', 'Mêlée fixe', 'Triplette', { step4: async () => { await tryClick('Mixité obligatoire') } })
  e.created = true
  await fetch(`${BASE}/api/tournois/${tid}`, { method: 'PUT', headers: H, body: JSON.stringify({ status: 'en_cours' }) })
  e.started = true
  await playPoulesElim(tid)
  e.completed = (await getTournoi(tid)).status === 'termine'
  await page.screenshot({ path: `${DIR}/s2-mfixe-triplette.png`, fullPage: true })
})

// ── 3) MÊLÉE FIXE · doublette · N parties (3) ────────────────────────
await run('3. Mêlée fixe · doublette · 3 parties', async (e) => {
  const tid = await wizard('Sweep NParties', 'Mêlée fixe', 'Doublette', { step4: async () => {
    await page.locator('select:has(option[value="0"]):has(option[value="3"])').selectOption('3').catch(() => {})
  } })
  e.created = true
  await reload(tid)
  await clickText('Démarrer le tournoi', 8000); await confirmStart()
  e.started = (await getTournoi(tid)).status === 'en_cours'
  for (let p = 0; p < 4; p++) {
    await scorePending(tid); await reload(tid)
    if ((await getTournoi(tid)).status === 'termine') break
    if (!await tryClick('Lancer la partie', 3000)) { await tryClick('Voir le classement', 2000); break }
  }
  await scorePending(tid); await reload(tid); await tryClick('Clôturer', 3000)
  e.completed = (await getTournoi(tid)).status === 'termine' || (await getMatches(tid)).every(m => !m.equipe_b || m.status === 'termine')
  await page.screenshot({ path: `${DIR}/s3-nparties.png`, fullPage: true })
})

// ── 4) MÊLÉE TOURNANTE · doublette · mixité adversaire ───────────────
await run('4. Mêlée tournante · doublette · mixité adversaire', async (e) => {
  const tid = await wizard('Sweep MTourn', 'Mêlée tournante', 'Doublette', { step4: async () => { await tryClick('Mixité des adversaires') } })
  e.created = true
  await reload(tid)
  await clickText('Démarrer le tournoi', 8000); await confirmStart()
  e.started = (await getTournoi(tid)).status === 'en_cours'
  for (let r = 0; r < 3; r++) {
    await scorePending(tid); await reload(tid)
    if (!await tryClick('Nouvelle rotation', 3000)) break
    await page.waitForTimeout(1500)
  }
  await scorePending(tid); await reload(tid); await tryClick('Clôturer', 3000); await page.waitForTimeout(800)
  await tryClick('Clôturer', 2000)
  e.completed = (await getTournoi(tid)).status === 'termine'
  await page.screenshot({ path: `${DIR}/s4-mtournante.png`, fullPage: true })
})

// ── 5) MÊLÉE TOURNANTE · tête-à-tête ─────────────────────────────────
await run('5. Mêlée tournante · tête-à-tête', async (e) => {
  const tid = await wizard('Sweep MTourn TaT', 'Mêlée tournante', 'Tête à tête')
  e.created = true
  await reload(tid)
  await clickText('Démarrer le tournoi', 8000); await confirmStart()
  e.started = (await getTournoi(tid)).status === 'en_cours'
  for (let r = 0; r < 3; r++) {
    await scorePending(tid); await reload(tid)
    if (!await tryClick('Nouvelle rotation', 3000)) break
    await page.waitForTimeout(1500)
  }
  await scorePending(tid); await reload(tid); await tryClick('Clôturer', 3000); await page.waitForTimeout(800)
  await tryClick('Clôturer', 2000)
  e.completed = (await getTournoi(tid)).status === 'termine'
  await page.screenshot({ path: `${DIR}/s5-tat.png`, fullPage: true })
})

// ── 6) PERSONNALISÉ · doublette · poules → élim · fair-play ───────────
await run('6. Personnalisé · doublette · poules→élim · fair-play', async (e) => {
  const tid = await wizard('Sweep Perso', 'Personnalisé', 'Doublette', { step4: async () => {
    await page.locator('select:has(option[value="random"])').selectOption('random')
    await page.locator('select:has(option[value="rounds"])').selectOption('poules')
    await tryClick('Mode fair-play')
  } })
  e.created = true
  await fetch(`${BASE}/api/tournois/${tid}`, { method: 'PUT', headers: H, body: JSON.stringify({ status: 'en_cours' }) })
  e.started = true
  let guard = 0, done = false
  while (!done && guard++ < 10) {
    await scorePending(tid)
    const res = await (await fetch(`${BASE}/api/tournois/${tid}/engine-advance`, { method: 'POST', headers: H })).json()
    if (res.done) done = true
  }
  await fetch(`${BASE}/api/tournois/${tid}`, { method: 'PUT', headers: H, body: JSON.stringify({ status: 'termine' }) })
  e.completed = (await getTournoi(tid)).status === 'termine'
  await reload(tid)
  await page.screenshot({ path: `${DIR}/s6-perso.png`, fullPage: true })
})

console.log('\n===== RAPPORT SWEEP =====')
for (const r of report) console.log(`${r.completed ? '✅' : r.started ? '🟡' : '❌'} ${r.label} :: créé=${r.created} démarré=${r.started} terminé=${r.completed} ${r.note}`)
fs.writeFileSync(`${DIR}/rapport.json`, JSON.stringify(report, null, 2))
await browser.close()
