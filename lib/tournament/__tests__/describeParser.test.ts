import { describe, it, expect } from 'vitest'
import { parseTournamentDescription as parse } from '../describeParser'

describe('parseTournamentDescription', () => {
  describe('mode', () => {
    it('mêlée tournante', () => expect(parse('mêlée tournante').fields.mode).toBe('melee_tournante'))
    it('"tournante" seul', () => expect(parse('un concours tournante').fields.mode).toBe('melee_tournante'))
    it('mêlée simple → melee_fixe', () => expect(parse('une mêlée simple').fields.mode).toBe('melee_fixe'))
    it('"mêlée" seul → melee_fixe', () => expect(parse('mêlée en doublette').fields.mode).toBe('melee_fixe'))
    it('choisi', () => expect(parse('tournoi choisi').fields.mode).toBe('choisi'))
    it('"équipes choisies" → choisi', () => expect(parse('équipes choisies').fields.mode).toBe('choisi'))
    it('priorité : "mêlée tournante" ne tombe pas sur melee_fixe', () =>
      expect(parse('grande mêlée tournante').fields.mode).toBe('melee_tournante'))
    it('aucun mode reconnu → non défini', () => expect(parse('bonjour').fields.mode).toBeUndefined())
  })

  describe('format', () => {
    it('doublette', () => expect(parse('en doublette').fields.format).toBe('doublette'))
    it('doublettes (pluriel)', () => expect(parse('des doublettes').fields.format).toBe('doublette'))
    it('triplette', () => expect(parse('en triplette').fields.format).toBe('triplette'))
    it('tête-à-tête', () => expect(parse('en tête-à-tête').fields.format).toBe('tete_a_tete'))
    it('tete a tete sans accent/tiret', () => expect(parse('tete a tete').fields.format).toBe('tete_a_tete'))
    it('"individuel" → tête-à-tête', () => expect(parse('concours individuel').fields.format).toBe('tete_a_tete'))
    it('"équipes de 3" → triplette', () => expect(parse('équipes de 3').fields.format).toBe('triplette'))
  })

  describe('points (7–25)', () => {
    it('"en 11 points" → 11', () => expect(parse('parties en 11 points').fields.maxPoints).toBe(11))
    it('"13 points" → 13', () => expect(parse('on joue 13 points').fields.maxPoints).toBe(13))
    it('"jusqu\'à 15" → 15', () => expect(parse("jusqu'à 15").fields.maxPoints).toBe(15))
    it('"21 pts" → 21', () => expect(parse('parties en 21 pts').fields.maxPoints).toBe(21))
    it('hors bornes (30) → ignoré', () => expect(parse('en 30 points').fields.maxPoints).toBeUndefined())
    it('hors bornes (3) → ignoré', () => expect(parse('en 3 points').fields.maxPoints).toBeUndefined())
    it('PIÈGE : "12 joueurs" ne fixe PAS les points', () =>
      expect(parse('12 joueurs en doublette').fields.maxPoints).toBeUndefined())
    it('PIÈGE : "4 terrains" ne fixe PAS les points', () =>
      expect(parse('sur 4 terrains').fields.maxPoints).toBeUndefined())
  })

  describe('terrains', () => {
    it('"4 terrains" (nombre) → 4', () => expect(parse('sur 4 terrains').fields.terrains).toBe(4))
    it('"1 terrain" (singulier) → 1', () => expect(parse('1 terrain').fields.terrains).toBe(1))
    it('hors bornes (60) → ignoré', () => expect(parse('60 terrains').fields.terrains).toBeUndefined())
    it('nommés "terrains A, B, 5" → liste + count', () => {
      const f = parse('sur les terrains A, B, 5').fields
      expect(f.terrainNames).toEqual(['A', 'B', '5'])
      expect(f.terrains).toBe(3)
    })
    it('nommés "terrains a b c" (casse) → A B C', () => {
      expect(parse('terrains a b c').fields.terrainNames).toEqual(['A', 'B', 'C'])
    })
    it('nommés avec "et" : "terrains 7 et 8"', () => {
      expect(parse('terrains 7 et 8').fields.terrainNames).toEqual(['7', '8'])
    })
  })

  describe('limite de temps', () => {
    it('"45 minutes par match" → activé + 45', () => {
      const f = parse('45 minutes par match').fields
      expect(f.timeLimit).toBe(true)
      expect(f.timeLimitMinutes).toBe(45)
    })
    it('"limite de temps" sans chiffre → activé', () => {
      const f = parse('avec limite de temps').fields
      expect(f.timeLimit).toBe(true)
      expect(f.timeLimitMinutes).toBeUndefined()
    })
    it('pas de mention → non défini', () => expect(parse('doublette').fields.timeLimit).toBeUndefined())
  })

  describe('nombre de parties', () => {
    it('"en 3 parties" → 3', () => expect(parse('en 3 parties').fields.nombreParties).toBe(3))
    it('"4 parties" → 4', () => expect(parse('mêlée tournante 4 parties').fields.nombreParties).toBe(4))
    it('hors bornes (5) → ignoré', () => expect(parse('5 parties').fields.nombreParties).toBeUndefined())
    it('PIÈGE : "12 joueurs" ne fixe pas les parties', () => expect(parse('12 joueurs').fields.nombreParties).toBeUndefined())
  })

  describe('qualifiés par poule', () => {
    it('"2 qualifiés" → 2', () => expect(parse('2 qualifiés par poule').fields.qualifiedPerPoule).toBe(2))
    it('"les 3 premiers" → 3', () => expect(parse('les 3 premiers').fields.qualifiedPerPoule).toBe(3))
  })

  describe('options booléennes', () => {
    it('mixité', () => expect(parse('mixité obligatoire').fields.mixiteObligatoire).toBe(true))
    it('"hommes et femmes" → mixité', () => expect(parse('hommes et femmes').fields.mixiteObligatoire).toBe(true))
    it('petite finale → consolante', () => expect(parse('avec petite finale').fields.consolante).toBe(true))
    it('"3e place" → consolante', () => expect(parse('match pour la 3e place').fields.consolante).toBe(true))
    it('fair-play', () => expect(parse('en mode fair-play').fields.fairPlay).toBe(true))
    it('"esprit club" → fair-play', () => expect(parse('esprit club').fields.fairPlay).toBe(true))
    it('double élimination', () => expect(parse('double élimination').fields.eliminationFormat).toBe('double'))
    it('mixité des adversaires', () => expect(parse('avec mixité des adversaires').fields.mixiteAdversaire).toBe(true))
    it('"adversaires équilibrés" → mixité adversaire', () => expect(parse('adversaires équilibrés').fields.mixiteAdversaire).toBe(true))
    it('« équilibrage par niveau » → equilibrageNiveau', () => expect(parse('avec équilibrage par niveau').fields.equilibrageNiveau).toBe(true))
    it('« niveau cumulé » → equilibrageNiveau', () => expect(parse('équilibrer selon le niveau cumulé').fields.equilibrageNiveau).toBe(true))
    it('« équipes équilibrées » → equilibrageNiveau', () => expect(parse('je veux des équipes équilibrées').fields.equilibrageNiveau).toBe(true))
    it('rien coché par défaut', () => {
      const f = parse('doublette choisi').fields
      expect(f.mixiteObligatoire).toBeUndefined()
      expect(f.consolante).toBeUndefined()
      expect(f.fairPlay).toBeUndefined()
      expect(f.equilibrageNiveau).toBeUndefined()
    })
  })

  describe('rotation', () => {
    it('par match', () => expect(parse('rotation par match').fields.meleeRotation).toBe('par_match'))
    it('par tour', () => expect(parse('par tour').fields.meleeRotation).toBe('par_tour'))
  })

  describe('phrases complètes (cas réels)', () => {
    it('« Doublette mêlée tournante à 12 joueurs, en 11 points, mixité obligatoire »', () => {
      const { fields } = parse('Doublette mêlée tournante à 12 joueurs, en 11 points, mixité obligatoire')
      expect(fields.format).toBe('doublette')
      expect(fields.mode).toBe('melee_tournante')
      expect(fields.maxPoints).toBe(11)
      expect(fields.mixiteObligatoire).toBe(true)
      // 12 joueurs ne doit pas polluer les points/terrains
      expect(fields.terrains).toBeUndefined()
    })

    it('« Triplette choisi avec petite finale et double élimination »', () => {
      const { fields } = parse('Triplette choisi avec petite finale et double élimination')
      expect(fields.format).toBe('triplette')
      expect(fields.mode).toBe('choisi')
      expect(fields.consolante).toBe(true)
      expect(fields.eliminationFormat).toBe('double')
    })

    it('« Tête-à-tête mêlée en 13 points sur 4 terrains, fair-play »', () => {
      const { fields } = parse('Tête-à-tête mêlée en 13 points sur 4 terrains, fair-play')
      expect(fields.format).toBe('tete_a_tete')
      expect(fields.mode).toBe('melee_fixe')
      expect(fields.maxPoints).toBe(13)
      expect(fields.terrains).toBe(4)
      expect(fields.fairPlay).toBe(true)
    })

    it('« Mêlée tournante par match, 6 terrains, 45 minutes par match »', () => {
      const { fields } = parse('Mêlée tournante par match, 6 terrains, 45 minutes par match')
      expect(fields.mode).toBe('melee_tournante')
      expect(fields.meleeRotation).toBe('par_match')
      expect(fields.terrains).toBe(6)
      expect(fields.timeLimit).toBe(true)
      expect(fields.timeLimitMinutes).toBe(45)
    })
  })

  describe('robustesse', () => {
    it('chaîne vide → aucun champ', () => {
      const r = parse('')
      expect(r.fields).toEqual({})
      expect(r.detected).toEqual([])
    })
    it('espaces seuls → aucun champ', () => expect(parse('   ').detected).toEqual([]))
    it('texte sans rien de reconnaissable → aucun champ', () =>
      expect(parse('le chat mange une souris').fields).toEqual({}))
    it('detected liste ce qui est compris', () => {
      const { detected } = parse('doublette mêlée tournante en 11 points')
      expect(detected).toContain('Format : doublette')
      expect(detected).toContain('Mode : mêlée tournante')
      expect(detected).toContain('Points : 11')
    })
  })
})
