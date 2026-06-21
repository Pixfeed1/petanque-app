// app/admin/feedback/page.tsx
// Boîte de réception feedback + toggle mode beta — refonte V4

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { AdminLayout } from '@/components/admin'
import { FadeIn, PillToggle } from '@/components/ui'
import { Loader } from '@/components/Icons'

interface Feedback {
  id: number
  user_id: string | null
  user_email: string
  user_name: string | null
  user_full_name: string | null
  message: string
  category: string
  status: string
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
}

interface FeedbackStats {
  total: number
  new: number
  read: number
  replied: number
}

const categoryLabels: Record<string, string> = {
  general: 'Avis',
  bug: 'Bug',
  feature: 'Demande',
  ux: 'UX'
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  read: 'Lu',
  replied: 'Répondu',
  archived: 'Archivé'
}

type FilterKey = 'all' | 'new' | 'read' | 'replied'

export default function AdminFeedback() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, new: 0, read: 0, replied: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('new')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [filterEmail, setFilterEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchFeedbacks()
    }
  }, [authLoading, user])

  useEffect(() => {
    if (user) fetchFeedbacks()
  }, [filter, filterEmail])

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/feedback?status=' + filter
      if (filterEmail) url += '&user_email=' + encodeURIComponent(filterEmail)
      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
        setStats(data.stats || { total: 0, new: 0, read: 0, replied: 0 })
      }
    } catch {}
    setLoading(false)
  }

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return
    setReplying(true)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feedback_id: selectedFeedback.id,
          admin_reply: replyText.trim()
        })
      })
      if (res.ok) {
        setReplyText('')
        setSelectedFeedback(null)
        fetchFeedbacks()
      }
    } catch {}
    setReplying(false)
  }

  const markAsRead = async (feedbackId: number) => {
    try {
      await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback_id: feedbackId, status: 'read' })
      })
      fetchFeedbacks()
    } catch {}
  }

  const viewUserConversation = (email: string) => {
    setFilterEmail(email)
    setFilter('all')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  const filterOptions: { value: FilterKey; label: string }[] = [
    { value: 'new', label: 'Nouveaux · ' + stats.new },
    { value: 'read', label: 'Lus' },
    { value: 'replied', label: 'Répondus' },
    { value: 'all', label: 'Tous' }
  ]

  return (
    <AdminLayout activeTab="feedback">
      <FadeIn>
        <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
          Administration · feedbacks
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
          Boîte de <span className="accent-italic text-petanque-vert">feedback.</span>
        </h1>
        <p className="text-base text-petanque-bois leading-relaxed mb-12 max-w-2xl">
          {stats.new > 0 ? stats.new + ' nouveau' + (stats.new > 1 ? 'x messages' : ' message') + ' à traiter.' : 'Aucun nouveau message.'}
        </p>
      </FadeIn>


      {/* SECTION 02 : Stats */}
      <FadeIn delay={140}>
        <section className="pb-10 mb-10 border-b border-petanque-sable-bord/50">
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">02</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Chiffres clés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            <FeedbackStat label="Nouveaux" value={stats.new} />
            <FeedbackStat label="Lus" value={stats.read} />
            <FeedbackStat label="Répondus" value={stats.replied} />
            <FeedbackStat label="Total" value={stats.total} />
          </div>
        </section>
      </FadeIn>

      {/* SECTION 03 : Liste */}
      <FadeIn delay={200}>
        <section>
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">03</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Messages
          </h2>

          <div className="mb-6 flex items-center gap-4 flex-wrap">
            <PillToggle
              options={filterOptions}
              value={filterEmail ? 'all' : filter}
              onChange={(v) => { setFilter(v); setFilterEmail(null) }}
            />
            {filterEmail && (
              <div className="flex items-center gap-2 bg-petanque-vert-pale/20 border border-petanque-vert/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-petanque-vert-fonce">
                  Conversation · <span className="font-mono">{filterEmail}</span>
                </span>
                <button
                  onClick={() => { setFilterEmail(null); setFilter('new') }}
                  className="text-petanque-vert-fonce/60 hover:text-petanque-vert-fonce ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <p className="text-sm text-petanque-bois italic py-12 text-center">
              Aucun feedback à afficher.
            </p>
          ) : (
            <div className="divide-y divide-petanque-sable-bord/40">
              {feedbacks.map(fb => (
                <FeedbackRow
                  key={fb.id}
                  fb={fb}
                  onMarkRead={() => markAsRead(fb.id)}
                  onReply={() => { setSelectedFeedback(fb); setReplyText('') }}
                  onViewConversation={() => viewUserConversation(fb.user_email)}
                />
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      {/* Modal reply */}
      {selectedFeedback && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedFeedback(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl border border-petanque-sable-bord z-50 p-6 shadow-lg">
            <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">
              Réponse · {selectedFeedback.user_email}
            </p>
            <h3 className="text-xl font-medium text-petanque-vert-fonce mb-4 tracking-tight">
              Répondre à <span className="accent-italic text-petanque-vert">{selectedFeedback.user_full_name || selectedFeedback.user_name || 'l\'utilisateur'}.</span>
            </h3>

            <div className="bg-petanque-sable-pale border-l-2 border-petanque-sable-bord rounded-r-md p-3 mb-4">
              <p className="text-[10px] font-mono text-petanque-bois uppercase tracking-[0.12em] mb-1">Message original</p>
              <p className="text-sm text-petanque-vert-fonce/90 whitespace-pre-wrap">{selectedFeedback.message}</p>
            </div>

            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Votre réponse…"
              rows={4}
              className="w-full px-3 py-2 border border-petanque-sable-bord rounded-lg text-sm resize-none focus:ring-2 focus:ring-petanque-vert/30 focus:border-petanque-vert mb-4 bg-white"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-petanque-vert-fonce bg-petanque-sable-pale border border-petanque-sable-bord rounded-lg hover:bg-petanque-sable transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 text-petanque-sable bg-petanque-vert rounded-lg hover:bg-petanque-vert-fonce transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replying ? 'Envoi…' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function FeedbackStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">{value}</p>
    </div>
  )
}

function FeedbackRow({ fb, onMarkRead, onReply, onViewConversation }: {
  fb: Feedback
  onMarkRead: () => void
  onReply: () => void
  onViewConversation: () => void
}) {
  const dateStr = new Date(fb.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <article className="py-6">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className={'font-mono text-[10px] uppercase tracking-[0.12em] font-medium ' + (
          fb.status === 'new' ? 'text-petanque-cochonnet-fonce' :
          fb.status === 'replied' ? 'text-petanque-vert' :
          'text-petanque-bois'
        )}>
          {statusLabels[fb.status] || fb.status}
        </span>
        <span className="text-petanque-sable-bord">·</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-petanque-bois">
          {categoryLabels[fb.category] || fb.category}
        </span>
        <span className="text-petanque-sable-bord">·</span>
        <span className="font-mono text-[10px] text-petanque-bois">{dateStr}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <button
          onClick={onViewConversation}
          className="text-sm font-medium text-petanque-vert-fonce hover:text-petanque-vert hover:underline decoration-petanque-vert/40 underline-offset-2"
        >
          {fb.user_full_name || fb.user_name || 'Anonyme'}
        </button>
        <span className="text-xs text-petanque-bois font-mono">{fb.user_email}</span>
      </div>

      <p className="text-sm text-petanque-vert-fonce/90 whitespace-pre-wrap leading-relaxed mb-3">
        {fb.message}
      </p>

      {fb.admin_reply && (
        <div className="bg-petanque-vert-pale/15 border-l-2 border-petanque-vert rounded-r-md p-3 mb-3">
          <p className="text-[10px] font-mono text-petanque-vert uppercase tracking-[0.12em] mb-1">Votre réponse</p>
          <p className="text-sm text-petanque-vert-fonce/90 whitespace-pre-wrap">{fb.admin_reply}</p>
          {fb.admin_replied_at && (
            <p className="text-[10px] font-mono text-petanque-bois mt-2">
              {new Date(fb.admin_replied_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-3">
        {fb.status === 'new' && (
          <button
            onClick={onMarkRead}
            className="text-xs font-medium text-petanque-bois hover:text-petanque-vert transition-colors"
          >
            Marquer lu
          </button>
        )}
        {fb.status !== 'replied' && (
          <button
            onClick={onReply}
            className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce transition-colors"
          >
            Répondre →
          </button>
        )}
        <button
          onClick={onViewConversation}
          className="text-xs font-medium text-petanque-bois hover:text-petanque-vert-fonce transition-colors"
        >
          Voir échanges
        </button>
      </div>
    </article>
  )
}
