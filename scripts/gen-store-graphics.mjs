// Génère les visuels Play Store : bandeau 1024×500 + icône 512×512.
import sharp from 'sharp'
import fs from 'node:fs'

const OUT = 'store-assets'
fs.mkdirSync(OUT, { recursive: true })

const boule = `
  <circle cx="32" cy="32" r="28" fill="url(#m)" stroke="#5a6978" stroke-width="2.5"/>
  <circle cx="26" cy="26" r="4" fill="#ffffff" opacity="0.85"/>
  <circle cx="38" cy="38" r="2.5" fill="#2d3748" opacity="0.35"/>
  <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
  <circle cx="52" cy="52" r="8" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
  <circle cx="49" cy="49" r="2" fill="#ffffff" opacity="0.6"/>`
const defs = `<defs>
  <radialGradient id="m"><stop offset="0%" stop-color="#c1ccd9"/><stop offset="50%" stop-color="#a8b2c3"/><stop offset="100%" stop-color="#8e9aaf"/></radialGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2d5530"/><stop offset="100%" stop-color="#1a3322"/></linearGradient>
</defs>`

// Bandeau 1024×500 : fond vert dégradé, grosse boule à gauche, titre à droite.
const banner = `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="500" fill="url(#bg)"/>
  <circle cx="150" cy="250" r="500" fill="#ffffff" opacity="0.03"/>
  <g transform="translate(120,158) scale(2.85)">${boule}</g>
  <text x="440" y="235" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="#ffffff">Pétanque Pro</text>
  <text x="442" y="290" font-family="system-ui, Arial, sans-serif" font-size="28" fill="#e8f3da">Gérez vos tournois comme un champion</text>
  ${defs}
</svg>`

// Icône 512 (fond pâle arrondi + boule) — utile aussi pour le store.
const icon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#e8f3da"/>
  <g transform="translate(56,56) scale(6.25)">${boule}</g>${defs}</svg>`

await sharp(Buffer.from(banner)).png().toFile(`${OUT}/feature-graphic-1024x500.png`)
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile(`${OUT}/icon-512.png`)
console.log('Visuels store générés dans', OUT)
