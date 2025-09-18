'use client'

import { useState } from 'react'

interface CycleConsentModalProps {
  onAccept: () => void
  onDecline: () => void
}

export default function CycleConsentModal({ onAccept, onDecline }: CycleConsentModalProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleAccept = () => {
    setIsOpen(false)
    onAccept()
  }

  const handleDecline = () => {
    setIsOpen(false)
    onDecline()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌸</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Cycle Tracking
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Would you like to include menstruation cycle tracking in your training diary?
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              What this includes:
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Track your cycle phases and training recommendations</li>
              <li>• See how your cycle affects your training performance</li>
              <li>• Get personalized workout suggestions based on your phase</li>
              <li>• All data is private and stored securely</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> You can enable this feature later in your profile settings if you prefer to skip it now.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Skip for now
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Yes, enable cycle tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
