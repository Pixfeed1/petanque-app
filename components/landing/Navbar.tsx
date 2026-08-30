'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers/AuthProvider'
import { BouleSvg, Button } from '@/components/ui'
import { Menu, Close } from '@/components/Icons'

const navLinks = [
  { id: 'features', label: 'Fonctionnalités' },
  { id: 'modes', label: 'Modes' },
  { id: 'testimonials', label: 'Avis' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLanding = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = (id: string) => {
    if (!isLanding) {
      router.push(`/#${id}`)
      return
    }
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-petanque-sable-bord/30'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="relative flex-shrink-0">
              <BouleSvg size={32} variant="acier" stries className="group-hover:rotate-12 transition-transform duration-500" />
              <div className="absolute -bottom-0.5 -right-0.5">
                <BouleSvg size={14} variant="vert" stries={false} />
              </div>
            </div>
            <span className="text-base font-medium text-petanque-vert-fonce tracking-tight">
              Pétanque Pro
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="px-3 py-1.5 text-sm text-petanque-bois hover:text-petanque-vert-fonce transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-24 h-8 bg-petanque-sable rounded-lg animate-pulse" />
            ) : user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                Tableau de bord →
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Connexion
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Commencer
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition"
            aria-label="Menu"
          >
            {mobileOpen ? <Close /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-petanque-sable-bord/40 bg-white/95 backdrop-blur-md py-3 -mx-4 px-4">
            <nav className="flex flex-col gap-1 mb-3">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left px-3 py-2 text-sm text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition"
                >
                  {link.label}
                </button>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              {user ? (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false)
                    router.push('/dashboard')
                  }}
                >
                  Tableau de bord
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileOpen(false)
                      router.push('/login')
                    }}
                  >
                    Connexion
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileOpen(false)
                      router.push('/login')
                    }}
                  >
                    Commencer
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
