'use client'

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-petanque-vert-fonce/85 leading-relaxed">{children}</p>
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 my-2">{children}</ul>
}

export function LegalLI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm text-petanque-vert-fonce/85 leading-relaxed flex gap-2.5"><span className="text-petanque-bois flex-shrink-0 mt-0.5">·</span><span className="flex-1">{children}</span></li>
}

export function LegalKV({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 text-sm"><span className="text-petanque-bois min-w-[140px]">{label}</span><span className="font-medium text-petanque-vert-fonce">{value}</span></div>
}

export function LegalLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const target = external ? '_blank' : undefined
  const rel = external ? 'noopener noreferrer' : undefined
  return <a href={href} target={target} rel={rel} className="text-petanque-vert hover:text-petanque-vert-fonce underline decoration-petanque-vert/30 hover:decoration-petanque-vert underline-offset-2 transition-colors">{children}</a>
}
