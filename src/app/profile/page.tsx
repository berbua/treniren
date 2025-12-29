'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import AuthGuard from '@/components/AuthGuard'
import { useLanguage } from '@/contexts/LanguageContext'

function ProfilePageContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const [showProfileModal, setShowProfileModal] = useState(true)

  const handleClose = () => {
    setShowProfileModal(false)
    router.push('/dashboard')
  }

  const handlePhotoUpdate = (photoUrl: string | null) => {
    // Photo update is handled within the UserProfile component
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              👤 {t('nav.profile') || 'Profile'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t('profile.description') || 'Manage your profile settings, cycle tracking, and app preferences'}
            </p>
          </div>

          {/* Profile Card Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                U
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {t('profile.welcome') || 'Welcome to your profile'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('profile.clickToManage') || 'Click the button below to manage your profile settings'}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ⚙️ {t('profile.manageSettings') || 'Manage Profile Settings'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                {t('profile.quickStats') || 'Quick Stats'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('profile.viewYourProgress') || 'View your training progress and statistics'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                {t('profile.cycleTracking') || 'Cycle Tracking'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('profile.manageCycleSettings') || 'Manage your menstrual cycle settings'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                {t('profile.privacy') || 'Privacy'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('profile.controlYourData') || 'Control your data and privacy settings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfile 
          onClose={handleClose}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  )
}
