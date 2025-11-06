import type { Metadata, Viewport } from "next"
// import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./providers/AuthProvider"

// Utiliser une police système au lieu de Google Fonts
// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// })

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
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  // viewport a été retiré d'ici
}

// Export séparé pour viewport
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
    <html lang="fr">
      <head>
        {/* Utilisation de polices système */}
      </head>
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}