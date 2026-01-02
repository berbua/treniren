'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useLanguage } from '@/contexts/LanguageContext'
import { GoalProgressDisplay } from '@/components/GoalProgressDisplay'
import { statisticsService, StatisticsData, TimeFrame } from '@/lib/statistics-service'
import { Workout } from '@/types/workout'

export default function StrongMindPage() {
  return (
    <AuthGuard>
      <StrongMindPageContent />
    </AuthGuard>
  )
}

function StrongMindPageContent() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'goals' | 'gratitude' | 'statistics'>('goals')
  const [goalsSubTab, setGoalsSubTab] = useState<'process' | 'project'>('process')
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
  const [timeframeUnit, setTimeframeUnit] = useState<string>('week')
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
        const response = await fetch('/api/workouts', { credentials: 'include' })
        if (response.ok) {
          const workouts = await response.json()
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
        const response = await fetch('/api/workouts', { credentials: 'include' })
        if (response.ok) {
          const workoutsData = await response.json()
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
    
    // Reset form
    setTimeframeValue('1')
    setTimeframeUnit('week')
    setStartDate('')
    setGoalDescription('')
  }

  const handleEditProcessGoal = (goalId: string) => {
    const goal = processGoals.find(g => g.id === goalId)
    if (goal) {
      setTimeframeValue(goal.timeframeValue)
      setTimeframeUnit(goal.timeframeUnit)
      setStartDate(goal.startDate)
      setGoalDescription(goal.goalDescription)
      setEditingProcessGoalId(goalId)
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDeleteProcessGoal = (goalId: string) => {
    if (confirm(t('strongMind.deleteGoalConfirm') || 'Are you sure you want to delete this goal?')) {
      const updatedGoals = processGoals.filter(g => g.id !== goalId)
      setProcessGoals(updatedGoals)
      localStorage.setItem('processGoals', JSON.stringify(updatedGoals))
      if (editingProcessGoalId === goalId) {
        setEditingProcessGoalId(null)
        // Reset form
        setTimeframeValue('1')
        setTimeframeUnit('week')
        setStartDate('')
        setGoalDescription('')
      }
    }
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
    
    // Reset form
    setClimbingType('route')
    setRouteGrade('')
    setGradeSystem('french')
    setRouteName('')
    setSectorLocation('')
    setRelatedProcessGoal('')
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
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDeleteProjectGoal = (goalId: string) => {
    if (confirm(t('strongMind.deleteGoalConfirm') || 'Are you sure you want to delete this goal?')) {
      const updatedGoals = projectGoals.filter(g => g.id !== goalId)
      setProjectGoals(updatedGoals)
      localStorage.setItem('projectGoals', JSON.stringify(updatedGoals))
      if (editingProjectGoalId === goalId) {
        setEditingProjectGoalId(null)
        // Reset form
        setClimbingType('route')
        setRouteGrade('')
        setGradeSystem('french')
        setRouteName('')
        setSectorLocation('')
        setRelatedProcessGoal('')
      }
    }
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

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-uc-black">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-uc-text-light">
              🧠 {t('strongMind.title') || 'Strong Mind'}
            </h1>
            <p className="text-uc-text-muted mt-2">
              {t('strongMind.description') || 'Set your climbing goals and track your mental journey'}
            </p>
          </div>
          <div className="text-center py-12">
            <div className="text-uc-text-muted">
              {t('common.loading') || 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-uc-text-light">
            🧠 {t('strongMind.title') || 'Strong Mind'}
          </h1>
          <p className="text-uc-text-muted mt-2">
            {t('strongMind.description') || 'Set your climbing goals and track your mental journey'}
          </p>
        </div>

        {/* Main Navigation */}
        <div className="flex space-x-1 mb-8 bg-uc-dark-bg rounded-xl p-1 border border-uc-purple/20">
          <button 
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'goals'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            🎯 {t('strongMind.goals') || 'Goals'}
          </button>
          <button 
            onClick={() => setActiveTab('gratitude')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'gratitude'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            🙏 {t('strongMind.gratitude') || 'Gratitude'} & {t('strongMind.improvements') || 'Improvements'}
          </button>
          <button 
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'statistics'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            📊 {t('strongMind.statistics') || 'Statistics'}
          </button>
        </div>

        {/* Goals Content */}
        {activeTab === 'goals' && (
          <div>
            {/* Goals Sub-navigation */}
            <div className="flex space-x-1 mb-6 bg-uc-black/50 rounded-xl p-1 border border-uc-purple/20">
              <button 
                onClick={() => setGoalsSubTab('process')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  goalsSubTab === 'process'
                    ? 'bg-uc-purple text-uc-text-light shadow-lg'
                    : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black'
                }`}
              >
                🎯 {t('strongMind.processGoals') || 'Process Goals'}
              </button>
              <button 
                onClick={() => setGoalsSubTab('project')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  goalsSubTab === 'project'
                    ? 'bg-uc-purple text-uc-text-light shadow-lg'
                    : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black'
                }`}
              >
                🏔️ {t('strongMind.projectGoals') || 'Project Goals'}
              </button>
            </div>

            {/* Process Goals Content */}
            {goalsSubTab === 'process' && (
        <div className="bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
          <h2 className="text-xl font-semibold text-uc-text-light mb-2">
            🎯 {t('strongMind.processGoals') || 'Process Goals'}
          </h2>
          <p className="text-sm text-uc-text-muted mb-6">
            {t('strongMind.processGoalsDescription') || 'Goals that support your climbing development'}
          </p>
          
          {/* Goal Creation Form */}
          <div className="bg-uc-black/50 p-6 rounded-xl border border-uc-purple/20 mb-6">
            <h3 className="text-lg font-medium text-uc-text-light mb-4">
              {editingProcessGoalId ? '✏️ ' + (t('strongMind.editGoal') || 'Edit Goal') : '➕ ' + (t('strongMind.addNewGoal') || 'Add New Goal')}
            </h3>
            
            <div className="space-y-4">
              {/* Timeframe Selection */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📅 {t('strongMind.selectTimeframe') || 'Select Timeframe'}
                  <span className="ml-2 text-xs text-uc-text-muted">
                    ({t('strongMind.longTermTooltip') || 'Timeframes ≥3 months, quarters, or years are considered long-term'})
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Timeframe Value */}
                  <div>
                    <label className="block text-xs font-medium text-uc-text-muted mb-1">
                      {t('strongMind.duration') || 'Duration'}
                    </label>
                    <select
                      value={timeframeValue}
                      onChange={(e) => setTimeframeValue(e.target.value)}
                      className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num.toString()}>{num}</option>
                      ))}
                    </select>
                  </div>

                  {/* Timeframe Unit */}
                  <div>
                    <label className="block text-xs font-medium text-uc-text-muted mb-1">
                      {t('strongMind.unit') || 'Unit'}
                    </label>
                    <select
                      value={timeframeUnit}
                      onChange={(e) => setTimeframeUnit(e.target.value)}
                      className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                    >
                      <option value="days">{t('strongMind.days') || 'Days'}</option>
                      <option value="weeks">{t('strongMind.weeks') || 'Weeks'}</option>
                      <option value="months">{t('strongMind.months') || 'Months'}</option>
                      <option value="quarters">{t('strongMind.quarters') || 'Quarters'}</option>
                      <option value="year">{t('strongMind.year') || 'Year'}</option>
                      <option value="years">{t('strongMind.years') || 'Years'}</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-uc-text-muted mb-1">
                      {t('strongMind.startDate') || 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                    />
                  </div>
                </div>

                {/* Timeframe Preview */}
                {timeframeValue && timeframeUnit && (
                  <div className="mt-3 p-3 rounded-xl border border-uc-purple/20 bg-uc-black/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-uc-text-light">
                          {t('strongMind.timeframePreview') || 'Timeframe'}: {timeframeValue} {timeframeUnit}
                        </span>
                        {startDate && (
                          <span className="text-xs text-uc-text-muted">
                            ({t('strongMind.startingFrom') || 'starting from'} {new Date(startDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isLongTerm(timeframeValue, timeframeUnit)
                          ? 'bg-uc-purple/20 text-uc-purple border border-uc-purple/30'
                          : 'bg-uc-mustard/20 text-uc-mustard border border-uc-mustard/30'
                      }`}>
                        {isLongTerm(timeframeValue, timeframeUnit) 
                          ? t('strongMind.longTerm') || 'Long-term'
                          : t('strongMind.shortTerm') || 'Short-term'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Goal Description */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🎯 {t('strongMind.goalDescription') || 'Goal Description'}
                </label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder={t('strongMind.goalPlaceholder') || 'Describe your goal in detail...'}
                  rows={4}
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none resize-none"
                />
              </div>

              {/* Add/Update Goal Button */}
              <div className="flex justify-end gap-2">
                {editingProcessGoalId && (
                  <button 
                    onClick={() => {
                      setEditingProcessGoalId(null)
                      setTimeframeValue('1')
                      setTimeframeUnit('week')
                      setStartDate('')
                      setGoalDescription('')
                    }}
                    className="bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-6 py-2 rounded-xl font-medium transition-colors border border-uc-purple/20"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                )}
                <button 
                  onClick={handleAddGoal}
                  disabled={!goalDescription.trim() || !startDate}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 disabled:bg-uc-text-muted disabled:cursor-not-allowed text-uc-black px-6 py-2 rounded-xl font-medium transition-colors shadow-lg"
                >
                  {editingProcessGoalId ? '💾 ' + (t('common.save') || 'Save') : '➕ ' + (t('strongMind.addGoal') || 'Add Goal')}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Goals Display */}
          <div>
            <h3 className="text-lg font-medium text-uc-text-light mb-4">
              📋 {t('strongMind.existingGoals') || 'Existing Goals'}
            </h3>
            
            {/* Long-term Goals Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-uc-text-light mb-3 flex items-center">
                <span className="text-lg mr-2">📅</span>
                {t('strongMind.longTermGoals') || 'Long-term Goals'}
                <span className="text-sm text-uc-text-muted ml-2">({longTermGoals.length})</span>
              </h4>
              {longTermGoals.length === 0 ? (
                <div className="bg-uc-black/30 p-4 rounded-xl border border-uc-purple/10">
                  <p className="text-uc-text-muted text-sm text-center">
                    {t('strongMind.noLongTermGoals') || 'No long-term goals set yet. Add your first goal above!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {longTermGoals.map(goal => (
                    <div key={goal.id} className="bg-uc-dark-bg p-4 rounded-xl border border-uc-purple/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-uc-text-light">
                            {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}
                          </span>
                          {goal.startDate && (
                            <span className="text-xs text-uc-text-muted">
                              {t('strongMind.startingFrom') || 'starting from'} {new Date(goal.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditProcessGoal(goal.id)}
                            className="text-uc-text-muted hover:text-uc-purple text-sm"
                            title={t('common.edit') || 'Edit'}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteProcessGoal(goal.id)}
                            className="text-uc-text-muted hover:text-uc-alert text-sm"
                            title={t('common.delete') || 'Delete'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-uc-text-light text-sm">{goal.goalDescription}</p>
                      <GoalProgressDisplay 
                        goalId={goal.id} 
                        goalType="process" 
                        goalName={goal.goalDescription} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Short-term Goals Section */}
            <div>
              <h4 className="text-md font-medium text-uc-text-light mb-3 flex items-center">
                <span className="text-lg mr-2">⚡</span>
                {t('strongMind.shortTermGoals') || 'Short-term Goals'}
                <span className="text-sm text-uc-text-muted ml-2">({shortTermGoals.length})</span>
              </h4>
              {shortTermGoals.length === 0 ? (
                <div className="bg-uc-black/30 p-4 rounded-xl border border-uc-purple/10">
                  <p className="text-uc-text-muted text-sm text-center">
                    {t('strongMind.noShortTermGoals') || 'No short-term goals set yet. Add your first goal above!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shortTermGoals.map(goal => (
                    <div key={goal.id} className="bg-uc-dark-bg p-4 rounded-xl border border-uc-purple/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-uc-text-light">
                            {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}
                          </span>
                          {goal.startDate && (
                            <span className="text-xs text-uc-text-muted">
                              {t('strongMind.startingFrom') || 'starting from'} {new Date(goal.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditProcessGoal(goal.id)}
                            className="text-uc-text-muted hover:text-uc-purple text-sm"
                            title={t('common.edit') || 'Edit'}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteProcessGoal(goal.id)}
                            className="text-uc-text-muted hover:text-uc-alert text-sm"
                            title={t('common.delete') || 'Delete'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-uc-text-light text-sm">{goal.goalDescription}</p>
                      <GoalProgressDisplay 
                        goalId={goal.id} 
                        goalType="process" 
                        goalName={goal.goalDescription} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
            )}
          </div>
        )}

        {/* Gratitude & Improvements Content */}
        {activeTab === 'gratitude' && (
          <div className="bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-uc-text-light mb-2">
                  🙏 {t('strongMind.gratitude') || 'Gratitude'} & {t('strongMind.improvements') || 'Improvements'}
                </h2>
                <p className="text-uc-text-muted">
                  {t('strongMind.gratitudeDescription') || 'Reflect on your recent workouts and what you\'re grateful for'}
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setGratitudeFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gratitudeFilter === 'all'
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setGratitudeFilter('gratitude')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gratitudeFilter === 'gratitude'
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black'
                }`}
              >
                ✨ Gratitude
              </button>
              <button
                onClick={() => setGratitudeFilter('improvements')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gratitudeFilter === 'improvements'
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black'
                }`}
              >
                📈 Improvements
              </button>
            </div>

            {/* Gratitude Tiles */}
            {(gratitudeFilter === 'all' || gratitudeFilter === 'gratitude') && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-uc-text-light mb-4 flex items-center">
                  <span className="mr-2">✨</span>
                  {t('strongMind.gratefulFor') || '3 things I am grateful for'}
                </h3>
                {gratitudeWorkouts.filter(w => w.gratitude).length === 0 ? (
                  <div className="bg-uc-black/30 p-6 rounded-xl border border-uc-purple/10 text-center">
                    <p className="text-uc-text-muted text-sm">
                      No gratitude entries yet. Add gratitude to your workouts to see them here!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gratitudeWorkouts
                      .filter(w => w.gratitude)
                      .map((workout) => (
                        <div key={`gratitude-${workout.id}`} className="bg-uc-black/50 p-6 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-uc-text-light">
                                {new Date(workout.startTime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <p className="text-sm text-uc-text-muted">
                                  {workout.type}
                                </p>
                                {workout.sector && (
                                  <>
                                    <span className="text-uc-text-muted">•</span>
                                    <p className="text-sm text-uc-text-muted">
                                      📍 {workout.sector}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <p className="text-uc-text-light text-sm whitespace-pre-wrap">
                              {workout.gratitude}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Improvements Tiles */}
            {(gratitudeFilter === 'all' || gratitudeFilter === 'improvements') && (
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4 flex items-center">
                  <span className="mr-2">📈</span>
                  {t('strongMind.improvements') || '3 things to do better next time'}
                </h3>
                {gratitudeWorkouts.filter(w => w.improvements).length === 0 ? (
                  <div className="bg-uc-black/30 p-6 rounded-xl border border-uc-purple/10 text-center">
                    <p className="text-uc-text-muted text-sm">
                      No improvement entries yet. Add improvements to your workouts to see them here!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gratitudeWorkouts
                      .filter(w => w.improvements)
                      .map((workout) => (
                        <div key={`improvements-${workout.id}`} className="bg-uc-black/50 p-6 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-uc-text-light">
                                {new Date(workout.startTime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <p className="text-sm text-uc-text-muted">
                                  {workout.type}
                                </p>
                                {workout.sector && (
                                  <>
                                    <span className="text-uc-text-muted">•</span>
                                    <p className="text-sm text-uc-text-muted">
                                      📍 {workout.sector}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                            <p className="text-uc-text-light text-sm whitespace-pre-wrap">
                              {workout.improvements}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

            {/* Project Goals Content */}
            {goalsSubTab === 'project' && (
        <div className="bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
          <h2 className="text-xl font-semibold text-uc-text-light mb-2">
            🏔️ {t('strongMind.projectGoals') || 'Project Goals'}
          </h2>
          <p className="text-sm text-uc-text-muted mb-6">
            {t('strongMind.projectGoalsSubtitle') || 'Specific routes or boulders that support achieving your process goals'}
          </p>
          
          {/* Project Goal Creation Form */}
          <div className="bg-uc-black/50 p-6 rounded-xl border border-uc-purple/20 mb-6">
            <h3 className="text-lg font-medium text-uc-text-light mb-4">
              {editingProjectGoalId ? '✏️ ' + (t('strongMind.editProjectGoal') || 'Edit Project Goal') : '➕ ' + (t('strongMind.addNewProjectGoal') || 'Add New Project Goal')}
            </h3>
            
            <div className="space-y-4">
              {/* Climbing Type Selection */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🧗 {t('strongMind.climbingType') || 'Climbing Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClimbingType('route')
                      setRouteGrade('') // Reset grade when type changes
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      climbingType === 'route'
                        ? 'border-uc-purple bg-uc-purple/20'
                        : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                    }`}
                  >
                    <div className="text-lg mb-1">🧗‍♀️</div>
                    <div className="text-sm font-medium text-uc-text-light">
                      {t('strongMind.route') || 'Route'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClimbingType('boulder')
                      setRouteGrade('') // Reset grade when type changes
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      climbingType === 'boulder'
                        ? 'border-uc-purple bg-uc-purple/20'
                        : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                    }`}
                  >
                    <div className="text-lg mb-1">🧗</div>
                    <div className="text-sm font-medium text-uc-text-light">
                      {t('strongMind.boulder') || 'Boulder'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Grade System and Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🏆 {t('strongMind.gradeSystem') || 'Grade System'}
                  </label>
                  <select
                    value={gradeSystem}
                    onChange={(e) => {
                      setGradeSystem(e.target.value)
                      setRouteGrade('') // Reset grade when system changes
                    }}
                    className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                  >
                    {getAvailableGradeSystems(climbingType).map(system => (
                      <option key={system.value} value={system.value}>
                        {system.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    📊 {t('strongMind.grade') || 'Grade'}
                  </label>
                  <select
                    value={routeGrade}
                    onChange={(e) => setRouteGrade(e.target.value)}
                    className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                  >
                    <option value="">{t('strongMind.selectGrade') || 'Select grade...'}</option>
                    {getGradeOptions(gradeSystem, climbingType).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Route/Boulder Name */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🧗 {climbingType === 'boulder' ? (t('strongMind.boulderName') || 'Boulder Name') : (t('strongMind.routeName') || 'Route Name')}
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder={climbingType === 'boulder' 
                    ? (t('strongMind.boulderNamePlaceholder') || 'Enter boulder name (e.g., "The Mandala", "Dreamtime")...')
                    : (t('strongMind.routeNamePlaceholder') || 'Enter route name (e.g., "La Dura Dura", "Action Directe")...')
                  }
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>

              {/* Sector Location */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📍 {t('strongMind.sectorLocation') || 'Sector/Location'}
                </label>
                <input
                  type="text"
                  value={sectorLocation}
                  onChange={(e) => setSectorLocation(e.target.value)}
                  placeholder={t('strongMind.sectorLocationPlaceholder') || 'Enter sector and location (e.g., "Ceuse, France", "Stanage, UK")...'}
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>

              {/* Related Process Goal */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🔗 {t('strongMind.relatedProcessGoal') || 'Related Process Goal (Optional)'}
                </label>
                <select
                  value={relatedProcessGoal}
                  onChange={(e) => setRelatedProcessGoal(e.target.value)}
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                >
                  <option value="">{t('strongMind.noRelation') || 'No relation to process goal'}</option>
                  {processGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}: {goal.goalDescription}
                    </option>
                  ))}
                  {processGoals.length === 0 && (
                    <option disabled>
                      {t('strongMind.noProcessGoalsToLink') || 'No process goals created yet'}
                    </option>
                  )}
                </select>
              </div>

              {/* Add/Update Route Goal Button */}
              <div className="flex justify-end gap-2">
                {editingProjectGoalId && (
                  <button 
                    onClick={() => {
                      setEditingProjectGoalId(null)
                      setClimbingType('route')
                      setRouteGrade('')
                      setGradeSystem('french')
                      setRouteName('')
                      setSectorLocation('')
                      setRelatedProcessGoal('')
                    }}
                    className="bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-6 py-2 rounded-xl font-medium transition-colors border border-uc-purple/20"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                )}
                <button 
                  onClick={handleAddRouteGoal}
                  disabled={!routeGrade || !routeName.trim() || !sectorLocation.trim()}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 disabled:bg-uc-text-muted disabled:cursor-not-allowed text-uc-black px-6 py-2 rounded-xl font-medium transition-colors shadow-lg"
                >
                  {editingProjectGoalId ? '💾 ' + (t('common.save') || 'Save') : '➕ ' + (t('strongMind.addProjectGoal') || 'Add Project Goal')}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Project Goals Display */}
          <div>
            <h3 className="text-lg font-medium text-uc-text-light mb-4">
              📋 {t('strongMind.existingProjectGoals') || 'Existing Project Goals'}
              <span className="text-sm text-uc-text-muted ml-2">({projectGoals.length})</span>
            </h3>
            {projectGoals.length === 0 ? (
              <div className="bg-uc-black/30 p-4 rounded-xl border border-uc-purple/10">
                <p className="text-uc-text-muted text-sm text-center">
                  {t('strongMind.noProjectGoals') || 'No project goals set yet. Add your first project goal above!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectGoals.map(goal => (
                  <div key={goal.id} className="bg-uc-dark-bg p-4 rounded-xl border border-uc-purple/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {goal.climbingType === 'boulder' ? '🧗' : '🧗‍♀️'}
                        </span>
                        <span className="text-sm font-medium text-uc-text-light">
                          {goal.routeGrade} {goal.gradeSystem.toUpperCase()}
                        </span>
                        <span className="text-xs text-uc-text-muted">
                          {goal.climbingType === 'boulder' ? 'Boulder' : 'Route'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditProjectGoal(goal.id)}
                          className="text-uc-text-muted hover:text-uc-purple text-sm"
                          title={t('common.edit') || 'Edit'}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteProjectGoal(goal.id)}
                          className="text-uc-text-muted hover:text-uc-alert text-sm"
                          title={t('common.delete') || 'Delete'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-uc-text-light text-sm font-medium">{goal.routeName}</p>
                      <p className="text-uc-text-muted text-xs">{goal.sectorLocation}</p>
                    </div>
                    {goal.relatedProcessGoal && (
                      <div className="text-xs text-uc-text-muted">
                        🔗 Linked to: {processGoals.find(pg => pg.id === goal.relatedProcessGoal)?.goalDescription || 'Unknown goal'}
                      </div>
                    )}
                    <GoalProgressDisplay 
                      goalId={goal.id} 
                      goalType="project" 
                      goalName={`${goal.routeGrade} ${goal.routeName}`} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
            )}

        {/* Statistics Content */}
        {activeTab === 'statistics' && (
          <div className="bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-uc-text-light mb-4">
                📊 {t('strongMind.statistics') || 'Statistics'}
              </h2>
              
              {/* Timeframe selector */}
              <select
                value={statsTimeframe}
                onChange={(e) => setStatsTimeframe(e.target.value as TimeFrame)}
                className="px-4 py-2 bg-uc-black/50 border border-uc-purple/20 rounded-lg text-sm text-uc-text-light focus:outline-none focus:ring-2 focus:ring-uc-purple/50"
              >
                <option value="1week">{t('stats.1week') || '1 Week'}</option>
                <option value="1month">{t('stats.1month') || '1 Month'}</option>
                <option value="3months">{t('stats.3months') || '3 Months'}</option>
                <option value="6months">{t('stats.6months') || '6 Months'}</option>
                <option value="1year">{t('stats.1year') || '1 Year'}</option>
                <option value="all">{t('stats.allTime') || 'All Time'}</option>
              </select>
            </div>

            {statsLoading ? (
              <div className="text-center py-12">
                <div className="text-uc-text-muted">{t('common.loading') || 'Loading...'}</div>
              </div>
            ) : statsData ? (
              <div className="space-y-6">
                {/* Mental Sessions */}
                <div>
                  <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                    🧘 {t('stats.mentalSessions')}
                  </h3>
                  <div className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.mentalSessions.totalSessions}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.totalSessions')}
                        </div>
                      </div>
                      {statsData.mentalSessions.totalSessions > 0 && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-uc-text-light">
                              {statsData.mentalSessions.averageFocusLevel}
                            </div>
                            <div className="text-sm text-uc-text-muted">
                              {t('stats.avgFocusLevel')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-uc-text-light">
                              {statsData.mentalSessions.daysSinceLastSession}
                            </div>
                            <div className="text-sm text-uc-text-muted">
                              {t('stats.daysSinceLast')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-uc-text-light">
                              {statsData.mentalSessions.practiceTypes.meditation}
                            </div>
                            <div className="text-sm text-uc-text-muted">
                              {t('stats.meditation')}
                            </div>
                          </div>
                        </>
                      )}
                      {statsData.mentalSessions.totalSessions === 0 && (
                        <div className="col-span-3 flex items-center justify-center">
                          <p className="text-uc-text-muted text-sm">
                            {t('strongMind.noMentalSessions') || 'No mental practice sessions in this period'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Falls Tracking */}
                <div>
                  <h3 className="text-lg font-semibold text-uc-text-light mb-4">
                    🧗‍♀️ {t('stats.fallsTracking')}
                  </h3>
                  <div className="bg-uc-black/50 p-4 rounded-xl border border-uc-purple/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.falls.totalFalls}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.totalFalls')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-uc-text-light">
                          {statsData.falls.totalClimbingSessions}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {t('stats.climbingSessions')}
                        </div>
                      </div>
                      {statsData.falls.totalFalls > 0 && (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-uc-text-light">
                              {statsData.falls.fallsPerSession}
                            </div>
                            <div className="text-sm text-uc-text-muted">
                              {t('stats.fallsPerSession')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-uc-text-light">
                              {statsData.falls.daysSinceLastFall}
                            </div>
                            <div className="text-sm text-uc-text-muted">
                              {t('stats.daysSinceLastFall')}
                            </div>
                          </div>
                        </>
                      )}
                      {statsData.falls.totalFalls === 0 && (
                        <div className="col-span-2 flex items-center justify-center">
                          <p className="text-uc-text-muted text-sm">
                            {t('strongMind.noFalls') || 'No falls in this period'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
