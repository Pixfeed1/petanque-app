'use client'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  cta?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-petanque-sable-bord/30 mx-auto mb-5 flex items-center justify-center text-petanque-bois">
          {icon}
        </div>
      )}
      <p className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-1.5">{title}</p>
      {description && (
        <p className="text-sm text-petanque-bois mb-6 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="inline-flex items-center gap-1.5 bg-petanque-vert text-petanque-sable px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}
