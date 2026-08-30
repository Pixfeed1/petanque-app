import { BouleSvg } from '@/components/ui'

export function AppMockup({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-petanque-sable-bord shadow-[0_20px_60px_-30px_rgba(45,55,30,0.25)] overflow-hidden ${className}`}
    >
      <div className="bg-petanque-sable-pale border-b border-petanque-sable-bord/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BouleSvg size={20} variant="acier" stries />
          <span className="text-xs font-medium text-petanque-vert-fonce">Pétanque Pro</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert" />
          <span className="text-[10px] text-petanque-bois">En direct</span>
        </div>
      </div>

      <div className="p-4 bg-petanque-sable-pale">
        <p className="text-[9px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-1">Bonjour Marc</p>
        <h3 className="text-base font-medium text-petanque-vert-fonce mb-3 leading-tight">
          1 tournoi en cours
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-petanque-sable-bord/40">
          <div>
            <p className="text-[9px] text-petanque-bois uppercase tracking-wider">Joueurs</p>
            <p className="font-mono text-lg font-medium text-petanque-vert-fonce">24</p>
          </div>
          <div>
            <p className="text-[9px] text-petanque-bois uppercase tracking-wider">Tour</p>
            <p className="font-mono text-lg font-medium text-petanque-vert-fonce">3<span className="text-petanque-bois text-xs">/5</span></p>
          </div>
          <div>
            <p className="text-[9px] text-petanque-bois uppercase tracking-wider">Terrains</p>
            <p className="font-mono text-lg font-medium text-petanque-vert-fonce">8</p>
          </div>
        </div>

        <div className="bg-white border border-petanque-sable-bord/60 border-l-4 border-l-petanque-vert rounded-lg px-3 py-2.5 mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-petanque-vert-fonce truncate">Concours du 15 mai</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-petanque-vert-pale text-petanque-vert text-[9px] font-medium rounded-full flex-shrink-0">
              <span className="w-1 h-1 rounded-full bg-petanque-vert animate-pulse" />En cours
            </span>
          </div>
          <p className="text-[10px] text-petanque-bois uppercase tracking-wider">Mêlée tournante</p>
        </div>

        <div className="bg-white border border-dashed border-petanque-sable-bord rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-petanque-vert text-petanque-sable text-xs flex items-center justify-center">+</span>
          <span className="text-xs text-petanque-vert-fonce">Nouveau tournoi</span>
        </div>
      </div>
    </div>
  )
}
