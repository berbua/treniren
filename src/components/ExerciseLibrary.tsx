'use client'

import { useState, useEffect } from 'react'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

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
}

// Common exercises for quick-add
const commonExercises = [
  // Upper Body / Pull
  { name: 'Pull-ups', category: 'Pull', defaultUnit: 'reps' },
  { name: 'Chin-ups', category: 'Pull', defaultUnit: 'reps' },
  { name: 'Weighted Pull-ups', category: 'Pull', defaultUnit: 'kg' },
  { name: 'Lat Pulldown', category: 'Pull', defaultUnit: 'kg' },
  { name: 'Barbell Row', category: 'Back', defaultUnit: 'kg' },
  { name: 'Dumbbell Row', category: 'Back', defaultUnit: 'kg' },
  { name: 'Face Pulls', category: 'Back', defaultUnit: 'kg' },
  
  // Upper Body / Push
  { name: 'Push-ups', category: 'Push', defaultUnit: 'reps' },
  { name: 'Bench Press', category: 'Chest', defaultUnit: 'kg' },
  { name: 'Overhead Press', category: 'Shoulders', defaultUnit: 'kg' },
  { name: 'Dips', category: 'Push', defaultUnit: 'reps' },
  { name: 'Dumbbell Press', category: 'Chest', defaultUnit: 'kg' },
  
  // Lower Body
  { name: 'Squats', category: 'Legs', defaultUnit: 'kg' },
  { name: 'Deadlift', category: 'Lower Body', defaultUnit: 'kg' },
  { name: 'Romanian Deadlift', category: 'Lower Body', defaultUnit: 'kg' },
  { name: 'Lunges', category: 'Legs', defaultUnit: 'reps' },
  { name: 'Leg Press', category: 'Legs', defaultUnit: 'kg' },
  
  // Core
  { name: 'Plank', category: 'Core', defaultUnit: 'time' },
  { name: 'Hanging Leg Raises', category: 'Core', defaultUnit: 'reps' },
  { name: 'Russian Twists', category: 'Core', defaultUnit: 'reps' },
  { name: 'Dead Bug', category: 'Core', defaultUnit: 'reps' },
  
  // Climbing Specific
  { name: 'Fingerboard Hangs', category: 'Climbing Specific', defaultUnit: 'time' },
  { name: 'Campus Board', category: 'Climbing Specific', defaultUnit: 'reps' },
  { name: 'Hangboard Repeaters', category: 'Climbing Specific', defaultUnit: 'reps' },
  { name: 'Crimp Training', category: 'Climbing Specific', defaultUnit: 'time' },
  { name: 'Pinch Training', category: 'Climbing Specific', defaultUnit: 'time' },
  { name: 'Sloper Training', category: 'Climbing Specific', defaultUnit: 'time' },
]

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
}: ExerciseLibraryProps) {
  const { t } = useLanguage()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [quickStats, setQuickStats] = useState<Record<string, ExerciseQuickStats>>({})

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
      const response = await fetch(`/api/exercises/${exerciseId}/quick-stats`)
      if (response.ok) {
        const stats = await response.json()
        setQuickStats(prev => ({ ...prev, [exerciseId]: stats }))
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Pull': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Push': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Legs': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Core': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Back': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Chest': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Shoulders': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Climbing Specific': 'bg-uc-purple/20 text-uc-purple border-uc-purple/30',
    }
    return colors[category || 'Other'] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔍 Search exercises..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-uc-mustard text-uc-black'
                  : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light'
              }`}
            >
              ⏹️ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-uc-mustard text-uc-black'
                  : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light'
              }`}
            >
              ☰ List
            </button>
          </div>

          {/* Quick Add Toggle */}
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showQuickAdd
                ? 'bg-uc-purple text-uc-text-light'
                : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light'
            }`}
          >
            ⚡ Quick Add
          </button>
        </div>
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
          <h3 className="text-lg font-semibold text-uc-text-light mb-4">
            ⚡ Quick Add Common Exercises
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {commonExercises
              .filter(ex => !exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase()))
              .map((exercise, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onQuickAdd(exercise)
                    setShowQuickAdd(false)
                  }}
                  className="p-3 rounded-lg bg-uc-black/50 hover:bg-uc-black text-left transition-colors border border-uc-purple/20 hover:border-uc-purple/40"
                >
                  <div className="font-medium text-uc-text-light">{exercise.name}</div>
                  <div className="text-xs text-uc-text-muted mt-1">{exercise.category}</div>
                </button>
              ))}
          </div>
          {commonExercises.filter(ex => !exercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase())).length === 0 && (
            <p className="text-uc-text-muted text-center py-4">All common exercises have been added!</p>
          )}
        </div>
      )}

      {/* Exercise Count */}
      <div className="text-uc-text-muted">
        {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
      </div>

      {/* Exercises Grid/List */}
      {exercises.length === 0 ? (
        <div className="bg-uc-dark-bg rounded-xl p-12 text-center border border-uc-purple/20">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-xl font-semibold text-uc-text-light mb-2">No exercises found</h3>
          <p className="text-uc-text-muted mb-6">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first exercise!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={onEdit}
              onDelete={onDelete}
              formatDate={formatDate}
              getCategoryColor={getCategoryColor}
              quickStats={quickStats[exercise.id]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 overflow-hidden">
          <div className="divide-y divide-uc-purple/20">
            {exercises.map(exercise => (
              <ExerciseListItem
                key={exercise.id}
                exercise={exercise}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDate}
                getCategoryColor={getCategoryColor}
                quickStats={quickStats[exercise.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  formatDate,
  getCategoryColor,
  quickStats,
}: {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
  onDelete: (id: string) => void
  formatDate: (date: string | null) => string
  getCategoryColor: (category: string) => string
  quickStats?: ExerciseQuickStats
}) {
  const stats = quickStats || exercise.stats

  return (
    <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20 hover:border-uc-purple/40 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-uc-text-light">
              {exercise.name}
            </h3>
            {stats && stats.timesUsed > 0 && (
              <Link
                href={`/exercises/${exercise.id}`}
                className="text-xs text-uc-mustard hover:text-uc-mustard/80 transition-colors"
                title="View Progress"
              >
                📊
              </Link>
            )}
          </div>
          {exercise.category && (
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(exercise.category)}`}>
              {exercise.category}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exercise)}
            className="p-2 text-uc-text-muted hover:text-uc-mustard transition-colors"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(exercise.id)}
            className="p-2 text-uc-text-muted hover:text-red-500 transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-uc-text-muted">
          <span>Unit:</span>
          <span className="text-uc-text-light font-medium">{exercise.defaultUnit}</span>
        </div>
        {stats && (
          <>
            <div className="flex items-center justify-between text-uc-text-muted">
              <span>Times Used:</span>
              <span className="text-uc-text-light font-medium">{stats.timesUsed}</span>
            </div>
            {stats.lastUsed && (
              <div className="flex items-center justify-between text-uc-text-muted">
                <span>Last Used:</span>
                <span className="text-uc-text-light font-medium">{formatDate(stats.lastUsed)}</span>
              </div>
            )}
            {stats.lastWeight !== null && stats.lastReps !== null && (
              <div className="flex items-center justify-between text-uc-text-muted">
                <span>Last:</span>
                <span className="text-uc-text-light font-medium">
                  {stats.lastReps}×{stats.lastWeight}{exercise.defaultUnit}
                </span>
              </div>
            )}
          </>
        )}
        {stats && stats.timesUsed > 0 && (
          <Link
            href={`/exercises/${exercise.id}`}
            className="block w-full mt-3 px-3 py-2 bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-purple rounded-lg text-sm font-medium text-center transition-colors"
          >
            View Progress →
          </Link>
        )}
      </div>
    </div>
  )
}

function ExerciseListItem({
  exercise,
  onEdit,
  onDelete,
  formatDate,
  getCategoryColor,
  quickStats,
}: {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
  onDelete: (id: string) => void
  formatDate: (date: string | null) => string
  getCategoryColor: (category: string) => string
  quickStats?: ExerciseQuickStats
}) {
  const stats = quickStats || exercise.stats

  return (
    <div className="p-4 hover:bg-uc-black/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-uc-text-light">
              {exercise.name}
            </h3>
            {exercise.category && (
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(exercise.category)}`}>
                {exercise.category}
              </span>
            )}
            <span className="text-sm text-uc-text-muted">
              {exercise.defaultUnit}
            </span>
            {stats && stats.timesUsed > 0 && (
              <Link
                href={`/exercises/${exercise.id}`}
                className="text-xs text-uc-mustard hover:text-uc-mustard/80 transition-colors"
                title="View Progress"
              >
                📊 View Progress
              </Link>
            )}
          </div>
          {stats && (
            <div className="flex items-center gap-4 mt-2 text-sm text-uc-text-muted">
              <span>Used {stats.timesUsed} times</span>
              {stats.lastUsed && (
                <>
                  <span>•</span>
                  <span>Last: {formatDate(stats.lastUsed)}</span>
                </>
              )}
              {stats.lastWeight !== null && stats.lastReps !== null && (
                <>
                  <span>•</span>
                  <span>Last: {stats.lastReps}×{stats.lastWeight}{exercise.defaultUnit}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(exercise)}
            className="p-2 text-uc-text-muted hover:text-uc-mustard transition-colors"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(exercise.id)}
            className="p-2 text-uc-text-muted hover:text-red-500 transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

