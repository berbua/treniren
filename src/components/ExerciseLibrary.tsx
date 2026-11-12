'use client'

import { useState, useEffect } from 'react'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Button, Card, Chip, ChoiceChip, EmptyState, Input, Spinner } from '@/components/ui'

interface ExerciseQuickStats {
  lastUsed: string | null
  lastWeight: number | null
  lastReps: number | null
  timesUsed: number
}

interface ExerciseLibraryProps {
  exercises: Exercise[]
  onEdit: (exercise: Exercise) => void
  onDelete: (id: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
  onQuickAdd: (data: { name: string; category?: string; defaultUnit: string }) => void
  deletingExerciseId?: string | null
  onCreateExercise?: () => void
}

// Common exercises for quick-add
const commonExercises = [
  // Upper Body / Pull
  { name: 'Pull-ups', category: 'Pull', defaultUnit: 'reps', group: 'pull' },
  { name: 'Chin-ups', category: 'Pull', defaultUnit: 'reps', group: 'pull' },
  { name: 'Weighted Pull-ups', category: 'Pull', defaultUnit: 'kg', group: 'pull' },
  { name: 'Lat Pulldown', category: 'Pull', defaultUnit: 'kg', group: 'pull' },
  { name: 'Barbell Row', category: 'Back', defaultUnit: 'kg', group: 'pull' },
  { name: 'Dumbbell Row', category: 'Back', defaultUnit: 'kg', group: 'pull' },
  { name: 'Face Pulls', category: 'Back', defaultUnit: 'kg', group: 'pull' },
  
  // Upper Body / Push
  { name: 'Push-ups', category: 'Push', defaultUnit: 'reps', group: 'push' },
  { name: 'Bench Press', category: 'Chest', defaultUnit: 'kg', group: 'push' },
  { name: 'Overhead Press', category: 'Shoulders', defaultUnit: 'kg', group: 'push' },
  { name: 'Dips', category: 'Push', defaultUnit: 'reps', group: 'push' },
  { name: 'Dumbbell Press', category: 'Chest', defaultUnit: 'kg', group: 'push' },
  
  // Lower Body
  { name: 'Squats', category: 'Legs', defaultUnit: 'kg', group: 'lower' },
  { name: 'Deadlift', category: 'Lower Body', defaultUnit: 'kg', group: 'lower' },
  { name: 'Romanian Deadlift', category: 'Lower Body', defaultUnit: 'kg', group: 'lower' },
  { name: 'Lunges', category: 'Legs', defaultUnit: 'reps', group: 'lower' },
  { name: 'Leg Press', category: 'Legs', defaultUnit: 'kg', group: 'lower' },
  
  // Core
  { name: 'Plank', category: 'Core', defaultUnit: 'time', group: 'core' },
  { name: 'Hanging Leg Raises', category: 'Core', defaultUnit: 'reps', group: 'core' },
  { name: 'Russian Twists', category: 'Core', defaultUnit: 'reps', group: 'core' },
  { name: 'Dead Bug', category: 'Core', defaultUnit: 'reps', group: 'core' },
  
  // Climbing Specific
  { name: 'Fingerboard Hangs', category: 'Climbing Specific', defaultUnit: 'time', group: 'climbing' },
  { name: 'Campus Board', category: 'Climbing Specific', defaultUnit: 'reps', group: 'climbing' },
  { name: 'Hangboard Repeaters', category: 'Climbing Specific', defaultUnit: 'reps', group: 'climbing' },
  { name: 'Crimp Training', category: 'Climbing Specific', defaultUnit: 'time', group: 'climbing' },
  { name: 'Pinch Training', category: 'Climbing Specific', defaultUnit: 'time', group: 'climbing' },
  { name: 'Sloper Training', category: 'Climbing Specific', defaultUnit: 'time', group: 'climbing' },
]

const quickAddGroups = ['pull', 'push', 'lower', 'core', 'climbing']

export function ExerciseLibrary({
  exercises,
  onEdit,
  onDelete,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onQuickAdd,
  deletingExerciseId = null,
  onCreateExercise,
}: ExerciseLibraryProps) {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [quickStats, setQuickStats] = useState<Record<string, ExerciseQuickStats>>({})
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set())

  // Fetch quick stats for all exercises
  useEffect(() => {
    exercises.forEach(exercise => {
      if (!quickStats[exercise.id]) {
        fetchQuickStats(exercise.id)
      }
    })
  }, [exercises])

  const fetchQuickStats = async (exerciseId: string) => {
    try {
      setLoadingStats(prev => new Set(prev).add(exerciseId))
      const response = await fetch(`/api/exercises/${exerciseId}/quick-stats`)
      if (response.ok) {
        const stats = await response.json()
        setQuickStats(prev => ({ ...prev, [exerciseId]: stats }))
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    } finally {
      setLoadingStats(prev => {
        const next = new Set(prev)
        next.delete(exerciseId)
        return next
      })
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  const availableCommonExercises = commonExercises.filter(
    ex => !exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase())
  )
  const isFiltered = !!searchQuery || selectedCategory !== 'all'

  const viewToggle = (mode: 'grid' | 'list', icon: string, label: string) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 items-center justify-center rounded-[10px] transition-colors ${
        viewMode === mode ? 'bg-uc-primary text-uc-on-primary' : 'text-uc-text hover:bg-uc-elevated'
      }`}
    >
      <span aria-hidden>{icon}</span>
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Search and view mode */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={t('common.search') || 'Search'}
          placeholder={t('workouts.placeholders.searchExercises') || '🔍 Search exercises...'}
          className="flex-1 min-h-12"
        />
        <div className="flex shrink-0 gap-0.5 p-0.5 bg-uc-surface border border-uc-border rounded-uc-input">
          {viewToggle('grid', '⏹️', t('exercises.gridView') || 'Grid view')}
          {viewToggle('list', '☰', t('exercises.listView') || 'List view')}
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div
          role="group"
          aria-label={t('exercises.categories') || 'Categories'}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {categories.map(cat => (
            <ChoiceChip
              key={cat}
              selected={selectedCategory === cat}
              onClick={() => onCategoryChange(cat)}
              className="shrink-0 rounded-uc-pill"
            >
              {cat === 'all' ? (t('common.all') || 'All') : cat}
            </ChoiceChip>
          ))}
        </div>
      )}

      {/* Quick Add Panel */}
      <div className="rounded-uc-card bg-uc-primary-container text-uc-on-primary-container">
        <button
          type="button"
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          aria-expanded={showQuickAdd}
          className="flex w-full min-h-14 items-center gap-2 px-4 text-left font-extrabold"
        >
          <span aria-hidden>⚡</span>
          <span className="flex-1">
            {t('exercises.quickAdd') || 'Quick add'}
            {availableCommonExercises.length > 0 && (
              <> · {t('exercises.quickAddCount', { count: availableCommonExercises.length }) || `${availableCommonExercises.length} common exercises`}</>
            )}
          </span>
          <svg
            aria-hidden
            className={`size-5 shrink-0 transition-transform ${showQuickAdd ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {showQuickAdd && (
          <div className="space-y-4 px-4 pb-4">
            {quickAddGroups.map(group => {
              const groupExercises = availableCommonExercises.filter(ex => ex.group === group)
              if (groupExercises.length === 0) return null
              return (
                <div key={group}>
                  <p className="mb-2 text-[11px] leading-[14px] font-bold uppercase tracking-[0.08em] opacity-80">
                    {t(`exercises.quickAddGroups.${group}`)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groupExercises.map(({ name, category, defaultUnit }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          onQuickAdd({ name, category, defaultUnit })
                          setShowQuickAdd(false)
                        }}
                        className="min-h-11 rounded-uc-input bg-uc-bg px-3 text-sm font-bold text-uc-text transition-colors hover:bg-uc-elevated"
                      >
                        + {name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {availableCommonExercises.length === 0 && (
              <p className="py-2 text-center text-sm">{t('workouts.labels.allCommonExercisesAdded') || 'All common exercises have been added!'}</p>
            )}
          </div>
        )}
      </div>

      {/* Exercise Count */}
      <p className="text-[13px] font-semibold text-uc-text-muted">
        {exercises.length} {exercises.length === 1 ? (t('exercises.exercise') || 'exercise') : (t('exercises.exercises') || 'exercises')}
        {searchQuery && ` ${t('exercises.matching', { query: searchQuery })}`}
        {selectedCategory !== 'all' && ` ${t('exercises.inCategory', { category: selectedCategory })}`}
      </p>

      {/* Exercises Grid/List */}
      {exercises.length === 0 ? (
        <div className="rounded-uc-card border border-dashed border-uc-border">
          <EmptyState
            icon="💪"
            title={isFiltered
              ? (t('exercises.noExercisesFound') || 'No exercises found')
              : (t('exercises.noExercises') || 'No exercises yet')}
            description={isFiltered
              ? (t('exercises.noExercisesFoundDescription') || 'Try adjusting your search or filters to find what you\'re looking for.')
              : (t('exercises.noExercisesDescription') || 'Create your exercise library to track your progress. Add exercises you use in your workouts, and we\'ll help you monitor your strength gains over time.')}
            action={!isFiltered && onCreateExercise && (
              <Button variant="accent" onClick={onCreateExercise}>
                + {t('exercises.addFirstExercise') || 'Add Your First Exercise'}
              </Button>
            )}
          />
          {!isFiltered && onCreateExercise && (
            <p className="-mt-2 px-4 pb-6 text-center text-[13px] text-uc-text-muted">
              {t('exercises.orUseQuickAdd') || 'or use Quick Add above for common exercises'}
            </p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {exercises.map(exercise => (
            <Card key={exercise.id}>
              <ExerciseItem
                exercise={exercise}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDate}
                quickStats={quickStats[exercise.id]}
                isDeleting={deletingExerciseId === exercise.id}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card padded={false} className="divide-y divide-uc-border overflow-hidden">
          {exercises.map(exercise => (
            <div key={exercise.id} className="px-4 py-3">
              <ExerciseItem
                exercise={exercise}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDate}
                quickStats={quickStats[exercise.id]}
                isDeleting={deletingExerciseId === exercise.id}
                compact
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function ExerciseItem({
  exercise,
  onEdit,
  onDelete,
  formatDate,
  quickStats,
  isDeleting = false,
  compact = false,
}: {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
  onDelete: (id: string) => void
  formatDate: (date: string) => string
  quickStats?: ExerciseQuickStats
  isDeleting?: boolean
  /** List view: name, category and unit on one line, progress link inline. */
  compact?: boolean
}) {
  const { t } = useLanguage()
  const stats = quickStats || exercise.stats
  const hasProgress = !!stats && stats.timesUsed > 0

  const lastSet = stats && stats.lastWeight !== null && stats.lastReps !== null
    ? (exercise.defaultUnit === 'reps'
        ? `${stats.lastReps} reps`
        : `${stats.lastWeight} ${exercise.defaultUnit} × ${stats.lastReps}`)
    : null

  const progressLink = hasProgress && (
    <Link
      href={`/exercises/${exercise.id}`}
      className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-uc-primary hover:underline"
    >
      {t('exercises.viewProgress') || 'View progress'}
      <span aria-hidden>›</span>
    </Link>
  )

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className={compact ? 'flex flex-wrap items-center gap-x-2.5 gap-y-1' : ''}>
          <h3 className="text-[17px] font-extrabold leading-snug text-uc-text break-words">{exercise.name}</h3>
          <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'mt-1.5'}`}>
            {exercise.category && <Chip className="min-h-6 px-2 text-xs">{exercise.category}</Chip>}
            <span className="text-[13px] font-semibold text-uc-text-muted">{exercise.defaultUnit}</span>
          </div>
        </div>
        {stats && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-uc-text-muted uc-num">
            <span>{t('exercises.usedTimes', { count: stats.timesUsed }) || `Used ${stats.timesUsed}×`}</span>
            {stats.lastUsed && (
              <span>{t('exercises.lastShort', { date: formatDate(stats.lastUsed) })}</span>
            )}
            {lastSet && <span>{t('exercises.lastSetShort', { value: lastSet })}</span>}
          </p>
        )}
        {progressLink && <div className={compact ? '' : 'mt-1'}>{progressLink}</div>}
      </div>
      <div className="flex shrink-0">
        <button
          type="button"
          onClick={() => onEdit(exercise)}
          aria-label={t('common.edit') || 'Edit'}
          title={t('common.edit') || 'Edit'}
          className="inline-flex size-11 items-center justify-center rounded-uc-input transition-colors hover:bg-uc-elevated"
        >
          <span aria-hidden>✏️</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(exercise.id)}
          disabled={isDeleting}
          aria-label={t('common.delete') || 'Delete'}
          title={t('common.delete') || 'Delete'}
          className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-error transition-colors hover:bg-uc-elevated disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? <Spinner /> : <span aria-hidden>🗑️</span>}
        </button>
      </div>
    </div>
  )
}
