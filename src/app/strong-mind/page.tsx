'use client'

import { ReactNode, useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useLanguage } from '@/contexts/LanguageContext'
import { GoalProgressDisplay } from '@/components/GoalProgressDisplay'
import { statisticsService, StatisticsData, TimeFrame } from '@/lib/statistics-service'
import { Workout } from '@/types/workout'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import {
  BottomSheet,
  Button,
  buttonClasses,
  Card,
  Chip,
  ChoiceChip,
  EmptyState,
  Input,
  Label,
  Icon,
  Overline,
  SegmentedControl,
  Select,
  SkeletonRows,
  Textarea,
  workoutBg,
} from '@/components/ui'

type GoalKind = 'process' | 'project'

const typeLabelKey: Record<string, string> = {
  GYM: 'gym',
  BOULDERING: 'bouldering',
  CIRCUITS: 'circuits',
  LEAD_ROCK: 'leadRock',
  LEAD_ARTIFICIAL: 'leadArtificial',
  MENTAL_PRACTICE: 'mentalPractice',
  FINGERBOARD: 'fingerboard',
}

export default function StrongMindPage() {
  return (
    <AuthGuard>
      <StrongMindPageContent />
    </AuthGuard>
  )
}

function StrongMindPageContent() {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const [activeTab, setActiveTab] = useState<'goals' | 'gratitude' | 'statistics'>('goals')
  const [processSheetOpen, setProcessSheetOpen] = useState(false)
  const [projectSheetOpen, setProjectSheetOpen] = useState(false)
  const [deletingGoal, setDeletingGoal] = useState<{ kind: GoalKind; id: string } | null>(null)
  const [gratitudeFilter, setGratitudeFilter] = useState<'all' | 'gratitude' | 'improvements'>('all')
  const [gratitudeWorkouts, setGratitudeWorkouts] = useState<Array<{
    id: string
    type: string
    startTime: string
    sector?: string
    gratitude?: string
    improvements?: string
  }>>([])
  const [timeframeValue, setTimeframeValue] = useState<string>('1')
  const [timeframeUnit, setTimeframeUnit] = useState<string>('weeks')
  const [startDate, setStartDate] = useState<string>('')
  const [goalDescription, setGoalDescription] = useState<string>('')
  const [editingProcessGoalId, setEditingProcessGoalId] = useState<string | null>(null)
  
  // Project goal form state
  const [climbingType, setClimbingType] = useState<string>('route')
  const [routeGrade, setRouteGrade] = useState<string>('')
  const [gradeSystem, setGradeSystem] = useState<string>('french')
  const [routeName, setRouteName] = useState<string>('')
  const [sectorLocation, setSectorLocation] = useState<string>('')
  const [relatedProcessGoal, setRelatedProcessGoal] = useState<string>('')
  const [editingProjectGoalId, setEditingProjectGoalId] = useState<string | null>(null)
  
  // Goals storage
  const [processGoals, setProcessGoals] = useState<Array<{
    id: string
    timeframeValue: string
    timeframeUnit: string
    startDate: string
    goalDescription: string
    createdAt: string
  }>>([])
  
  const [projectGoals, setProjectGoals] = useState<Array<{
    id: string
    climbingType: string
    gradeSystem: string
    routeGrade: string
    routeName: string
    sectorLocation: string
    relatedProcessGoal: string
    createdAt: string
  }>>([])

  // Client-side only state to prevent hydration issues
  const [isClient, setIsClient] = useState(false)
  const [idCounter, setIdCounter] = useState(0)
  
  // Statistics state
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [statsData, setStatsData] = useState<StatisticsData | null>(null)
  const [statsTimeframe, setStatsTimeframe] = useState<TimeFrame>('1month')
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Load goals from localStorage
    const storedProcessGoals = localStorage.getItem('processGoals')
    const storedProjectGoals = localStorage.getItem('projectGoals')
    
    if (storedProcessGoals) {
      try {
        const goals = JSON.parse(storedProcessGoals)
        setProcessGoals(goals)
        // Set counter to avoid ID conflicts
        if (goals.length > 0) {
          const maxId = Math.max(...goals.map((g: { id: string }) => parseInt(g.id.split('-')[1]) || 0))
          setIdCounter(maxId + 1)
        }
      } catch (e) {
        console.error('Error parsing process goals:', e)
      }
    }
    
    if (storedProjectGoals) {
      try {
        const goals = JSON.parse(storedProjectGoals)
        setProjectGoals(goals)
      } catch (e) {
        console.error('Error parsing project goals:', e)
      }
    }

    // Fetch workouts with gratitude data
    const fetchGratitudeWorkouts = async () => {
      try {
        // Fetch all workouts for gratitude (use large limit)
        const response = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          // Handle both new paginated format and old format
          const workouts = Array.isArray(data) ? data : (data.workouts || [])
          // Filter workouts that have gratitude or improvements, sort by date descending
          const workoutsWithGratitude = workouts
            .filter((w: any) => w.gratitude || w.improvements)
            .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          setGratitudeWorkouts(workoutsWithGratitude)
        }
      } catch (error) {
        console.error('Error fetching gratitude workouts:', error)
      }
    }
    fetchGratitudeWorkouts()
    
    // Fetch workouts for statistics
    const fetchWorkouts = async () => {
      try {
        // Fetch all workouts for statistics (use large limit)
        const response = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          // Handle both new paginated format and old format
          const workoutsData = Array.isArray(data) ? data : (data.workouts || [])
          setWorkouts(workoutsData)
        }
      } catch (error) {
        console.error('Error fetching workouts:', error)
      }
    }
    fetchWorkouts()
  }, [])
  
  // Calculate statistics when workouts or timeframe changes
  useEffect(() => {
    if (workouts.length === 0) return
    
    const calculateStats = async () => {
      setStatsLoading(true)
      try {
        const stats = statisticsService.calculateStatistics(workouts, [], statsTimeframe, undefined, [], undefined)
        setStatsData(stats)
      } catch (error) {
        console.error('Error calculating statistics:', error)
      } finally {
        setStatsLoading(false)
      }
    }
    
    calculateStats()
  }, [workouts, statsTimeframe])

  // Helper function to determine if timeframe is long-term
  const isLongTerm = (value: string, unit: string): boolean => {
    const numValue = parseInt(value)
    if (unit === 'quarters' || unit === 'year' || unit === 'years') return true
    if (unit === 'months' && numValue >= 3) return true
    return false
  }

  // Separate goals into long-term and short-term (only on client)
  const longTermGoals = isClient ? processGoals.filter(goal => 
    isLongTerm(goal.timeframeValue, goal.timeframeUnit)
  ) : []
  
  const shortTermGoals = isClient ? processGoals.filter(goal => 
    !isLongTerm(goal.timeframeValue, goal.timeframeUnit)
  ) : []

  const resetProcessForm = () => {
    setEditingProcessGoalId(null)
    setTimeframeValue('1')
    setTimeframeUnit('weeks')
    setStartDate('')
    setGoalDescription('')
  }

  const resetProjectForm = () => {
    setEditingProjectGoalId(null)
    setClimbingType('route')
    setRouteGrade('')
    setGradeSystem('french')
    setRouteName('')
    setSectorLocation('')
    setRelatedProcessGoal('')
  }

  const closeProcessSheet = () => {
    setProcessSheetOpen(false)
    resetProcessForm()
  }

  const closeProjectSheet = () => {
    setProjectSheetOpen(false)
    resetProjectForm()
  }

  const handleAddGoal = () => {
    if (!goalDescription.trim()) return
    
    if (editingProcessGoalId) {
      // Update existing goal
      const updatedGoals = processGoals.map(goal => 
        goal.id === editingProcessGoalId
          ? {
              ...goal,
              timeframeValue,
              timeframeUnit,
              startDate,
              goalDescription
            }
          : goal
      )
      setProcessGoals(updatedGoals)
      localStorage.setItem('processGoals', JSON.stringify(updatedGoals))
      setEditingProcessGoalId(null)
    } else {
      // Add new goal
      const newGoal = {
        id: `goal-${idCounter}`,
        timeframeValue,
        timeframeUnit,
        startDate,
        goalDescription,
        createdAt: new Date().toISOString()
      }
      
      const updatedGoals = [...processGoals, newGoal]
      setProcessGoals(updatedGoals)
      localStorage.setItem('processGoals', JSON.stringify(updatedGoals))
      setIdCounter(prev => prev + 1)
    }
    
    closeProcessSheet()
  }

  const handleEditProcessGoal = (goalId: string) => {
    const goal = processGoals.find(g => g.id === goalId)
    if (goal) {
      setTimeframeValue(goal.timeframeValue)
      setTimeframeUnit(goal.timeframeUnit)
      setStartDate(goal.startDate)
      setGoalDescription(goal.goalDescription)
      setEditingProcessGoalId(goalId)
      setProcessSheetOpen(true)
    }
  }

  const handleDeleteProcessGoal = (goalId: string) => {
    const updatedGoals = processGoals.filter(g => g.id !== goalId)
    setProcessGoals(updatedGoals)
    localStorage.setItem('processGoals', JSON.stringify(updatedGoals))
    if (editingProcessGoalId === goalId) resetProcessForm()
  }

  const handleAddRouteGoal = () => {
    if (!routeGrade || !routeName.trim() || !sectorLocation.trim()) return
    
    if (editingProjectGoalId) {
      // Update existing goal
      const updatedGoals = projectGoals.map(goal => 
        goal.id === editingProjectGoalId
          ? {
              ...goal,
              climbingType,
              gradeSystem,
              routeGrade,
              routeName,
              sectorLocation,
              relatedProcessGoal
            }
          : goal
      )
      setProjectGoals(updatedGoals)
      localStorage.setItem('projectGoals', JSON.stringify(updatedGoals))
      setEditingProjectGoalId(null)
    } else {
      // Add new goal
      const newProjectGoal = {
        id: `project-${idCounter}`,
        climbingType,
        gradeSystem,
        routeGrade,
        routeName,
        sectorLocation,
        relatedProcessGoal,
        createdAt: new Date().toISOString()
      }
      
      const updatedGoals = [...projectGoals, newProjectGoal]
      setProjectGoals(updatedGoals)
      localStorage.setItem('projectGoals', JSON.stringify(updatedGoals))
      setIdCounter(prev => prev + 1)
    }
    
    closeProjectSheet()
  }

  const handleEditProjectGoal = (goalId: string) => {
    const goal = projectGoals.find(g => g.id === goalId)
    if (goal) {
      setClimbingType(goal.climbingType)
      setGradeSystem(goal.gradeSystem)
      setRouteGrade(goal.routeGrade)
      setRouteName(goal.routeName)
      setSectorLocation(goal.sectorLocation)
      setRelatedProcessGoal(goal.relatedProcessGoal)
      setEditingProjectGoalId(goalId)
      setProjectSheetOpen(true)
    }
  }

  const handleDeleteProjectGoal = (goalId: string) => {
    const updatedGoals = projectGoals.filter(g => g.id !== goalId)
    setProjectGoals(updatedGoals)
    localStorage.setItem('projectGoals', JSON.stringify(updatedGoals))
    if (editingProjectGoalId === goalId) resetProjectForm()
  }

  const handleConfirmDelete = () => {
    if (!deletingGoal) return
    if (deletingGoal.kind === 'process') handleDeleteProcessGoal(deletingGoal.id)
    else handleDeleteProjectGoal(deletingGoal.id)
    setDeletingGoal(null)
  }

  // Get available grade systems based on climbing type
  const getAvailableGradeSystems = (type: string) => {
    if (type === 'boulder') {
      return [
        { value: 'french', label: t('strongMind.frenchGrades') || 'French (6a, 7b, etc.)' },
        { value: 'american', label: t('strongMind.americanBoulderGrades') || 'American (V0, V8, etc.)' }
      ]
    } else { // route
      return [
        { value: 'french', label: t('strongMind.frenchGrades') || 'French (6a, 7b, etc.)' },
        { value: 'polish', label: t('strongMind.polishGrades') || 'Polish (VI.1, VI.2, etc.)' },
        { value: 'american', label: t('strongMind.americanRouteGrades') || 'American (5.10a, 5.12b, etc.)' }
      ]
    }
  }

  // Generate grade options based on system and climbing type
  const getGradeOptions = (system: string, type: string) => {
    if (type === 'boulder') {
      switch (system) {
        case 'french':
          return ['3', '4', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8b+', '8c', '8c+', '9a', '9a+', '9b', '9b+', '9c', '9c+']
        case 'american':
          return ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17']
        default:
          return []
      }
    } else { // route
      switch (system) {
        case 'french':
          return ['3', '4', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8b+', '8c', '8c+', '9a', '9a+', '9b', '9b+', '9c', '9c+']
        case 'polish':
          return ['III', 'III+', 'IV', 'IV+', 'V', 'V+', 'VI', 'VI+', 'VI.1', 'VI.1+', 'VI.2', 'VI.2+', 'VI.3', 'VI.3+', 'VI.4', 'VI.4+', 'VI.5', 'VI.5+', 'VI.6', 'VI.6+', 'VI.7', 'VI.7+', 'VI.8', 'VI.8+']
        case 'american':
          return ['5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10a', '5.10b', '5.10c', '5.10d', '5.11a', '5.11b', '5.11c', '5.11d', '5.12a', '5.12b', '5.12c', '5.12d', '5.13a', '5.13b', '5.13c', '5.13d']
        default:
          return []
      }
    }
  }

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const timeframeLabel = (value: string, unit: string) =>
    `${value} ${(t(`strongMind.${unit}`) || unit).toLowerCase()}`
  const workoutTypeLabel = (type: string) =>
    typeLabelKey[type] ? t(`training.types.${typeLabelKey[type]}`) || type : type

  const header = (
    <h1 className="flex items-center gap-2.5 text-[28px] font-extrabold leading-tight text-uc-text">
      <Icon name="strong-mind" size={28} className="text-uc-primary" />
      {t('strongMind.title') || 'Strong Mind'}
    </h1>
  )

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-uc-bg">
        <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
          {header}
          <SkeletonRows />
        </div>
      </div>
    )
  }

  const editDeleteButtons = (kind: GoalKind, id: string) => (
    <div className="flex shrink-0 -mr-2 -mt-2">
      <button
        type="button"
        onClick={() => (kind === 'process' ? handleEditProcessGoal(id) : handleEditProjectGoal(id))}
        aria-label={t('common.edit') || 'Edit'}
        className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-elevated hover:text-uc-text"
      >
        <Icon name="edit" />
      </button>
      <button
        type="button"
        onClick={() => setDeletingGoal({ kind, id })}
        aria-label={t('common.delete') || 'Delete'}
        className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-elevated hover:text-uc-error"
      >
        <Icon name="delete" />
      </button>
    </div>
  )

  const renderProcessGoals = (goals: typeof processGoals, title: string, emptyText: string) => (
    <div>
      <Overline className="mb-2 mt-4">
        {title} <span className="uc-num">({goals.length})</span>
      </Overline>
      {goals.length === 0 ? (
        <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <Card key={goal.id}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-[17px] font-bold leading-6 text-uc-text">{goal.goalDescription}</p>
                  <p className="mt-1 text-[13px] font-semibold text-uc-text-muted uc-num">
                    {timeframeLabel(goal.timeframeValue, goal.timeframeUnit)}
                    {goal.startDate && <> · {t('strongMind.startingFrom') || 'starting from'} {formatShortDate(goal.startDate)}</>}
                  </p>
                </div>
                {editDeleteButtons('process', goal.id)}
              </div>
              <GoalProgressDisplay goalId={goal.id} goalType="process" goalName={goal.goalDescription} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const gratitudeCard = (workout: typeof gratitudeWorkouts[number], kind: 'gratitude' | 'improvements') => (
    <Card key={`${kind}-${workout.id}`} className="flex flex-col gap-2">
      <Icon
        name={kind === 'gratitude' ? 'gratitude' : 'improve'}
        className={kind === 'gratitude' ? 'text-uc-accent-text' : 'text-uc-primary'}
      />
      <p className="flex-1 whitespace-pre-wrap text-[15px] font-semibold leading-snug text-uc-text">
        {kind === 'gratitude' ? workout.gratitude : workout.improvements}
      </p>
      <p className="text-[12px] font-semibold text-uc-text-muted">
        {formatShortDate(workout.startTime)} · {workoutTypeLabel(workout.type)}
        {workout.sector && <> · <Icon name="event-trip" size={13} className="inline -mt-0.5" /> {workout.sector}</>}
      </p>
    </Card>
  )

  const renderGratitudeSection = (kind: 'gratitude' | 'improvements') => {
    const entries = gratitudeWorkouts.filter(w => (kind === 'gratitude' ? w.gratitude : w.improvements))
    const isGratitude = kind === 'gratitude'
    return (
      <section>
        <Overline className="mb-2 flex items-center gap-1.5">
          <Icon name={isGratitude ? 'gratitude' : 'improve'} size={16} />
          {isGratitude
            ? (t('strongMind.gratefulFor') || '3 things I am grateful for')
            : (t('strongMind.improvements') || '3 things to do better next time')}
        </Overline>
        {entries.length === 0 ? (
          <Card className="border-dashed">
            <EmptyState
              icon={<Icon name={isGratitude ? 'gratitude' : 'improve'} size={28} />}
              title={isGratitude
                ? (t('strongMind.noGratitude') || 'No gratitude entries yet')
                : (t('strongMind.noImprovements') || 'No improvement notes yet')}
              description={isGratitude
                ? (t('strongMind.noGratitudeDescription') || 'Start adding gratitude notes to your workouts to reflect on what you\'re thankful for in your training journey.')
                : (t('strongMind.noImprovementsDescription') || 'Track what you\'re working on improving in your workouts. Add improvement notes to see your progress over time.')}
              action={
                <a href="/workouts" className={buttonClasses('accent')}>
                  {isGratitude
                    ? (t('strongMind.addGratitude') || 'Add Gratitude to Workout')
                    : (t('strongMind.addImprovements') || 'Add Improvements to Workout')}
                </a>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {entries.map(workout => gratitudeCard(workout, kind))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {header}
        <p className="mt-1 mb-5 text-sm text-uc-text-muted">
          {t('strongMind.description') || 'Set your climbing goals and track your mental journey'}
        </p>

        <SegmentedControl
          className="mb-5 lg:max-w-xl"
          ariaLabel={t('strongMind.title') || 'Strong Mind'}
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'goals', label: t('strongMind.goals') || 'Goals' },
            { value: 'gratitude', label: t('strongMind.gratitudeAndImprovements') || 'Gratitude & Improvements' },
            { value: 'statistics', label: t('strongMind.statistics') || 'Statistics' },
          ]}
        />

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
            {/* Process goals */}
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-uc-text">{t('strongMind.processGoals') || 'Process Goals'}</h2>
                <Button variant="tonal" onClick={() => { resetProcessForm(); setProcessSheetOpen(true) }}>
                  + {t('common.add') || 'Add'}
                </Button>
              </div>
              <p className="mt-1 text-[13px] text-uc-text-muted">
                {t('strongMind.processGoalsDescription') || 'Goals that support your climbing development'}
              </p>
              {renderProcessGoals(
                longTermGoals,
                t('strongMind.longTermGoals') || 'Long-term Goals',
                t('strongMind.noLongTermGoals') || 'No long-term goals set yet. Add your first goal above!',
              )}
              {renderProcessGoals(
                shortTermGoals,
                t('strongMind.shortTermGoals') || 'Short-term Goals',
                t('strongMind.noShortTermGoals') || 'No short-term goals set yet. Add your first goal above!',
              )}
            </section>

            {/* Project goals */}
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-uc-text">
                  {t('strongMind.projectGoals') || 'Project Goals'} <span className="text-uc-text-muted uc-num">({projectGoals.length})</span>
                </h2>
                <Button variant="tonal" onClick={() => { resetProjectForm(); setProjectSheetOpen(true) }}>
                  + {t('common.add') || 'Add'}
                </Button>
              </div>
              <p className="mt-1 mb-4 text-[13px] text-uc-text-muted">
                {t('strongMind.projectGoalsSubtitle') || 'Specific routes or boulders that support achieving your process goals'}
              </p>
              {projectGoals.length === 0 ? (
                <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
                  {t('strongMind.noProjectGoals') || 'No project goals set yet. Add your first project goal above!'}
                </p>
              ) : (
                <div className="space-y-3">
                  {projectGoals.map(goal => {
                    const linkedGoal = goal.relatedProcessGoal
                      ? processGoals.find(pg => pg.id === goal.relatedProcessGoal)
                      : undefined
                    return (
                      <Card key={goal.id}>
                        <div className="flex items-start gap-3">
                          <span
                            className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-1.5 text-[17px] font-extrabold text-uc-chip-ink uc-num ${
                              workoutBg[goal.climbingType === 'boulder' ? 'BOULDERING' : 'LEAD_ARTIFICIAL']
                            }`}
                          >
                            {goal.routeGrade}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[17px] font-bold leading-6 text-uc-text">{goal.routeName}</p>
                            <p className="text-[13px] font-semibold text-uc-text-muted">
                              {goal.climbingType === 'boulder' ? (t('strongMind.boulder') || 'Boulder') : (t('strongMind.route') || 'Route')}
                              {' · '}
                              {goal.sectorLocation}
                            </p>
                          </div>
                          {editDeleteButtons('project', goal.id)}
                        </div>
                        {goal.relatedProcessGoal && (
                          <p className="mt-2 text-[13px] text-uc-text-muted">
                            {t('strongMind.linkedTo') || 'Linked to'}: {linkedGoal?.goalDescription || t('strongMind.unknownGoal') || 'Unknown goal'}
                          </p>
                        )}
                        <GoalProgressDisplay goalId={goal.id} goalType="project" goalName={`${goal.routeGrade} ${goal.routeName}`} />
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Gratitude & Improvements */}
        {activeTab === 'gratitude' && (
          <div className="space-y-6">
            <p className="text-sm text-uc-text-muted">
              {t('strongMind.gratitudeDescription') || 'Reflect on your recent workouts and what you\'re grateful for'}
            </p>
            <div className="flex flex-wrap gap-2">
              <ChoiceChip selected={gratitudeFilter === 'all'} onClick={() => setGratitudeFilter('all')}>
                {t('common.all') || 'All'}
              </ChoiceChip>
              <ChoiceChip selected={gratitudeFilter === 'gratitude'} onClick={() => setGratitudeFilter('gratitude')}>
                <Icon name="gratitude" size={16} /> {t('strongMind.gratitude') || 'Gratitude'}
              </ChoiceChip>
              <ChoiceChip selected={gratitudeFilter === 'improvements'} onClick={() => setGratitudeFilter('improvements')}>
                <Icon name="improve" size={16} /> {t('stats.improvementsShort') || 'Improvements'}
              </ChoiceChip>
            </div>
            {gratitudeFilter !== 'improvements' && renderGratitudeSection('gratitude')}
            {gratitudeFilter !== 'gratitude' && renderGratitudeSection('improvements')}
          </div>
        )}

        {/* Statistics */}
        {activeTab === 'statistics' && (
          <div className="space-y-4">
            <div className="lg:max-w-sm">
              <Overline as="label" htmlFor="strong-mind-timeframe" className="mb-2 block">
                {t('stats.timeframe') || 'Timeframe'}
              </Overline>
              <Select
                id="strong-mind-timeframe"
                value={statsTimeframe}
                onChange={(e) => setStatsTimeframe(e.target.value as TimeFrame)}
              >
                <option value="1week">{t('stats.1week') || '1 Week'}</option>
                <option value="1month">{t('stats.1month') || '1 Month'}</option>
                <option value="3months">{t('stats.3months') || '3 Months'}</option>
                <option value="6months">{t('stats.6months') || '6 Months'}</option>
                <option value="1year">{t('stats.1year') || '1 Year'}</option>
                <option value="all">{t('stats.allTime') || 'All Time'}</option>
              </Select>
            </div>

            {statsLoading ? (
              <SkeletonRows />
            ) : statsData ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-3 flex items-center gap-2 text-[17px] font-extrabold text-uc-text">
                    <Icon name="type-mental" className="text-uc-workout-mental" />
                    {t('stats.mentalSessions')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat value={statsData.mentalSessions.totalSessions} label={t('stats.totalSessions')} />
                    {statsData.mentalSessions.totalSessions > 0 ? (
                      <>
                        <MiniStat value={statsData.mentalSessions.averageFocusLevel} label={t('stats.avgFocusLevel')} />
                        <MiniStat value={statsData.mentalSessions.daysSinceLastSession} label={t('stats.daysSinceLast')} />
                        <MiniStat value={statsData.mentalSessions.practiceTypes.meditation} label={t('stats.meditation')} />
                      </>
                    ) : (
                      <EmptyNote>{t('strongMind.noMentalSessions') || 'No mental practice sessions in this period'}</EmptyNote>
                    )}
                  </div>
                </Card>

                <Card>
                  <h3 className="mb-3 flex items-center gap-2 text-[17px] font-extrabold text-uc-text">
                    <Icon name="falls" className="text-uc-primary" />
                    {t('stats.fallsTracking')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat value={statsData.falls.totalFalls} label={t('stats.totalFalls')} />
                    <MiniStat value={statsData.falls.totalClimbingSessions} label={t('stats.climbingSessions')} />
                    {statsData.falls.totalFalls > 0 ? (
                      <>
                        <MiniStat value={statsData.falls.fallsPerSession} label={t('stats.fallsPerSession')} />
                        <MiniStat value={statsData.falls.daysSinceLastFall} label={t('stats.daysSinceLastFall')} />
                      </>
                    ) : (
                      <EmptyNote span>{t('strongMind.noFalls') || 'No falls in this period'}</EmptyNote>
                    )}
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Process goal form */}
      <BottomSheet
        isOpen={processSheetOpen}
        onClose={closeProcessSheet}
        dismissible={false}
        closeLabel={t('common.close') || 'Close'}
        title={editingProcessGoalId ? (t('strongMind.editGoal') || 'Edit Goal') : (t('strongMind.addNewGoal') || 'Add New Goal')}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={closeProcessSheet}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              variant="accent"
              size="lg"
              className="flex-[1.4]"
              onClick={handleAddGoal}
              disabled={!goalDescription.trim() || !startDate}
            >
              {editingProcessGoalId ? (t('common.save') || 'Save') : (t('strongMind.addGoal') || 'Add Goal')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="process-goal-description">{t('strongMind.goalDescription') || 'Goal Description'}</Label>
            <Textarea
              id="process-goal-description"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder={t('strongMind.goalPlaceholder') || 'Describe your goal in detail...'}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <div>
              <Label htmlFor="process-goal-duration">{t('strongMind.duration') || 'Duration'}</Label>
              <Select
                id="process-goal-duration"
                value={timeframeValue}
                onChange={(e) => setTimeframeValue(e.target.value)}
                className="uc-num"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num.toString()}>{num}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="process-goal-unit">{t('strongMind.unit') || 'Unit'}</Label>
              <Select id="process-goal-unit" value={timeframeUnit} onChange={(e) => setTimeframeUnit(e.target.value)}>
                <option value="days">{t('strongMind.days') || 'Days'}</option>
                <option value="weeks">{t('strongMind.weeks') || 'Weeks'}</option>
                <option value="months">{t('strongMind.months') || 'Months'}</option>
                <option value="quarters">{t('strongMind.quarters') || 'Quarters'}</option>
                <option value="year">{t('strongMind.year') || 'Year'}</option>
                <option value="years">{t('strongMind.years') || 'Years'}</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="process-goal-start">{t('strongMind.startDate') || 'Start Date'}</Label>
            <Input id="process-goal-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-uc-text-muted">
              {t('strongMind.classifiedAs') || 'Classified as'}
              <Chip
                className={isLongTerm(timeframeValue, timeframeUnit) ? 'bg-uc-primary text-uc-on-primary' : ''}
              >
                {isLongTerm(timeframeValue, timeframeUnit)
                  ? t('strongMind.longTerm') || 'Long-term'
                  : t('strongMind.shortTerm') || 'Short-term'}
              </Chip>
            </p>
            <p className="mt-1.5 text-[12px] text-uc-text-muted">
              {t('strongMind.longTermTooltip') || 'Timeframes ≥3 months, quarters, or years are considered long-term'}
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Project goal form */}
      <BottomSheet
        isOpen={projectSheetOpen}
        onClose={closeProjectSheet}
        dismissible={false}
        closeLabel={t('common.close') || 'Close'}
        title={editingProjectGoalId ? (t('strongMind.editProjectGoal') || 'Edit Project Goal') : (t('strongMind.addNewProjectGoal') || 'Add New Project Goal')}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={closeProjectSheet}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              variant="accent"
              size="lg"
              className="flex-[1.4]"
              onClick={handleAddRouteGoal}
              disabled={!routeGrade || !routeName.trim() || !sectorLocation.trim()}
            >
              {editingProjectGoalId ? (t('common.save') || 'Save') : (t('strongMind.addProjectGoal') || 'Add Project Goal')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>{t('strongMind.climbingType') || 'Climbing Type'}</Label>
            <SegmentedControl
              ariaLabel={t('strongMind.climbingType') || 'Climbing Type'}
              value={climbingType}
              onChange={(value) => {
                setClimbingType(value)
                setRouteGrade('') // Reset grade when type changes
              }}
              options={[
                { value: 'route', label: t('strongMind.route') || 'Route' },
                { value: 'boulder', label: t('strongMind.boulder') || 'Boulder' },
              ]}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
            <div>
              <Label htmlFor="project-goal-system">{t('strongMind.gradeSystem') || 'Grade System'}</Label>
              <Select
                id="project-goal-system"
                value={gradeSystem}
                onChange={(e) => {
                  setGradeSystem(e.target.value)
                  setRouteGrade('') // Reset grade when system changes
                }}
              >
                {getAvailableGradeSystems(climbingType).map(system => (
                  <option key={system.value} value={system.value}>{system.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="project-goal-grade">{t('strongMind.grade') || 'Grade'}</Label>
              <Select id="project-goal-grade" value={routeGrade} onChange={(e) => setRouteGrade(e.target.value)} className="uc-num">
                <option value="">{t('strongMind.selectGrade') || 'Select grade...'}</option>
                {getGradeOptions(gradeSystem, climbingType).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="project-goal-name">
              {climbingType === 'boulder' ? (t('strongMind.boulderName') || 'Boulder Name') : (t('strongMind.routeName') || 'Route Name')}
            </Label>
            <Input
              id="project-goal-name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder={climbingType === 'boulder'
                ? (t('strongMind.boulderNamePlaceholder') || 'Enter boulder name (e.g., "The Mandala", "Dreamtime")...')
                : (t('strongMind.routeNamePlaceholder') || 'Enter route name (e.g., "La Dura Dura", "Action Directe")...')}
            />
          </div>
          <div>
            <Label htmlFor="project-goal-sector">{t('strongMind.sectorLocation') || 'Sector/Location'}</Label>
            <Input
              id="project-goal-sector"
              value={sectorLocation}
              onChange={(e) => setSectorLocation(e.target.value)}
              placeholder={t('strongMind.sectorLocationPlaceholder') || 'Enter sector and location (e.g., "Ceuse, France", "Stanage, UK")...'}
            />
          </div>
          <div>
            <Label htmlFor="project-goal-related">{t('strongMind.relatedProcessGoal') || 'Related Process Goal (Optional)'}</Label>
            <Select id="project-goal-related" value={relatedProcessGoal} onChange={(e) => setRelatedProcessGoal(e.target.value)}>
              <option value="">{t('strongMind.noRelation') || 'No relation to process goal'}</option>
              {processGoals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}: {goal.goalDescription}
                </option>
              ))}
              {processGoals.length === 0 && (
                <option disabled>{t('strongMind.noProcessGoalsToLink') || 'No process goals created yet'}</option>
              )}
            </Select>
          </div>
        </div>
      </BottomSheet>

      <ConfirmationDialog
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
        title={t('strongMind.deleteGoalTitle') || 'Delete goal?'}
        message={t('strongMind.deleteGoalConfirm') || 'Are you sure you want to delete this goal?'}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        variant="danger"
      />
    </div>
  )
}

const MiniStat = ({ value, label }: { value: number | string; label: string }) => (
  <div className="rounded-xl bg-uc-elevated p-3">
    <p className="text-[22px] font-extrabold leading-7 text-uc-text uc-num">{value}</p>
    <p className="text-[13px] font-semibold text-uc-text-muted">{label}</p>
  </div>
)

const EmptyNote = ({ children, span = false }: { children: ReactNode; span?: boolean }) => (
  <p
    className={`flex items-center justify-center rounded-xl border border-dashed border-uc-border p-3 text-center text-[13px] text-uc-text-muted ${
      span ? 'col-span-2' : ''
    }`}
  >
    {children}
  </p>
)
