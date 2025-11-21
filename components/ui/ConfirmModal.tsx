'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_STYLES = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-amber-500 hover:bg-amber-600',
  default: 'bg-blue-600 hover:bg-blue-700'
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and ESC handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    confirmButtonRef.current?.focus()

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }, [onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-[scaleIn_0.2s_ease-out]"
      >
        <h2 id="confirm-title" className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p id="confirm-message" className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${VARIANT_STYLES[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Hook pour utiliser facilement les confirmations
import { useState } from 'react'

interface UseConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
}

export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean
    options: UseConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null
  })

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ isOpen: true, options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ isOpen: false, options: null, resolve: null })
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState({ isOpen: false, options: null, resolve: null })
  }, [state.resolve])

  const ConfirmModalComponent = state.options ? (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.options.title}
      message={state.options.message}
      confirmText={state.options.confirmText}
      cancelText={state.options.cancelText}
      variant={state.options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, ConfirmModal: ConfirmModalComponent }
}
