'use client'

import { Search } from '@/components/Icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Rechercher…', className = '' }: SearchInputProps) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-petanque-bois pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-3 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
      />
    </div>
  )
}
