'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-uc-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          {/* Logo & Branding */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-uc-purple to-uc-mustard rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                🦄
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-uc-text-light">
              {t('app.name') || 'Unicorn Climb'}
            </h1>
            <p className="text-xl md:text-2xl text-uc-text-muted max-w-3xl mx-auto">
              {t('landing.tagline') || 'Train with your unicorn flow - Track your climbing journey with precision and mindfulness'}
            </p>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-uc-purple to-uc-mustard text-uc-black font-semibold rounded-xl hover:from-uc-purple/90 hover:to-uc-mustard/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="mr-2">🚀</span>
              {t('landing.getStarted') || 'Get Started - Track Your Journey'}
            </Link>
            <p className="text-sm text-uc-text-muted">
              {t('landing.freeToUse') || 'Free to use • Works offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-uc-dark-bg py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-uc-text-light mb-4">
              {t('landing.whatYouCanTrack') || 'What You Can Track'}
            </h2>
            <p className="text-lg text-uc-text-muted max-w-2xl mx-auto">
              {t('landing.featuresDescription') || 'Comprehensive tracking for every aspect of your climbing journey'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gym Training */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-training-gym/20 rounded-xl flex items-center justify-center text-2xl">
                  🏋️
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">{t('workoutTypes.gym') || 'Gym Training'}</h3>
                  <p className="text-sm text-uc-text-muted">{t('workoutTypes.gymDescription') || 'Strength & conditioning'}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.trainingVolume') || 'Training Volume (TR1-TR5)'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.preSessionFeel') || 'Pre-session Feel (1-5)'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.focusLevelNotes') || 'Focus Level & Notes'}</span>
                </div>
              </div>
            </div>

            {/* Bouldering */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-training-bouldering/20 rounded-xl flex items-center justify-center text-2xl">
                  🧗
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">{t('workoutTypes.bouldering') || 'Bouldering'}</h3>
                  <p className="text-sm text-uc-text-muted">{t('workoutTypes.boulderingDescription') || 'Power & technique'}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.sectorLocation') || 'Sector & Location'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.focusLevelNotes') || 'Focus Level & Notes'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>Gratitude & Improvements</span>
                </div>
              </div>
            </div>

            {/* Lead Climbing with Strong Mind */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-training-leadRock/20 rounded-xl flex items-center justify-center text-2xl">
                  🧗‍♀️
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">Lead Climbing + Strong Mind</h3>
                  <p className="text-sm text-uc-text-muted">Advanced mental tracking & goal integration</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Mental State Tracking (1-5 scale)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Focus States & Comfort Zones</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Process & Project Goals Integration</span>
                </div>
              </div>
            </div>

            {/* Mental Practice */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-training-mentalPractice/20 rounded-xl flex items-center justify-center text-2xl">
                  🧘
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">{t('workoutTypes.mentalPractice') || 'Mental Practice'}</h3>
                  <p className="text-sm text-uc-text-muted">{t('workoutTypes.mentalPracticeDescription') || 'Mindfulness & training'}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.practiceType') || 'Practice Type (Meditation)'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.timeOfDay') || 'Time of Day (Morning/Evening)'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>{t('workoutFields.focusReflectionNotes') || 'Focus & Reflection Notes'}</span>
                </div>
              </div>
            </div>

            {/* Events & Injuries */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-uc-alert/20 rounded-xl flex items-center justify-center text-2xl">
                  🤕
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">Events & Injuries</h3>
                  <p className="text-sm text-uc-text-muted">Track injuries, competitions, and trips</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-alert rounded-full"></span>
                  <span>Injury Tracking (Body Part & Description)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-alert rounded-full"></span>
                  <span>Competition Results & Physio Visits</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-alert rounded-full"></span>
                  <span>Trip Countdown & Cycle Correlation</span>
                </div>
              </div>
            </div>

            {/* Strong Mind Goals */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-uc-purple/20 rounded-xl flex items-center justify-center text-2xl">
                  🧠
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">Strong Mind Goals</h3>
                  <p className="text-sm text-uc-text-muted">Process & project goal tracking</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Process Goals (Long-term & Short-term)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Project Goals (Routes & Boulders)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-purple rounded-full"></span>
                  <span>Progress Tracking & Achievements</span>
                </div>
              </div>
            </div>

            {/* Statistics & Analytics */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-uc-success/20 rounded-xl flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">Statistics & Analytics</h3>
                  <p className="text-sm text-uc-text-muted">Advanced insights & patterns</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-success rounded-full"></span>
                  <span>Injury vs Cycle Correlation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-success rounded-full"></span>
                  <span>Goal Progress Tracking</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-success rounded-full"></span>
                  <span>Performance Pattern Analysis</span>
                </div>
              </div>
            </div>

            {/* PWA & Offline */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-uc-mustard/20 rounded-xl flex items-center justify-center text-2xl">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">PWA & Offline</h3>
                  <p className="text-sm text-uc-text-muted">Works offline & installable</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>Offline Workout Recording</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>Installable App (iOS/Android)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-uc-mustard rounded-full"></span>
                  <span>Auto Sync When Online</span>
                </div>
              </div>
            </div>

            {/* Cycle Tracking */}
            <div className="bg-uc-black p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-uc-purple/20 hover:border-uc-purple/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-2xl">
                  🌙
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-uc-text-light">Cycle Tracking</h3>
                  <p className="text-sm text-uc-text-muted">Menstrual cycle correlation</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span>Cycle Phase Visualization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span>Performance Pattern Analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-uc-text-muted">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span>Injury Correlation Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}