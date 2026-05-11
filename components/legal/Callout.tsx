'use client'

interface CalloutProps {
  label?: string
  children: React.ReactNode
}

export default function Callout({ label, children }: CalloutProps) {
  return (
    <div className="my-4 px-4 py-3.5 bg-petanque-sable/50 border-l-2 border-petanque-vert rounded-r-lg text-sm text-petanque-vert-fonce/85 leading-relaxed">
      {label && (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-petanque-vert font-semibold mb-1">
          {label}
        </p>
      )}
      <div>{children}</div>
    </div>
  )
}
