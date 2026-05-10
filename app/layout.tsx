import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./providers/AuthProvider"
import { ToastProvider } from "@/components/ui/Toast"
import { FeedbackWidget } from "@/components/FeedbackWidget"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
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
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${cormorant.variable}`}>
      <body className="antialiased text-petanque-vert-fonce font-sans overflow-x-hidden">
        <AuthProvider>
          <ToastProvider>
            {children}
            <FeedbackWidget />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
