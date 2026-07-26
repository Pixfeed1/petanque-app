'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'
import { Button, BouleSvg, FadeIn } from '@/components/ui'
import { Loader, Check, X } from '@/components/Icons'
import { NotificationsCard } from '@/components/NotificationsCard'
import { JoinCodeCard } from '@/components/JoinCodeCard'
import { reopenConsent } from '@/lib/consent'

export default function Parametres() {
  const router = useRouter()
  const { user, organization, isPremium } = useAuth()
  const { showError, showSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [exportingData, setExportingData] = useState(false)

  // Club customization state
  const [clubName, setClubName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2d5530')
  const [secondaryColor, setSecondaryColor] = useState('#97c459')
  const [savingCustomization, setSavingCustomization] = useState(false)

  const userPlan = (organization?.settings as Record<string, any>)?.plan || 'free'
  const isClub = userPlan === 'club'
  const planLabel = isClub ? 'Plan Club' : isPremium ? 'Plan Essentiel' : 'Plan Gratuit'

  // Load existing customization
  useEffect(() => {
    if (organization?.settings) {
      const settings = organization.settings as Record<string, any>
      const cust = settings.customization
      if (cust) {
        setClubName(cust.club_name || '')
        setLogoUrl(cust.logo_url || '')
        setPrimaryColor(cust.primary_color || '#2d5530')
        setSecondaryColor(cust.secondary_color || '#97c459')
      }
    }
  }, [organization])

  const handleSaveCustomization = async () => {
    if (!organization?.id) return
    setSavingCustomization(true)
    try {
      const response = await fetch('/api/organisations/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          org_id: organization.id,
          customization: {
            club_name: clubName.trim() || undefined,
            logo_url: logoUrl.trim() || undefined,
            primary_color: primaryColor,
            secondary_color: secondaryColor
          }
        })
      })

      if (response.ok) {
        showSuccess('Personnalisation sauvegardée')
      } else {
        const data = await response.json()
        showError(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      showError('Erreur lors de la sauvegarde')
    } finally {
      setSavingCustomization(false)
    }
  }

  const handleExportTournois = async () => {
    setExportingData(true)
    try {
      const response = await fetch('/api/tournois', { credentials: 'include' })
      if (!response.ok) throw new Error('Erreur de récupération des tournois')
      const tournois = await response.json()
      const dataStr = JSON.stringify(tournois, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = `tournois-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur export:', error)
      showError('Erreur lors de l’export')
    } finally {
      setExportingData(false)
    }
  }

  const handleExportRGPD = async () => {
    setExportingData(true)
    try {
      const [tournoiResponse, joueurResponse] = await Promise.all([
        fetch('/api/tournois', { credentials: 'include' }),
        fetch('/api/joueurs', { credentials: 'include' })
      ])
      const tournois = tournoiResponse.ok ? await tournoiResponse.json() : []
      const joueurs = joueurResponse.ok ? await joueurResponse.json() : []
      const allData = {
        user: { email: user?.email, id: user?.id, created_at: user?.created_at },
        organization,
        tournois,
        joueurs
      }
      const dataStr = JSON.stringify(allData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur export RGPD:', error)
      showError('Erreur lors de l’export')
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') return
    setLoading(true)
    try {
      showSuccess('Pour supprimer ton compte, contacte support@petanquepro.fr')
      setShowDeleteModal(false)
      setDeleteConfirmation('')
    } catch {
      showError('Erreur lors de la suppression du compte')
    } finally {
      setLoading(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
            >
              <span>←</span>
              <span className="hidden sm:inline">Tableau de bord</span>
            </button>
            <span className="font-mono text-xs text-petanque-bois">Paramètres</span>
            <span></span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Compte</span>
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-12">
            Tes paramètres et <span className="accent-italic text-petanque-vert">préférences.</span>
          </h1>
        </FadeIn>

        {/* === Section Compte === */}
        <FadeIn delay={80}>
          <section className="mb-10 pb-10 border-b border-petanque-sable-bord/50">
            <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-5">Compte</p>
            <div>
              <Row label="Email">
                <span className="text-petanque-vert-fonce font-medium">{user?.email}</span>
                <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 bg-petanque-vert-pale/30 text-petanque-vert text-[10px] font-medium uppercase tracking-[0.14em] rounded-full">
                  <Check className="w-3 h-3" />
                  Vérifié
                </span>
              </Row>
              <Row label="Organisation">
                <span className="text-petanque-vert-fonce font-medium">{organization?.name}</span>
              </Row>
              <Row label="Membre depuis">
                <span className="text-petanque-vert-fonce font-medium">{memberSince}</span>
              </Row>
            </div>
          </section>
        </FadeIn>

        {/* === Section Abonnement masquée === Gratuit pour tous : plus de plan ni
            de facturation côté UI. Code conservé pour la Phase 2 (retrait des plans). */}

        {/* === Section Personnalisation Club === */}
        {isClub && (
          <FadeIn delay={200}>
            <section className="mb-10 pb-10 border-b border-petanque-sable-bord/50">
              <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-5 flex items-center gap-3">
                <span>Personnalisation</span>
                <span className="font-mono text-[9px] text-petanque-cochonnet border border-petanque-cochonnet/40 px-2 py-0.5 rounded-full uppercase tracking-[0.16em] font-medium">Club</span>
              </p>

              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Nom du club</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder={organization?.name || 'Mon club de pétanque'}
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
              />

              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2 mt-5">URL du logo</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemple.com/logo.png"
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Couleur principale</label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-petanque-sable-bord cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 h-10 px-3 bg-white border border-petanque-sable-bord rounded-lg focus:border-petanque-vert focus:outline-none text-xs font-mono text-petanque-vert-fonce"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Couleur secondaire</label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-petanque-sable-bord cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 h-10 px-3 bg-white border border-petanque-sable-bord rounded-lg focus:border-petanque-vert focus:outline-none text-xs font-mono text-petanque-vert-fonce"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div
                className="mt-5 p-4 rounded-xl border border-petanque-sable-bord/50 flex items-center gap-3.5"
                style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)` }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-10 h-10 rounded-lg object-contain border border-petanque-sable-bord/50 bg-white flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-base flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {(clubName || organization?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>{clubName || organization?.name || 'Mon club'}</p>
                  <p className="text-[11px] text-petanque-bois">Aperçu avec tes couleurs</p>
                </div>
              </div>

              <div className="mt-5">
                <Button
                  variant="primary"
                  onClick={handleSaveCustomization}
                  disabled={savingCustomization}
                  loading={savingCustomization}
                >
                  {savingCustomization ? 'Sauvegarde…' : 'Sauvegarder la personnalisation'}
                </Button>
              </div>
            </section>
          </FadeIn>
        )}

        {/* === Section Code club (organisateur) === */}
        {organization?.id && (
          <FadeIn delay={isClub ? 220 : 160}>
            <JoinCodeCard orgId={String(organization.id)} />
          </FadeIn>
        )}

        {/* === Section Notifications === */}
        <FadeIn delay={isClub ? 240 : 180}>
          <NotificationsCard />
        </FadeIn>

        {/* === Section Données === */}
        <FadeIn delay={isClub ? 260 : 200}>
          <section className="mb-10 pb-10 border-b border-petanque-sable-bord/50">
            <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-5">Données</p>
            <DataLink
              title="Exporter mes tournois"
              description="Téléchargement JSON de tous tes tournois."
              onClick={handleExportTournois}
              loading={exportingData}
            />
            <DataLink
              title="Télécharger toutes mes données"
              description="Conformité RGPD · export complet (compte, organisation, tournois, joueurs)."
              onClick={handleExportRGPD}
              loading={exportingData}
            />
            <DataLink
              title="Gérer mes cookies"
              description="Modifier ton consentement (mesure d'audience, publicité)."
              onClick={reopenConsent}
              loading={false}
            />
          </section>
        </FadeIn>

        {/* === Section Fermer le compte === */}
        <FadeIn delay={isClub ? 320 : 260}>
          <section>
            <p className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-4">Fermer le compte</p>
            <p className="text-sm text-petanque-bois mb-5 leading-relaxed">
              Tu souhaites nous quitter ? Tes données sont conservées <strong className="text-petanque-vert-fonce font-medium">30 jours</strong> pour récupération.
              {isPremium && (
                <> Ton abonnement {planLabel.toLowerCase()} est conservé avec ton email — si tu te réinscris, ton plan sera restauré automatiquement.</>
              )}
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-petanque-cochonnet-fonce border border-petanque-cochonnet/40 rounded-lg hover:bg-petanque-cochonnet-pale/40 hover:border-petanque-cochonnet/60 transition-colors"
            >
              Fermer définitivement mon compte
            </button>
          </section>
        </FadeIn>
      </main>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-petanque-vert-fonce/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-7">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-mono text-[10px] text-petanque-cochonnet uppercase tracking-[0.18em] font-medium mb-2">Action irréversible</p>
                  <h2 className="text-xl font-medium text-petanque-vert-fonce">Fermer ton compte</h2>
                </div>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
                  className="text-petanque-bois hover:text-petanque-vert-fonce p-1"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-petanque-bois mb-1 leading-relaxed">
                Tes données seront supprimées après 30 jours.
              </p>
              {isPremium && (
                <p className="text-sm text-petanque-vert-fonce italic mb-5 leading-relaxed">
                  Ton abonnement est conservé. Si tu te réinscris avec <strong className="font-medium">{user?.email}</strong>, ton plan sera restauré.
                </p>
              )}

              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2 mt-2">
                Tape <span className="text-petanque-cochonnet-fonce font-mono">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-cochonnet focus:ring-2 focus:ring-petanque-cochonnet/20 focus:outline-none text-sm text-petanque-vert-fonce font-mono"
                placeholder="SUPPRIMER"
              />

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-petanque-bois border border-petanque-sable-bord rounded-lg hover:bg-petanque-sable-pale/60 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER' || loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-petanque-cochonnet rounded-lg hover:bg-petanque-cochonnet-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Suppression…
                    </>
                  ) : (
                    'Fermer le compte'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================
// Helpers
// =============================================================

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-3 border-b border-petanque-sable-bord/40 last:border-b-0">
      <span className="text-sm text-petanque-bois flex-shrink-0">{label}</span>
      <span className="text-sm md:text-base text-right">{children}</span>
    </div>
  )
}

function DataLink({ title, description, onClick, loading }: { title: string; description: string; onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-between gap-4 p-4 bg-white border border-petanque-sable-bord rounded-xl mb-2 hover:border-petanque-bois/50 transition-colors disabled:opacity-50 text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-medium text-petanque-vert-fonce">{title}</p>
        <p className="text-xs text-petanque-bois mt-0.5">{description}</p>
      </div>
      {loading ? (
        <Loader className="w-4 h-4 animate-spin text-petanque-vert flex-shrink-0" />
      ) : (
        <span className="text-petanque-vert flex-shrink-0">→</span>
      )}
    </button>
  )
}
