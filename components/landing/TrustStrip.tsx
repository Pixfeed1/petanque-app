import { BouleSvg } from '@/components/ui'

export function TrustStrip() {
  const stats = [
    { value: '50+', label: 'clubs utilisateurs' },
    { value: '1 200', label: 'tournois joués' },
    { value: '4,8/5', label: 'avis utilisateurs' },
    { value: 'FIPJP', label: 'règles officielles' },
  ]

  return (
    <section className="border-y border-petanque-sable-bord/40 bg-white/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 items-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <BouleSvg size={28} variant={i % 2 === 0 ? 'acier' : 'cochonnet'} stries />
              <div>
                <p className="font-mono text-lg font-medium text-petanque-vert-fonce leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-petanque-bois uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
