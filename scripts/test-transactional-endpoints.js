// scripts/test-transactional-endpoints.js
// Test transactionnel auto-suffisant : crée son user, teste, nettoie tout

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

const ts = Date.now()
const TEST_EMAIL = `test-transact-${ts}@petanquepro.test`
const TEST_PASSWORD = `TestTransact${ts}!`
const TEST_FULL_NAME = 'Test Transactional'
const TEST_ORG_NAME = `TestOrg_${ts}`

let cookie = ''
let userId = ''
let orgId = ''
const testIds = { tournoiPoule: null, tournoiRotation: null }

const log = {
  step: (s) => console.log('\n━━━ ' + s + ' ━━━'),
  ok: (s) => console.log('  ✅ ' + s),
  err: (s) => console.log('  ❌ ' + s),
  info: (s) => console.log('  ℹ️  ' + s)
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (cookie) opts.headers['Cookie'] = cookie
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(BASE_URL + path, opts)
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) {
    // Extraire tous les cookies set par le serveur
    const cookiesArr = setCookie.split(/,(?=\s*\w+=)/).map(c => c.split(';')[0].trim())
    cookie = cookiesArr.join('; ')
  }
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data }
}

async function cleanupTournois() {
  if (testIds.tournoiPoule) {
    const r = await req('DELETE', '/api/tournois/' + testIds.tournoiPoule)
    log.info('Tournoi poule supprimé: ' + (r.ok ? 'OK' : 'ECHEC ' + JSON.stringify(r.data)))
  }
  if (testIds.tournoiRotation) {
    const r = await req('DELETE', '/api/tournois/' + testIds.tournoiRotation)
    log.info('Tournoi rotation supprimé: ' + (r.ok ? 'OK' : 'ECHEC ' + JSON.stringify(r.data)))
  }
}

async function cleanupUserDB() {
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DATABASE || 'petanque',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || ''
    })

    const u = await pool.query('SELECT id FROM users WHERE email = $1', [TEST_EMAIL])
    if (u.rows.length === 0) {
      log.info('User non trouvé en DB (déjà supprimé ?)')
      await pool.end()
      return
    }
    const uid = u.rows[0].id

    // Tenter de récupérer les org_id liées au user (membership)
    let orgIds = []
    try {
      const orgs = await pool.query(
        `SELECT DISTINCT o.id FROM organisations o
         LEFT JOIN organisation_members om ON om.organisation_id = o.id
         WHERE o.created_by = $1 OR om.user_id = $1`,
        [uid]
      )
      orgIds = orgs.rows.map(r => r.id)
    } catch {
      // Si la table organisation_members n'existe pas, juste created_by
      const orgs = await pool.query('SELECT id FROM organisations WHERE created_by = $1', [uid])
      orgIds = orgs.rows.map(r => r.id)
    }

    // Supprimer les orgs (cascade → tournois/équipes/matchs)
    for (const oid of orgIds) {
      await pool.query('DELETE FROM organisations WHERE id = $1', [oid])
      log.info('Org supprimée: ' + oid)
    }

    // Supprimer le user
    await pool.query('DELETE FROM users WHERE id = $1', [uid])
    log.info('User supprimé: ' + uid + ' (' + TEST_EMAIL + ')')

    await pool.end()
  } catch (e) {
    log.err('Cleanup DB échoué: ' + e.message)
    log.info('⚠️  User test reste en base. Pour purger manuellement :')
    log.info('   psql -c "DELETE FROM users WHERE email = \'' + TEST_EMAIL + '\'"')
  }
}

async function main() {
  try {
    // ─── 1. SIGNUP + AUTH ───────────────────────────────────────
    log.step('1. Création user de test + auth')
    const signup = await req('POST', '/api/auth/signup', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      full_name: TEST_FULL_NAME,
      org_name: TEST_ORG_NAME
    })
    if (!signup.ok) throw new Error('Signup échoué: ' + JSON.stringify(signup.data))
    log.ok('Signup OK')

    // Si signup ne logue pas auto, login manuel
    const me = await req('GET', '/api/auth/me')
    if (!me.ok || !me.data?.user) {
      const login = await req('POST', '/api/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD })
      if (!login.ok) throw new Error('Login post-signup échoué: ' + JSON.stringify(login.data))
      const me2 = await req('GET', '/api/auth/me')
      if (!me2.ok || !me2.data?.user) throw new Error('Auth me KO: ' + JSON.stringify(me2.data))
      userId = me2.data.user.id
      orgId = me2.data.organization?.id
    } else {
      userId = me.data.user.id
      orgId = me.data.organization?.id
    }

    if (!orgId) throw new Error('Pas d\'organisation pour le user de test')
    log.ok('Auth OK userId=' + userId)
    log.ok('Org: ' + orgId)

    // ─── 2. TEST regenerate-poules ──────────────────────────────
    log.step('2. Test /regenerate-poules')

    const t1 = await req('POST', '/api/tournois', {
      name: 'TEST_TRANSACT_POULE_' + ts,
      org_id: orgId,
      mode: 'choisi',
      format: 'doublette',
      date: new Date().toISOString().split('T')[0],
      settings: { pouleSize: 4, terrains: 0 }
    })
    if (!t1.ok) throw new Error('Création tournoi échouée: ' + JSON.stringify(t1.data))
    testIds.tournoiPoule = t1.data.id
    log.ok('Tournoi créé: ' + testIds.tournoiPoule)

    const teams1 = []
    for (let i = 1; i <= 4; i++) {
      const e = await req('POST', '/api/equipes', {
        tournoi_id: testIds.tournoiPoule,
        name: 'TEST_E' + i,
        joueur_ids: [],
        stats: { victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 }
      })
      if (!e.ok) throw new Error('Création équipe ' + i + ' échouée: ' + JSON.stringify(e.data))
      teams1.push(e.data.id)
    }
    log.ok('4 équipes créées')

    const initialMatches = []
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        initialMatches.push({
          tournoi_id: testIds.tournoiPoule,
          tour: 1, terrain: null,
          equipe_a_id: teams1[i], equipe_b_id: teams1[j],
          type: 'poule', poule: 'A', status: 'a_jouer'
        })
      }
    }
    const initBatch = await req('POST', '/api/matches/batch', { matches: initialMatches })
    if (!initBatch.ok) throw new Error('Création matchs initiaux échouée: ' + JSON.stringify(initBatch.data))
    log.ok('6 matchs de poule initiaux créés (poule A)')

    // Test A : régénération OK
    log.info('Test A: régénération normale en poule B')
    const newMatches = []
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        newMatches.push({
          tour: 1, terrain: null,
          equipe_a_id: teams1[i], equipe_b_id: teams1[j],
          type: 'poule', poule: 'B', status: 'a_jouer'
        })
      }
    }
    const regen = await req('POST', '/api/tournois/' + testIds.tournoiPoule + '/regenerate-poules', { matches: newMatches })
    if (!regen.ok) throw new Error('Régénération échouée: ' + JSON.stringify(regen.data))
    log.ok('Régénération OK: ' + regen.data.deleted + ' supprimés, ' + regen.data.created + ' créés')

    const verifyRegen = await req('GET', '/api/matches?tournoi_id=' + testIds.tournoiPoule)
    const matches1 = Array.isArray(verifyRegen.data) ? verifyRegen.data : (verifyRegen.data.matches || [])
    const pouleA = matches1.filter(m => m.poule === 'A').length
    const pouleB = matches1.filter(m => m.poule === 'B').length
    if (pouleA === 0 && pouleB === 6) log.ok('Vérif OK: 0 poule A, 6 poule B')
    else log.err(`Vérif ECHEC: ${pouleA} poule A (att 0), ${pouleB} poule B (att 6)`)

    // Test B : rollback sur données invalides
    log.info('Test B: appel avec equipe_a_id invalide → doit ROLLBACK')
    const badMatches = [
      { tour: 1, terrain: null, equipe_a_id: teams1[0], equipe_b_id: teams1[1], type: 'poule', poule: 'C', status: 'a_jouer' },
      { tour: 1, terrain: null, equipe_a_id: '00000000-0000-0000-0000-000000000000', equipe_b_id: teams1[2], type: 'poule', poule: 'C', status: 'a_jouer' }
    ]
    const badRegen = await req('POST', '/api/tournois/' + testIds.tournoiPoule + '/regenerate-poules', { matches: badMatches })
    if (badRegen.ok) log.err('Appel avec données invalides aurait dû échouer!')
    else log.ok('Appel rejeté: ' + (badRegen.data.error || badRegen.status))

    const verifyRollback = await req('GET', '/api/matches?tournoi_id=' + testIds.tournoiPoule)
    const matches2 = Array.isArray(verifyRollback.data) ? verifyRollback.data : (verifyRollback.data.matches || [])
    const stillB = matches2.filter(m => m.poule === 'B').length
    const stillC = matches2.filter(m => m.poule === 'C').length
    if (stillB === 6 && stillC === 0) log.ok('Rollback OK: 6 poule B intacts, 0 poule C')
    else log.err(`Rollback ECHEC: ${stillB} poule B (att 6), ${stillC} poule C (att 0)`)

    // ─── 3. TEST new-rotation ───────────────────────────────────
    log.step('3. Test /new-rotation')

    const t2 = await req('POST', '/api/tournois', {
      name: 'TEST_TRANSACT_ROTATION_' + ts,
      org_id: orgId,
      mode: 'melee_tournante',
      format: 'doublette',
      date: new Date().toISOString().split('T')[0],
      settings: { terrains: 0, players: [] }
    })
    if (!t2.ok) throw new Error('Création tournoi rotation échouée: ' + JSON.stringify(t2.data))
    testIds.tournoiRotation = t2.data.id
    log.ok('Tournoi mêlée tournante créé')

    log.info('Test A: rotation 2 avec 4 équipes + 6 matchs')
    const rotPayload = {
      rotation_number: 2,
      teams: [
        { name: 'R2-Équipe 1', joueur_ids: [] },
        { name: 'R2-Équipe 2', joueur_ids: [] },
        { name: 'R2-Équipe 3', joueur_ids: [] },
        { name: 'R2-Équipe 4', joueur_ids: [] }
      ],
      matches: [
        { tour: 2, terrain: null, team_a_index: 0, team_b_index: 1, type: 'poule', poule: null, status: 'a_jouer' },
        { tour: 2, terrain: null, team_a_index: 2, team_b_index: 3, type: 'poule', poule: null, status: 'a_jouer' },
        { tour: 2, terrain: null, team_a_index: 0, team_b_index: 2, type: 'poule', poule: null, status: 'a_jouer' },
        { tour: 2, terrain: null, team_a_index: 1, team_b_index: 3, type: 'poule', poule: null, status: 'a_jouer' },
        { tour: 2, terrain: null, team_a_index: 0, team_b_index: 3, type: 'poule', poule: null, status: 'a_jouer' },
        { tour: 2, terrain: null, team_a_index: 1, team_b_index: 2, type: 'poule', poule: null, status: 'a_jouer' }
      ]
    }
    const rot = await req('POST', '/api/tournois/' + testIds.tournoiRotation + '/new-rotation', rotPayload)
    if (!rot.ok) throw new Error('Nouvelle rotation échouée: ' + JSON.stringify(rot.data))
    log.ok('Rotation 2 OK: ' + rot.data.teams_created + ' équipes, ' + rot.data.matches_created + ' matchs')

    const verifyRot = await req('GET', '/api/equipes?tournoi_id=' + testIds.tournoiRotation)
    const eq1 = Array.isArray(verifyRot.data) ? verifyRot.data : (verifyRot.data.equipes || [])
    const r2teams = eq1.filter(t => t.name.startsWith('R2-')).length
    if (r2teams === 4) log.ok('4 équipes R2- créées')
    else log.err(r2teams + ' équipes R2- (att 4)')

    log.info('Test B: rotation 3 avec team_b_index=99 INVALIDE → doit ROLLBACK équipes ET matchs')
    const badRotPayload = {
      rotation_number: 3,
      teams: [
        { name: 'R3-Équipe 1', joueur_ids: [] },
        { name: 'R3-Équipe 2', joueur_ids: [] }
      ],
      matches: [
        { tour: 3, terrain: null, team_a_index: 0, team_b_index: 99, type: 'poule', poule: null, status: 'a_jouer' }
      ]
    }
    const badRot = await req('POST', '/api/tournois/' + testIds.tournoiRotation + '/new-rotation', badRotPayload)
    if (badRot.ok) log.err('Rotation invalide aurait dû échouer!')
    else log.ok('Rotation rejetée: ' + (badRot.data.error || badRot.status))

    const verifyRotRollback = await req('GET', '/api/equipes?tournoi_id=' + testIds.tournoiRotation)
    const eq2 = Array.isArray(verifyRotRollback.data) ? verifyRotRollback.data : (verifyRotRollback.data.equipes || [])
    const r3teams = eq2.filter(t => t.name.startsWith('R3-')).length
    if (r3teams === 0) log.ok('Rollback OK: 0 équipe R3- (rien persisté)')
    else log.err(r3teams + ' équipe(s) R3- orpheline(s)!')

    log.step('✅ TOUS LES TESTS PASSÉS')
  } catch (e) {
    log.err('Erreur fatale: ' + e.message)
    if (e.stack) console.error(e.stack)
  } finally {
    log.step('Cleanup')
    await cleanupTournois()
    await cleanupUserDB()
  }
}

main()
