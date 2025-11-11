// app/dashboard/components/DashboardHeader.tsx
// Header du dashboard avec logo, notifications et menu profil

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Petanque, Bell, ChevronDown, Settings, Logout, Crown, Star } from '@/components/Icons'

interface DashboardHeaderProps {
  user: any
  organization: any
  pendingActionsCount: number
  pendingActions: Array<{
    type: string
    icon: React.ReactElement
    title: string
    description: string
    tournoi?: string
    action: () => void
  }>
  userPlan: string
  onLogout: () => void
  onOpenUpgrade: () => void
}

// Icônes SVG
const Icons = {
  logo: <Petanque className="w-10 h-10" />,
  bell: <Bell className="w-5 h-5" />,
  chevronDown: <ChevronDown className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  logout: <Logout className="w-4 h-4" />,
  crown: <Crown className="w-4 h-4" />,
  star: <Star className="w-4 h-4" />
}

export default function DashboardHeader({
  user,
  organization,
  pendingActionsCount,
  pendingActions,
  userPlan,
  onLogout,
  onOpenUpgrade
}: DashboardHeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et nom */}
          <div className="flex items-center space-x-3">
            {Icons.logo}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Pétanque Pro</h1>
              <p className="text-xs text-gray-500">{organization?.name || 'Mon Club'}</p>
            </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {Icons.bell}
                {pendingActionsCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendingActionsCount}
                  </span>
                )}
              </button>

              {/* Dropdown notifications */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">
                        {pendingActionsCount > 0
                          ? `${pendingActionsCount} action${pendingActionsCount > 1 ? 's' : ''} en attente`
                          : 'Aucune action en attente'
                        }
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {pendingActionsCount > 0 ? (
                        pendingActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.action()
                              setShowNotifications(false)
                            }}
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-start space-x-3 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                              {action.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                              <p className="text-xs text-gray-600">{action.description}</p>
                              {action.tournoi && (
                                <p className="text-xs text-gray-500 mt-1">{action.tournoi}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <div className="text-3xl mb-2">✨</div>
                          <p className="text-sm">Tout est à jour !</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Séparateur */}
            <div className="h-6 w-px bg-gray-200"></div>

            {/* Menu profil */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
                </span>
                {Icons.chevronDown}
              </button>

              {/* Dropdown profil */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Connecté en tant que</p>
                      <p className="font-medium text-gray-900 truncate text-sm">{user?.email}</p>
                    </div>

                    <div className="p-2">
                      <div className="px-3 py-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Organisation</span>
                          <span className="font-medium text-gray-900">{organization?.name}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          onOpenUpgrade()
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-500">
                              {userPlan === 'premium' ? Icons.crown : Icons.star}
                            </span>
                            <span className="text-sm font-medium">
                              {userPlan === 'premium' ? 'Premium' : 'Gratuit'}
                            </span>
                          </div>
                          {userPlan === 'free' && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                              Upgrade
                            </span>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          router.push('/parametres')
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                      >
                        {Icons.settings}
                        <span>Paramètres</span>
                      </button>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false)
                            onLogout()
                          }}
                          className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          {Icons.logout}
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
