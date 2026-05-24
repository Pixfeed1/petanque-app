'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { PageHeader } from '@/components/ui'
import AdminSubNav, { AdminSubNavSection } from './AdminSubNav'

export type AdminTab = 'dashboard' | 'feedback' | 'reviews'

interface AdminLayoutProps {
  activeTab: AdminTab
  metaCounts?: { feedback?: number; reviews?: number }
  children: ReactNode
}

export default function AdminLayout({ activeTab, metaCounts, children }: AdminLayoutProps) {
  const router = useRouter()

  const sections: AdminSubNavSection[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      isActive: activeTab === 'dashboard',
      onClick: () => router.push('/admin')
    },
    {
      id: 'feedback',
      label: 'Feedbacks & Beta',
      meta: metaCounts?.feedback && metaCounts.feedback > 0 ? String(metaCounts.feedback) : undefined,
      isActive: activeTab === 'feedback',
      onClick: () => router.push('/admin/feedback')
    },
    {
      id: 'reviews',
      label: 'Modération avis',
      meta: metaCounts?.reviews && metaCounts.reviews > 0 ? String(metaCounts.reviews) : undefined,
      isActive: activeTab === 'reviews',
      onClick: () => router.push('/admin/reviews')
    }
  ]

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref="/dashboard"
        backLabel="Retour"
        title="Admin"
      />
      <AdminSubNav sections={sections} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
