// lib/labels.ts
// Libellés français des valeurs techniques stockées en base (mode, format, statut).
// À utiliser partout où on affiche ces champs — jamais la valeur brute (melee_fixe…).

export function modeLabel(mode?: string | null): string {
  switch (mode) {
    case 'choisi': return 'Choisi'
    case 'melee_fixe': return 'Mêlée fixe'
    case 'melee_tournante': return 'Mêlée tournante'
    case 'personnalise': return 'Personnalisé'
    default: return mode || ''
  }
}

export function formatLabel(format?: string | null): string {
  switch (format) {
    case 'tete_a_tete': return 'Tête-à-tête'
    case 'doublette': return 'Doublette'
    case 'triplette': return 'Triplette'
    default: return format || ''
  }
}

export function statusLabel(status?: string | null): string {
  switch (status) {
    case 'preparation': return 'Préparation'
    case 'en_cours': return 'En cours'
    case 'termine': return 'Terminé'
    default: return status || ''
  }
}
