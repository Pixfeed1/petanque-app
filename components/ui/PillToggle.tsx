'use client'

export interface PillToggleOption<T extends string> {
  value: T
  label: string
}

interface PillToggleProps<T extends string> {
  options: PillToggleOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function PillToggle<T extends string>({ options, value, onChange }: PillToggleProps<T>) {
  return (
    <div className="inline-flex bg-white border border-petanque-sable-bord rounded-full p-1 flex-shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
            value === opt.value
              ? 'bg-petanque-vert text-petanque-sable'
              : 'text-petanque-bois hover:text-petanque-vert-fonce'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
