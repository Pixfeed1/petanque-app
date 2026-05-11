'use client'

interface PlayerAvatarProps {
  name: string
  size?: number
  className?: string
}

export default function PlayerAvatar({ name, size = 36, className = '' }: PlayerAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?'
  const fontSize = Math.max(11, Math.floor(size * 0.4))
  return (
    <div
      className={`rounded-full bg-petanque-vert-pale/40 text-petanque-vert-fonce flex items-center justify-center font-medium flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initial}
    </div>
  )
}
