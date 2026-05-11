'use client'

interface PriceCardProps {
  name: string
  price: string
  duration: string
  features: string[]
  popular?: boolean
}

export default function PriceCard({ name, price, duration, features, popular }: PriceCardProps) {
  return (
    <div className={'relative flex flex-col p-5 rounded-xl ' + (popular ? 'bg-petanque-vert-pale/10 border border-petanque-vert/50' : 'bg-white border border-petanque-sable-bord')}>
      {popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.18em] text-petanque-vert bg-white border border-petanque-vert/50 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
          Populaire
        </span>
      )}
      <h4 className="text-sm font-medium text-petanque-vert-fonce mb-1">{name}</h4>
      <div className="font-mono text-2xl font-medium text-petanque-vert leading-none mb-1.5">{price}</div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-petanque-bois pb-3 mb-3 border-b border-petanque-sable-bord/50">{duration}</p>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="text-xs text-petanque-vert-fonce/85 leading-relaxed flex gap-2">
            <span className="text-petanque-bois flex-shrink-0">·</span>
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>
    </div>
  )
}
