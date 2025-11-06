// app/dashboard/components/DashboardHeader.tsx
// Header du dashboard avec logo, notifications et menu profil

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  user: any
  organization: any
  userPlan: string
  onLogout: () => void
  onOpenUpgrade: () => void
}

// Icônes SVG
const Icons = {
  logo: (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="url(#metalGradient)" stroke="#5a6978" strokeWidth="2"/>
      <circle cx="26" cy="26" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="38" cy="38" r="2" fill="#2d3748" opacity="0.3"/>
      <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
      <defs>
        <radialGradient id="metalGradient">
          <stop offset="0%" stopColor="#a8b2c3"/>
          <stop offset="100%" stopColor="#8e9aaf"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  crown: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5 1-4 4 1 5.5L10 14l-5 3.5 1-5.5-4-4 5.5-1L10 2z" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function DashboardHeader({
  user,
  organization,
  userPlan,
  onLogout,
  onOpenUpgrade
}: DashboardHeaderProps) {
  const router = useRouter()
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
