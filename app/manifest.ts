import type { MetadataRoute } from 'next'

// Manifeste PWA (généré par Next à /manifest.webmanifest). Rend l'app installable
// sur Android/desktop et sert de base au packaging Android (TWA/.aab).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pétanque Pro',
    short_name: 'Pétanque Pro',
    description: 'Organisez et gérez vos tournois de pétanque comme un pro.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#e8f3da',
    theme_color: '#1a3322',
    lang: 'fr',
    categories: ['sports', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
