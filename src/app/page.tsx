'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { Icon, IconName, buttonClasses } from '@/components/ui'

type Text = [key: string, fallback: string]

interface Feature {
  icon: IconName
  title: Text
  description: Text
  bullets: Text[]
}

// Same features, texts and order as before
const FEATURES: Feature[] = [
  {
    icon: 'cycle',
    title: ['landingFeatures.cycleTracking', 'Cycle Tracking'],
    description: ['landingFeatures.cycleDescription', 'Menstrual cycle correlation'],
    bullets: [
      ['landingFeatures.cyclePhaseVisualization', 'Cycle Phase Visualization'],
      ['landingFeatures.cyclePerformancePatternAnalysis', 'Performance Pattern Analysis'],
      ['landingFeatures.injuryCorrelationInsights', 'Injury Correlation Insights'],
    ],
  },
  {
    icon: 'strong-mind',
    title: ['landingFeatures.strongMindGoals', 'Strong Mind Goals'],
    description: ['landingFeatures.strongMindGoalsDescription', 'Process & project goal tracking'],
    bullets: [
      ['landingFeatures.processGoals', 'Process Goals (Long-term & Short-term)'],
      ['landingFeatures.projectGoals', 'Project Goals (Routes & Boulders)'],
      ['landingFeatures.progressAchievements', 'Progress Tracking & Achievements'],
    ],
  },
  {
    icon: 'type-mental',
    title: ['workoutTypes.mentalPractice', 'Mental Practice'],
    description: ['workoutTypes.mentalPracticeDescription', 'Mindfulness & training'],
    bullets: [
      ['workoutFields.practiceType', 'Practice Type (Meditation)'],
      ['workoutFields.timeOfDay', 'Time of Day (Morning/Evening)'],
      ['workoutFields.focusReflectionNotes', 'Focus & Reflection Notes'],
    ],
  },
  {
    icon: 'type-lead-rock',
    title: ['landingFeatures.leadClimbingStrongMind', 'Lead Climbing + Strong Mind'],
    description: ['landingFeatures.leadClimbingDescription', 'Advanced mental tracking & goal integration'],
    bullets: [
      ['landingFeatures.mentalStateTracking', 'Mental State Tracking (1-5 scale)'],
      ['landingFeatures.focusStatesComfortZones', 'Focus States & Comfort Zones'],
      ['landingFeatures.goalsIntegration', 'Process & Project Goals Integration'],
    ],
  },
  {
    icon: 'type-gym',
    title: ['workoutTypes.gym', 'Gym Training'],
    description: ['workoutTypes.gymDescription', 'Strength & conditioning'],
    bullets: [
      ['workoutFields.trainingVolume', 'Training Volume (TR1-TR5)'],
      ['workoutFields.preSessionFeel', 'Pre-session Feel (1-5)'],
      ['workoutFields.focusLevelNotes', 'Focus Level & Notes'],
    ],
  },
  {
    icon: 'type-bouldering',
    title: ['workoutTypes.bouldering', 'Bouldering'],
    description: ['workoutTypes.boulderingDescription', 'Power & technique'],
    bullets: [
      ['workoutFields.sectorLocation', 'Sector & Location'],
      ['workoutFields.focusLevelNotes', 'Focus Level & Notes'],
      ['landingFeatures.gratitudeImprovements', 'Gratitude & Improvements'],
    ],
  },
  {
    icon: 'event-injury',
    title: ['landingFeatures.eventsInjuries', 'Events & Injuries'],
    description: ['landingFeatures.eventsInjuriesDescription', 'Track injuries, competitions, and trips'],
    bullets: [
      ['landingFeatures.injuryTracking', 'Injury Tracking (Body Part & Description)'],
      ['landingFeatures.competitionPhysio', 'Competition Results & Physio Visits'],
      ['landingFeatures.tripCountdownCycle', 'Trip Countdown & Cycle Correlation'],
    ],
  },
  {
    icon: 'stats',
    title: ['landingFeatures.statisticsAnalytics', 'Statistics & Analytics'],
    description: ['landingFeatures.statisticsDescription', 'Advanced insights & patterns'],
    bullets: [
      ['landingFeatures.injuryCycleCorrelation', 'Injury vs Cycle Correlation'],
      ['landingFeatures.goalProgressTracking', 'Goal Progress Tracking'],
      ['landingFeatures.gratitudeImprovementsAnalysis', 'Gratitude & Improvements Analysis'],
      ['landingFeatures.performancePatternAnalysis', 'Performance Pattern Analysis'],
    ],
  },
  {
    icon: 'download',
    title: ['landingFeatures.dataExportBackup', 'Data Export & Backup'],
    description: ['landingFeatures.dataExportDescription', 'Full data portability'],
    bullets: [
      ['landingFeatures.exportAllData', 'Export All Data (JSON/CSV)'],
      ['landingFeatures.versionedExport', 'Versioned Export Format'],
      ['landingFeatures.completeBackup', 'Complete Data Backup'],
    ],
  },
  {
    icon: 'library',
    title: ['landingFeatures.exercisesRoutines', 'Exercises & Routines'],
    description: ['landingFeatures.exercisesRoutinesDescription', 'Custom exercises & workout templates'],
    bullets: [
      ['landingFeatures.customExerciseLibrary', 'Custom Exercise Library'],
      ['landingFeatures.workoutRoutinesVariations', 'Workout Routines & Variations'],
      ['landingFeatures.quickAddWorkouts', 'Quick Add to Workouts'],
    ],
  },
  {
    icon: 'type-fingerboard',
    title: ['landingFeatures.fingerboardTraining', 'Fingerboard Training'],
    description: ['landingFeatures.fingerboardDescription', 'Protocols & strength testing'],
    bullets: [
      ['landingFeatures.trainingProtocols', 'Training Protocols'],
      ['landingFeatures.strengthTestingProtocols', 'Strength Testing Protocols'],
      ['landingFeatures.progressChartsAnalytics', 'Progress Charts & Analytics'],
    ],
  },
  {
    icon: 'install',
    title: ['landingFeatures.pwaOffline', 'PWA & Offline'],
    description: ['landingFeatures.pwaOfflineDescription', 'Works offline & installable'],
    bullets: [
      ['landingFeatures.offlineRecording', 'Offline Workout Recording'],
      ['landingFeatures.installableApp', 'Installable App (iOS/Android)'],
      ['landingFeatures.autoSync', 'Auto Sync When Online'],
    ],
  },
]

const RING_PHASES = ['menstruation', 'follicular', 'ovulation', 'early-luteal', 'late-luteal'] as const

/** Decorative cycle ring: one rounded arc per phase, 🦄 in the middle. */
function CycleRing() {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const slot = circumference / RING_PHASES.length
  const arc = slot - 30 // room for the round caps

  return (
    <div aria-hidden className="relative mx-auto size-56 sm:size-72">
      <svg viewBox="0 0 220 220" className="size-full -rotate-[72deg]">
        {RING_PHASES.map((phase, index) => (
          <circle
            key={phase}
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={`var(--uc-phase-${phase})`}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeDashoffset={-index * slot}
          />
        ))}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-uc-accent-text">
        <Icon name="horn" size={64} />
      </span>
    </div>
  )
}

export default function LandingPage() {
  const { t } = useLanguage()
  const text = ([key, fallback]: Text) => t(key) || fallback

  // The tagline reads "Headline - supporting line"; show the parts as headline + lead
  const tagline = t('landing.tagline') || 'Train with your unicorn flow - Track your climbing journey with precision and mindfulness'
  const [headline, ...leadParts] = tagline.split(' - ')
  const lead = leadParts.join(' - ')

  const getStarted = (
    <Link href="/dashboard" className={buttonClasses('accent', 'lg')}>
      {t('landing.getStarted') || 'Get Started - Track Your Journey'}
    </Link>
  )

  return (
    <div className="min-h-screen bg-uc-bg text-uc-text">
      <div className="mx-auto max-w-[1120px] px-4 lg:px-8">
        {/* Hero */}
        <section className="grid items-center gap-10 py-12 sm:py-20 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex min-h-8 items-center rounded-uc-pill border border-uc-border px-3 text-[13px] font-bold text-uc-text">
              {t('app.name') || 'Unicorn Climb'}
            </span>
            <h1 className="mt-5 max-w-2xl text-[40px] leading-[1.05] sm:text-[64px] font-extrabold tracking-[-0.02em]">
              {headline}
            </h1>
            {lead && <p className="mt-5 max-w-xl text-lg sm:text-xl text-uc-text-muted">{lead}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              {getStarted}
              <p className="text-sm font-semibold text-uc-text-muted">{t('landing.freeToUse') || 'Free to use • Works offline'}</p>
            </div>
          </div>
          <CycleRing />
        </section>

        {/* Features */}
        <section className="pb-16">
          <h2 className="text-[28px] sm:text-[36px] leading-tight font-extrabold">
            {t('landing.whatYouCanTrack') || 'What You Can Track'}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-uc-text-muted">
            {t('landing.featuresDescription') || 'Comprehensive tracking for every aspect of your climbing journey'}
          </p>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.title[0]} className="bg-uc-surface border border-uc-border rounded-uc-card p-5">
                <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-uc-primary-container text-uc-on-primary-container">
                  <Icon name={feature.icon} size={22} />
                </span>
                <h3 className="mt-4 text-[17px] font-extrabold leading-6">{text(feature.title)}</h3>
                <p className="mt-1 text-sm text-uc-text-muted">{text(feature.description)}</p>
                <ul className="mt-3 space-y-1.5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet[0]} className="flex items-start gap-2 text-[13px] text-uc-text-muted">
                      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-uc-primary" />
                      <span>{text(bullet)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action */}
        <section className="mb-16 flex flex-col gap-6 rounded-uc-sheet bg-uc-primary-container p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[24px] sm:text-[32px] leading-tight font-extrabold text-uc-on-primary-container">
              {t('landing.readyToStart') || 'Ready to Start Your Journey?'}
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-uc-on-primary-container/80">
              {t('landing.ctaDescription') || 'Join climbers who are already tracking their progress and improving their performance'}
            </p>
          </div>
          <Link href="/dashboard" className={buttonClasses('accent', 'lg', 'shrink-0 self-start md:self-auto')}>
            {t('landing.startTracking') || 'Start Tracking Now'}
          </Link>
        </section>
      </div>
    </div>
  )
}
