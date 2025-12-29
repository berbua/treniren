'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Routine, Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import RoutineForm from '@/components/RoutineForm'
import Link from 'next/link'

export default function RoutinesPage() {
  return (
    <AuthGuard>
      <RoutinesPageContent />
    </AuthGuard>
  )
}

function RoutinesPageContent() {
  const { t } = useLanguage()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRoutines()
    fetchExercises()
  }, [])

  const fetchRoutines = async () => {
    try {
      const response = await fetch('/api/routines')
      if (response.ok) {
        const data = await response.json()
        setRoutines(data)
      }
    } catch (error) {
      console.error('Error fetching routines:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAvailableExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const handleCreateRoutine = () => {
    setEditingRoutine(null)
    setShowForm(true)
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setShowForm(true)
  }

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm(t('routines.deleteConfirm') || 'Are you sure you want to delete this routine?')) {
      return
    }

    try {
      const response = await fetch(`/api/routines/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchRoutines()
      } else {
        alert(t('routines.deleteError') || 'Failed to delete routine')
      }
    } catch (error) {
      console.error('Error deleting routine:', error)
      alert(t('routines.deleteErrorGeneric') || 'Error deleting routine')
    }
  }

  const handleSubmitRoutine = async (routineData: any) => {
    setIsSubmitting(true)
    try {
      const url = editingRoutine ? `/api/routines/${editingRoutine.id}` : '/api/routines'
      const method = editingRoutine ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData),
      })

      if (response.ok) {
        await fetchRoutines()
        setShowForm(false)
        setEditingRoutine(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMsg = editingRoutine 
          ? t('routines.updateError') || 'Failed to update routine'
          : t('routines.createError') || 'Failed to create routine'
        alert(`${errorMsg}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${editingRoutine ? 'updating' : 'creating'} routine:`, error)
      alert(`Error: ${error instanceof Error ? error.message : (t('routines.saveError') || 'Failed to save routine')}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingRoutine(null)
  }

  if (loading) {
    return <LoadingSpinner message={t('routines.loading') || 'Loading routines...'} fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-uc-text-light">
                💪 {t('routines.title') || 'My Routines'}
              </h1>
              <p className="text-uc-text-muted mt-2">
                {t('routines.subtitle') || 'Create reusable exercise routines for quick workout setup'}
              </p>
            </div>
            <button
              onClick={handleCreateRoutine}
              className="mt-4 lg:mt-0 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg w-full lg:w-auto"
            >
              + {t('routines.createRoutine') || 'Create Routine'}
            </button>
          </div>
        </div>

        {/* Routines List */}
        {routines.length === 0 ? (
          <div className="bg-uc-dark-bg rounded-xl p-12 border border-uc-purple/20 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h2 className="text-xl font-semibold text-uc-text-light mb-2">
              {t('routines.noRoutines') || 'No routines yet'}
            </h2>
            <p className="text-uc-text-muted mb-6">
              {t('routines.noRoutinesDescription') || 'Create your first routine to quickly add exercises to workouts'}
            </p>
            <button
              onClick={handleCreateRoutine}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              {t('routines.createFirstRoutine') || 'Create Your First Routine'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20 hover:border-uc-purple/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-uc-text-light mb-1">
                      {routine.name}
                    </h3>
                    {routine.description && (
                      <p className="text-sm text-uc-text-muted">
                        {routine.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-uc-text-muted">
                    <span className="mr-2">📋</span>
                    <span>
                      {routine.routineExercises.length} {routine.routineExercises.length === 1 
                        ? t('routines.exercise') || 'exercise' 
                        : t('routines.exercises') || 'exercises'}
                    </span>
                  </div>
                  {routine.variations.length > 0 && (
                    <div className="flex items-center text-sm text-uc-text-muted">
                      <span className="mr-2">🔄</span>
                      <span>
                        {routine.variations.length} {routine.variations.length === 1 
                          ? t('routines.variation') || 'variation' 
                          : t('routines.variations') || 'variations'}
                      </span>
                    </div>
                  )}
                </div>

                {routine.routineExercises.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-uc-text-muted mb-2">{t('routines.exercisesLabel') || 'Exercises:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {routine.routineExercises.slice(0, 3).map((re) => (
                        <span
                          key={re.id || re.exerciseId}
                          className="bg-uc-black/50 text-uc-text-light text-xs px-2 py-1 rounded"
                        >
                          {re.exercise?.name || t('routines.form.unknownExercise') || 'Unknown'}
                        </span>
                      ))}
                      {routine.routineExercises.length > 3 && (
                        <span className="text-uc-text-muted text-xs px-2 py-1">
                          +{routine.routineExercises.length - 3} {t('routines.more') || 'more'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {routine.variations.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-uc-text-muted mb-2">{t('routines.variationsLabel') || 'Variations:'}</div>
                    <div className="flex flex-wrap gap-2">
                      {routine.variations.map((variation) => (
                        <span
                          key={variation.id || variation.name}
                          className="bg-uc-purple/20 text-uc-text-light text-xs px-2 py-1 rounded border border-uc-purple/30"
                        >
                          {variation.name}
                          {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                            <span className="ml-1 text-uc-text-muted">
                              ({variation.defaultRepRangeMin}-{variation.defaultRepRangeMax} reps)
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-uc-purple/20">
                  <button
                    onClick={() => handleEditRoutine(routine)}
                    className="flex-1 bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('routines.edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('routines.delete') || 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Routine Form Modal */}
        {showForm && (
          <RoutineForm
            routine={editingRoutine}
            availableExercises={availableExercises}
            onSubmit={handleSubmitRoutine}
            onCancel={handleCancelForm}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}

