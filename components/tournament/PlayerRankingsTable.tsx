'use client'

export interface PlayerRanking {
  id: string | number
  name: string
  email?: string
  played: number
  victories: number
  defeats: number
  draws?: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number
}

interface Props {
  players: PlayerRanking[]
}

export default function PlayerRankingsTable({ players }: Props) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-petanque-bois text-sm">
        Aucun classement disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-petanque-vert-fonce">
          <tr>
            <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">#</th>
            <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">Joueur</th>
            <th className="px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">J</th>
            <th className="px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">V</th>
            <th className="px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">N</th>
            <th className="px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">D</th>
            <th className="px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">Diff</th>
            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-sable">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-petanque-sable-bord/40">
          {players.map((p, i) => (
            <tr key={p.id} className="hover:bg-petanque-sable-pale/40 transition-colors">
              <td className="px-5 py-3.5 font-mono text-xs text-petanque-bois w-12">
                {String(i + 1).padStart(2, '0')}
              </td>
              <td className="px-5 py-3.5 text-sm font-medium text-petanque-vert-fonce">{p.name}</td>
              <td className="px-3 py-3.5 text-center text-sm text-petanque-bois">{p.played}</td>
              <td className="px-3 py-3.5 text-center text-sm text-petanque-vert font-medium">{p.victories}</td>
              <td className="px-3 py-3.5 text-center text-sm text-petanque-bois">{p.draws || 0}</td>
              <td className="px-3 py-3.5 text-center text-sm text-petanque-rouge">{p.defeats}</td>
              <td className={`px-3 py-3.5 text-center text-sm font-mono ${p.difference >= 0 ? 'text-petanque-vert' : 'text-petanque-rouge'}`}>
                {p.difference >= 0 ? '+' : ''}{p.difference}
              </td>
              <td className="px-5 py-3.5 text-right text-base font-medium text-petanque-vert-fonce font-mono">{p.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
