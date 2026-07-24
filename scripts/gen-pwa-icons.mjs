// Génère les icônes PNG de la PWA à partir de app/icon.svg (boule métallique + cochonnet).
// - icon-192 / icon-512 : icônes « any » (boule sur fond pâle arrondi, lisible sur tout launcher)
// - maskable-512 : zone de sécurité respectée (boule centrée à ~66 %, fond plein vert de marque)
// - apple-touch-icon 180 : iOS (fond plein, pas de transparence)
import sharp from 'sharp'
import fs from 'node:fs'

const OUT = 'public/icons'
fs.mkdirSync(OUT, { recursive: true })

// Boule + cochonnet (repris de app/icon.svg), sans fond.
const boule = `
  <circle cx="32" cy="32" r="28" fill="url(#m)" stroke="#5a6978" stroke-width="2.5"/>
  <circle cx="26" cy="26" r="4" fill="#ffffff" opacity="0.85"/>
  <circle cx="38" cy="38" r="2.5" fill="#2d3748" opacity="0.35"/>
  <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
  <circle cx="52" cy="52" r="8" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
  <circle cx="49" cy="49" r="2" fill="#ffffff" opacity="0.6"/>`
const defs = `<defs><radialGradient id="m"><stop offset="0%" stop-color="#c1ccd9"/><stop offset="50%" stop-color="#a8b2c3"/><stop offset="100%" stop-color="#8e9aaf"/></radialGradient></defs>`

// Icône « any » : fond pâle arrondi + boule presque pleine.
const anySvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#e8f3da"/>
  <g transform="translate(56,56) scale(6.25)">${boule}</g>${defs}</svg>`

// Icône maskable : fond plein vert de marque + boule dans la zone sûre (60 %).
const maskSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1a3322"/>
  <g transform="translate(102,102) scale(4.6)">${boule}</g>${defs}</svg>`

// Apple touch : fond plein pâle (iOS n'aime pas la transparence).
const appleSvg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" fill="#e8f3da"/>
  <g transform="translate(18,18) scale(2.25)">${boule}</g>${defs}</svg>`

await sharp(Buffer.from(anySvg)).resize(192, 192).png().toFile(`${OUT}/icon-192.png`)
await sharp(Buffer.from(anySvg)).resize(512, 512).png().toFile(`${OUT}/icon-512.png`)
await sharp(Buffer.from(maskSvg)).resize(512, 512).png().toFile(`${OUT}/maskable-512.png`)
await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`)
console.log('Icônes PWA générées dans', OUT)
