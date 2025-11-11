// app/dashboard/components/ActionCenter.tsx
// Centre des actions urgentes - priorité #1 pour l'organisateur

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Warning, Play, Clock, Arrow } from '@/components/Icons'

export interface ActionItem {
  id: string
  type: 'match_pending' | 'tournament_ready' | 'tournament_delayed'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel: string
  actionUrl: string
  meta?: string
}

interface ActionCenterProps {
  actions: ActionItem[]
  loading: boolean
}

const Icons = {
  alert: <Warning className="w-5 h-5" />,
  play: <Play className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  arrowRight: <Arrow className="w-4 h-4" />
}

const priorityConfig = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-900',
    badge: 'bg-red-100 text-red-700'
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-700'
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700'
  }
}

const typeIcons = {
  match_pending: Icons.alert,
  tournament_ready: Icons.play,
  tournament_delayed: Icons.clock
}

export default function ActionCenter({ actions, loading }: ActionCenterProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (actions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Tout est à jour</h3>
            <p className="text-sm text-green-700">Aucune action urgente requise</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Actions requises</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {actions.length}
          </span>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="divide-y divide-gray-100">
        {actions.map((action) => {
          const config = priorityConfig[action.priority]
          const icon = typeIcons[action.type]

          return (
            <div
              key={action.id}
              className={`p-4 hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start gap-4">
                {/* Indicateur de priorité */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
                </div>

                {/* Icône */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg} ${config.text}`}>
                  {icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {action.description}
                      </p>
                      {action.meta && (
                        <p className="text-xs text-gray-500">{action.meta}</p>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => router.push(action.actionUrl)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {action.actionLabel}
                      {Icons.arrowRight}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
