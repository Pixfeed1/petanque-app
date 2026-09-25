'use client'

import { useEffect } from 'react'
import { applyTheme, getThemePref } from '@/lib/theme'

// En mode « système », suit les changements de prefers-color-scheme pendant
// que la page est ouverte (ex. bascule auto jour/nuit du téléphone).
export function ThemeWatcher() {
  useEffect(() => {
    applyTheme(getThemePref())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (getThemePref() === 'system') applyTheme('system') }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return null
}

export default ThemeWatcher
