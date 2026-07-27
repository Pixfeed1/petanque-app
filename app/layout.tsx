import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "./providers/AuthProvider"
import { ToastProvider } from "@/components/ui/Toast"
import { FeedbackWidget } from "@/components/FeedbackWidget"
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister"
import { NativeBridge } from "@/components/NativeBridge"
import { ConsentBanner } from "@/components/ConsentBanner"
import { ConsentedScripts } from "@/components/ConsentedScripts"
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner"

// Polices servies localement (zéro appel réseau au build).
// Geist + Geist Mono : fournis bundlés par le package "geist".
// Cormorant Garamond : .woff2 téléchargé dans app/fonts/.
const cormorant = localFont({
  src: "./fonts/CormorantGaramond-Italic.woff2",
  weight: "500",
  style: "italic",
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pétanque Pro - Gestion de Tournois",
  description: "L'application de référence pour organiser vos tournois de pétanque",
  keywords: "pétanque, tournoi, gestion, sport, boules, compétition",
  authors: [{ name: "Pixfeed", url: "https://pixfeed.net" }],
  openGraph: {
    title: "Pétanque Pro",
    description: "Organisez vos tournois de pétanque comme un pro",
    type: "website",
    locale: "fr_FR",
    siteName: "Pétanque Pro",
  },
  // PWA : nom court sur l'écran d'accueil iOS + icône Apple.
  appleWebApp: {
    capable: true,
    title: "Pétanque Pro",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a3322",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable}`}>
      <body className="antialiased text-petanque-vert-fonce font-sans overflow-x-hidden">
        {/* Accessibilité : lien d'évitement pour aller directement au contenu (clavier). */}
        <a href="#contenu" className="skip-link">Aller au contenu</a>
        <AuthProvider>
          <ToastProvider>
            <EmailVerificationBanner />
            <div id="contenu">{children}</div>
            <FeedbackWidget />
            <ServiceWorkerRegister />
            <NativeBridge />
            <ConsentBanner />
            <ConsentedScripts />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
