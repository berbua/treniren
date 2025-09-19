'use client'

import { useState } from 'react'
import CycleSetupFlow from '@/components/CycleSetupFlow'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { useOffline } from '@/hooks/useOffline'
import { OfflineWorkoutForm } from '@/components/OfflineWorkoutForm'

export default function Home() {
  const { t } = useLanguage()
  const { isOnline, unsyncedWorkouts, storageSize } = useOffline()
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <CycleSetupFlow />
      <main className="container mx-auto px-4 py-16">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-50">
              {t('app.name')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t('app.description')}
            </p>
          </div>

          {/* Training Types Preview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mt-12">
            <div className="bg-training-gym text-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">🏋️ {t('training.types.gym')}</h3>
              <p className="text-sm opacity-90">{t('training.descriptions.gym')}</p>
            </div>
            <div className="bg-training-bouldering text-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">🧗 {t('training.types.bouldering')}</h3>
              <p className="text-sm opacity-90">{t('training.descriptions.bouldering')}</p>
            </div>
            <div className="bg-training-circuits text-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">🔄 {t('training.types.circuits')}</h3>
              <p className="text-sm opacity-90">{t('training.descriptions.circuits')}</p>
            </div>
            <div className="bg-training-leadRock text-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">🏔️ {t('training.types.leadRock')}</h3>
              <p className="text-sm opacity-90">{t('training.descriptions.leadRock')}</p>
            </div>
            <div className="bg-training-leadArtificial text-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">🧗‍♀️ {t('training.types.leadArtificial')}</h3>
              <p className="text-sm opacity-90">{t('training.descriptions.leadArtificial')}</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                📅 {t('features.calendarSync')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('features.calendarSyncDesc')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                📱 {t('features.pwaReady')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('features.pwaReadyDesc')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                📊 {t('features.trackProgress')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('features.trackProgressDesc')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/workouts"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium text-center"
            >
              📝 {t('workouts.title')}
            </a>
            <a
              href="/calendar"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium text-center"
            >
              📅 {t('calendar.title')}
            </a>
          </div>

          {/* PWA Status */}
          <div className="mt-16 p-6 bg-blue-100 dark:bg-blue-900 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              📱 PWA Status
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <p>🌐 Status: <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span></p>
              <p>📦 Unsynced workouts: <span className="font-semibold">{unsyncedWorkouts.length}</span></p>
              <p>💾 Storage used: <span className="font-semibold">{Math.round(storageSize.used / 1024)}KB / {Math.round(storageSize.total / 1024)}KB</span></p>
              <div className="mt-3 flex flex-col space-y-2">
                <button
                  onClick={() => setShowOfflineForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Test Offline Workout
                </button>
                <div className="text-xs text-gray-500">
                  💡 <strong>To install as PWA:</strong><br/>
                  Tap Share → &quot;Add to Home Screen&quot;
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-16 p-6 bg-green-100 dark:bg-green-900 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              🚀 {t('milestones.m3Complete')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('milestones.m3Desc')}
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p>✅ CRUD operations for workouts</p>
              <p>✅ Menstrual cycle tracking integration</p>
              <p>✅ Calendar UI with weekly/monthly views</p>
              <p>✅ Training type colors and emojis</p>
              <p>✅ Internationalization (English/Polish)</p>
              <p>✅ PWA install + offline basics</p>
            </div>
          </div>
        </div>
      </main>
      
      {showOfflineForm && (
        <OfflineWorkoutForm onClose={() => setShowOfflineForm(false)} />
      )}
    </div>
  );
}