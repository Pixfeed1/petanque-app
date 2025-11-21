// app/components/ReviewPrompt.tsx
// Popup pour demander un avis après 3 tournois

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

interface ReviewPromptProps {
  userName: string
  tournoisCount: number
  onClose: () => void
}

const Icons = {
  star: (filled: boolean) => (
    <svg
      className={`w-8 h-8 cursor-pointer transition ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  heart: (
    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  )
}

export default function ReviewPrompt({ userName, tournoisCount, onClose }: ReviewPromptProps) {
  const { showWarning, showError } = useToast()
  const [step, setStep] = useState<'rating' | 'comment' | 'success'>('rating')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [name, setName] = useState(userName || '')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Vérifier si l'utilisateur a déjà donné un avis
  useEffect(() => {
    const hasReviewed = localStorage.getItem('petanque_reviewed')
    if (hasReviewed) {
      onClose()
    }
  }, [onClose])

  const handleSubmit = async () => {
    if (!rating || !comment || !name) {
      showWarning('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (comment.length < 10) {
      showWarning('Le commentaire doit contenir au moins 10 caractères')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, content: comment, name, role })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors de l\'envoi')
      }

      localStorage.setItem('petanque_reviewed', 'true')
      setStep('success')
    } catch (error: any) {
      console.error('Erreur:', error)
      showError('Erreur lors de l\'envoi de votre avis')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLater = () => {
    // Reporter à plus tard (après 3 tournois supplémentaires)
    localStorage.setItem('petanque_review_later', String(tournoisCount + 3))
    onClose()
  }

  const handleNever = () => {
    // Ne plus demander
    localStorage.setItem('petanque_reviewed', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {Icons.close}
        </button>

        {/* Étape 1: Note */}
        {step === 'rating' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {Icons.heart}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vous adorez Pétanque Pro ?
            </h2>
            <p className="text-gray-600 mb-6">
              Vous avez créé {tournoisCount} tournois ! Donnez-nous votre avis 🎉
            </p>

            {/* Étoiles */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  {Icons.star(star <= (hoverRating || rating))}
                </button>
              ))}
            </div>

            {rating > 0 && (
              <button
                onClick={() => setStep('comment')}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
              >
                Continuer
              </button>
            )}

            <div className="flex justify-center space-x-2 mt-4 text-sm">
              <button onClick={handleLater} className="text-gray-600 hover:text-gray-800">
                Plus tard
              </button>
              <span className="text-gray-400">•</span>
              <button onClick={handleNever} className="text-gray-600 hover:text-gray-800">
                Ne plus demander
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Commentaire */}
        {step === 'comment' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Partagez votre expérience
            </h2>
            <p className="text-gray-600 mb-6">
              Votre avis aidera d'autres organisateurs
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre nom * (affiché publiquement)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean-Pierre M."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre rôle (optionnel)
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Président club de Marseille"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre commentaire * (min. 10 caractères)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Qu'est-ce que vous aimez dans Pétanque Pro ?"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">{comment.length}/500</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setStep('rating')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition font-medium"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !rating || !comment || !name}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Succès */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Merci beaucoup ! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Votre avis sera publié après modération
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
