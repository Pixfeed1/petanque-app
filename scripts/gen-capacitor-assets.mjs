// Génère les images sources pour @capacitor/assets (icône adaptative Android + splash),
// à partir de la boule de app/icon.svg. Sortie dans assets/ ; ensuite :
//   npx @capacitor/assets generate --android
import sharp from 'sharp'
import fs from 'node:fs'

const OUT = 'assets'
fs.mkdirSync(OUT, { recursive: true })

const boule = `
  <circle cx="32" cy="32" r="28" fill="url(#m)" stroke="#5a6978" stroke-width="2.5"/>
  <circle cx="26" cy="26" r="4" fill="#ffffff" opacity="0.85"/>
  <circle cx="38" cy="38" r="2.5" fill="#2d3748" opacity="0.35"/>
  <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
  <circle cx="52" cy="52" r="8" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
  <circle cx="49" cy="49" r="2" fill="#ffffff" opacity="0.6"/>`
const defs = `<defs><radialGradient id="m"><stop offset="0%" stop-color="#c1ccd9"/><stop offset="50%" stop-color="#a8b2c3"/><stop offset="100%" stop-color="#8e9aaf"/></radialGradient></defs>`

// icon.png : icône pleine 1024 (fond pâle + boule presque pleine).
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#e8f3da"/>
  <g transform="translate(96,96) scale(12.5)">${boule}</g>${defs}</svg>`

// Adaptatif : avant-plan transparent avec la boule dans la zone sûre (~62 %),
// arrière-plan vert de marque plein.
const fgSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(205,205) scale(9.6)">${boule}</g>${defs}</svg>`
const bgSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#e8f3da"/></svg>`

// Splash : boule centrée sur fond pâle (clair) et vert foncé (sombre).
const splash = (bg) => `<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="${bg}"/>
  <g transform="translate(1116,1116) scale(7.8)">${boule}</g>${defs}</svg>`

await sharp(Buffer.from(iconSvg)).png().toFile(`${OUT}/icon.png`)
await sharp(Buffer.from(fgSvg)).png().toFile(`${OUT}/icon-foreground.png`)
await sharp(Buffer.from(bgSvg)).png().toFile(`${OUT}/icon-background.png`)
await sharp(Buffer.from(splash('#e8f3da'))).png().toFile(`${OUT}/splash.png`)
await sharp(Buffer.from(splash('#1a3322'))).png().toFile(`${OUT}/splash-dark.png`)
console.log('Sources Capacitor générées dans', OUT)
