/**
 * Modal de renommage d'équipe
 */

'use client'

import type { Team } from '@/hooks/tournament'

interface RenameTeamModalProps {
  editingTeam: Team
  newTeamName: string
  onNameChange: (name: string) => void
  onClose: () => void
  onRename: () => Promise<void>
}

export default function RenameTeamModal({
  editingTeam,
  newTeamName,
  onNameChange,
  onClose,
  onRename
}: RenameTeamModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h2 className="text-2xl font-bold text-white">
            ✏️ Renommer l&apos;équipe
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom actuel : <span className="font-bold">{editingTeam.name}</span>
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onRename()
              }}
              placeholder="Nouveau nom de l'équipe"
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {newTeamName.length}/50 caractères
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">
              💡 <strong>Astuce :</strong> Choisissez un nom unique et amusant pour votre équipe !
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Exemples : &quot;Les Champions&quot;, &quot;Team Rocket&quot;, &quot;Les Invincibles&quot;
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onRename}
              disabled={!newTeamName.trim() || newTeamName.trim() === editingTeam.name}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Renommer
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
