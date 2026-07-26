import type { CapacitorConfig } from '@capacitor/cli'

// Wrapper Android natif (Capacitor) autour de l'app web Pétanque Pro.
//
// Stratégie : l'app native charge le site en production (server.url). Le web et
// l'Android restent donc synchronisés automatiquement — un déploiement web met à
// jour l'app sans re-soumission au Play Store — tout en gardant l'accès aux plugins
// natifs (push, partage, etc.) pour de futures améliorations.
//
// Pour tester sur un serveur local/dev, surcharger l'URL :
//   CAP_SERVER_URL=http://192.168.1.20:3000 npx cap run android
const serverUrl = process.env.CAP_SERVER_URL || 'https://petanquepro.fr'

const config: CapacitorConfig = {
  appId: 'fr.petanquepro.app',
  appName: 'Pétanque Pro',
  // Dossier de repli (écran de chargement) embarqué dans l'APK. En fonctionnement
  // normal, c'est server.url qui est affiché.
  webDir: 'capacitor/www',
  server: {
    url: serverUrl,
    // HTTPS obligatoire en prod ; cleartext seulement utile pour un dev en http local.
    cleartext: serverUrl.startsWith('http://'),
  },
  android: {
    backgroundColor: '#e8f3da',
  },
}

export default config
