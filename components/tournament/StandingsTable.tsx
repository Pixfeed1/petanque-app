'use client'

export interface TeamStanding {
  id: string | number
  name: string
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
  poule: string
  teams: TeamStanding[]
  qualifiedCount?: number
}

export default function StandingsTable({ poule, teams, qualifiedCount = 2 }: Props) {
  return (
    <div className="bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-petanque-vert-fonce flex items-center justify-between">
        <h3 className="text-petanque-sable text-sm font-medium">Poule {poule}</h3>
        <span className="text-petanque-sable/70 text-[10px] uppercase tracking-widest">
          {qualifiedCount} qualifié{qualifiedCount > 1 ? 's' : ''}
        </span>
      </div>
      <table className="w-full">
        <thead className="bg-petanque-sable-pale border-b border-petanque-sable-bord/60">
          <tr>
            <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">#</th>
            <th className="px-5 py-2.5 text-left text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">Équipe</th>
            <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">J</th>
            <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">V</th>
            <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">N</th>
            <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">D</th>
            <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">Diff</th>
            <th className="px-5 py-2.5 text-right text-[10px] uppercase tracking-[0.14em] font-medium text-petanque-bois">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-petanque-sable-bord/40">
          {teams.map((t, i) => {
            const isQualified = i < qualifiedCount
            return (
              <tr key={t.id} className={`hover:bg-petanque-sable-pale/40 transition-colors ${isQualified ? 'border-l-[3px] border-l-petanque-vert' : ''}`}>
                <td className="px-5 py-3.5 font-mono text-xs text-petanque-bois w-12">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-petanque-vert-fonce">{t.name}</td>
                <td className="px-3 py-3.5 text-center text-sm text-petanque-bois">{t.played}</td>
                <td className="px-3 py-3.5 text-center text-sm text-petanque-vert font-medium">{t.victories}</td>
                <td className="px-3 py-3.5 text-center text-sm text-petanque-bois">{t.draws || 0}</td>
                <td className="px-3 py-3.5 text-center text-sm text-petanque-rouge">{t.defeats}</td>
                <td className={`px-3 py-3.5 text-center text-sm font-mono ${t.difference >= 0 ? 'text-petanque-vert' : 'text-petanque-rouge'}`}>
                  {t.difference >= 0 ? '+' : ''}{t.difference}
                </td>
                <td className="px-5 py-3.5 text-right text-base font-medium text-petanque-vert-fonce font-mono">{t.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
