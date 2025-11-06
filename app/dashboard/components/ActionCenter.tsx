// app/dashboard/components/ActionCenter.tsx
// Centre des actions urgentes - priorité #1 pour l'organisateur

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

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
  alert: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  play: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
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
    <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-gray-300 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">À faire maintenant</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white shadow-sm" aria-label={`${actions.length} actions à faire`}>
            {actions.length}
          </span>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="divide-y-2 divide-gray-200">
        {actions.map((action) => {
          const config = priorityConfig[action.priority]
          const icon = typeIcons[action.type]

          return (
            <div
              key={action.id}
              className={`p-5 hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start gap-4">
                {/* Indicateur de priorité */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-3 h-3 rounded-full ${config.dot} animate-pulse`} aria-hidden="true"></div>
                </div>

                {/* Icône */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg} ${config.text}`} aria-hidden="true">
                  {icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-base text-gray-900 mb-2 font-medium">
                        {action.description}
                      </p>
                      {action.meta && (
                        <p className="text-sm text-gray-700 font-medium">{action.meta}</p>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => router.push(action.actionUrl)}
                      className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-base font-bold rounded-lg hover:bg-gray-800 transition-colors min-h-[48px] shadow-sm"
                      aria-label={`${action.actionLabel} - ${action.title}`}
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
