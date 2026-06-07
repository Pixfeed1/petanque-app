function escapeXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface CertificateOptions {
  position: number
  teamName: string
  tournamentName: string
  location?: string
  date: Date
  stats?: { victories: number; pointsFor: number; pointsAgainst: number }
}

export function buildCertificateSVG(opts: CertificateOptions): string {
  const { position, teamName, tournamentName, location, date, stats } = opts

  const cfg =
    position === 1
      ? { accent: '#b08d2e', label: 'DE CHAMPION', verb: 'Vainqueur' }
      : position === 2
      ? { accent: '#8a8d91', label: 'DE FINALISTE', verb: 'Finaliste' }
      : { accent: '#a9713b', label: 'DE TROISIÈME PLACE', verb: 'Troisième' }

  const green = '#2f4734'
  const greenSoft = '#5a7560'
  const wood = '#8a6d4a'
  const bodyCol = '#4a5a4c'
  const border = '#d8ccae'
  const bg = '#f7f2e6'
  const cx = 421

  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const tNameRaw = tournamentName || 'Tournoi de pétanque'
  const line1 = `${cfg.verb} du ${tNameRaw},`
  const line2 = location ? `disputé au ${location}, le ${dateStr}.` : `disputé le ${dateStr}.`

  let statsLine = ''
  if (stats) {
    const diff = stats.pointsFor - stats.pointsAgainst
    const sign = diff >= 0 ? '+' : ''
    const statsStr = `${stats.victories} victoires    ·    ${stats.pointsFor} points marqués    ·    différence ${sign}${diff}`
    statsLine = `<text x="${cx}" y="520" text-anchor="middle" font-family="helvetica" font-size="13" letter-spacing="1" fill="${wood}">${escapeXml(statsStr)}</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 842 595" width="842" height="595">
<rect x="0" y="0" width="842" height="595" fill="${bg}"/>
<text x="${cx}" y="365" text-anchor="middle" font-family="times" font-size="115" fill="${greenSoft}" fill-opacity="0.05" transform="rotate(-15 ${cx} 315)">PÉTANQUE</text>
<rect x="22" y="22" width="798" height="551" fill="none" stroke="${cfg.accent}" stroke-width="2"/>
<rect x="33" y="33" width="776" height="529" fill="none" stroke="${greenSoft}" stroke-width="0.6"/>
<rect x="41" y="41" width="9" height="9" fill="${cfg.accent}" transform="rotate(45 45.5 45.5)"/>
<rect x="792" y="41" width="9" height="9" fill="${cfg.accent}" transform="rotate(45 796.5 45.5)"/>
<rect x="41" y="545" width="9" height="9" fill="${cfg.accent}" transform="rotate(45 45.5 549.5)"/>
<rect x="792" y="545" width="9" height="9" fill="${cfg.accent}" transform="rotate(45 796.5 549.5)"/>
<ellipse cx="${cx}" cy="78" rx="19" ry="19" fill="#eef0e6" stroke="${greenSoft}" stroke-width="1"/>
<ellipse cx="${cx}" cy="78" rx="7" ry="19" fill="none" stroke="${greenSoft}" stroke-width="0.5" stroke-opacity="0.5"/>
<ellipse cx="${cx}" cy="78" rx="13" ry="19" fill="none" stroke="${greenSoft}" stroke-width="0.5" stroke-opacity="0.4"/>
<line x1="402" y1="78" x2="440" y2="78" stroke="${greenSoft}" stroke-width="0.5" stroke-opacity="0.4"/>
<circle cx="443" cy="63" r="4" fill="${cfg.accent}"/>
<text x="${cx}" y="126" text-anchor="middle" font-family="helvetica" font-size="13" letter-spacing="3.5" fill="${cfg.accent}">${escapeXml(tNameRaw.toUpperCase())}</text>
<line x1="345" y1="142" x2="392" y2="142" stroke="${cfg.accent}" stroke-width="0.8"/>
<rect x="416.5" y="137.5" width="9" height="9" fill="${cfg.accent}" transform="rotate(45 421 142)"/>
<line x1="450" y1="142" x2="497" y2="142" stroke="${cfg.accent}" stroke-width="0.8"/>
<text x="${cx}" y="224" text-anchor="middle" font-family="times" font-size="66" letter-spacing="8" fill="${green}">CERTIFICAT</text>
<text x="${cx}" y="256" text-anchor="middle" font-family="helvetica" font-size="16" letter-spacing="6" fill="${cfg.accent}">${cfg.label}</text>
<line x1="356" y1="290" x2="486" y2="290" stroke="${border}" stroke-width="0.8"/>
<text x="${cx}" y="332" text-anchor="middle" font-family="times" font-size="21" font-style="italic" fill="${wood}">décerné à</text>
<text x="${cx}" y="394" text-anchor="middle" font-family="times" font-size="50" fill="${green}">${escapeXml(teamName || '')}</text>
<line x1="311" y1="414" x2="531" y2="414" stroke="${cfg.accent}" stroke-width="1"/>
<text x="${cx}" y="456" text-anchor="middle" font-family="times" font-size="17" fill="${bodyCol}">${escapeXml(line1)}</text>
<text x="${cx}" y="480" text-anchor="middle" font-family="times" font-size="17" fill="${bodyCol}">${escapeXml(line2)}</text>
${statsLine}
<line x1="361" y1="540" x2="481" y2="540" stroke="${border}" stroke-width="0.5"/>
<text x="${cx}" y="554" text-anchor="middle" font-family="times" font-size="13" font-style="italic" fill="${wood}">Le Comité d'Organisation</text>
</svg>`
}
