'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Routine, Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApiError } from '@/hooks/useApiError'
import { useConfirmation } from '@/hooks/useConfirmation'
import { extractApiError } from '@/lib/errors'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import RoutineForm from '@/components/RoutineForm'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { Button, Card, Chip, EmptyState, Icon, SkeletonRows, Spinner, WorkoutIconTile } from '@/components/ui'

export default function RoutinesPage() {
  return (
    <AuthGuard>
      <RoutinesPageContent />
    </AuthGuard>
  )
}

function RoutinesPageContent() {
  const { t } = useLanguage()
  const { handleError, showSuccess } = useApiError()
  const confirmation = useConfirmation()
  const { getToken } = useCsrfToken()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null)

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
    confirmation.showConfirmation(
      {
        title: t('routines.deleteConfirmTitle') || 'Delete Routine',
        message: t('routines.deleteConfirm') || 'Are you sure you want to delete this routine? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingRoutineId(id)
          const token = await getToken()
          const response = await fetch(`/api/routines/${id}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': token,
            },
          })

          if (response.ok) {
            showSuccess('Routine deleted successfully')
            await fetchRoutines()
          } else {
            const error = await extractApiError(response)
            handleError(error, t('routines.deleteError') || 'Failed to delete routine')
          }
        } catch (error) {
          handleError(error, t('routines.deleteErrorGeneric') || 'Error deleting routine')
        } finally {
          setDeletingRoutineId(null)
        }
      }
    )
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
        showSuccess(editingRoutine ? 'Routine updated successfully' : 'Routine created successfully')
        await fetchRoutines()
        setShowForm(false)
        setEditingRoutine(null)
      } else {
        const error = await extractApiError(response)
        const errorMsg = editingRoutine 
          ? t('routines.updateError') || 'Failed to update routine'
          : t('routines.createError') || 'Failed to create routine'
        handleError(error, errorMsg)
      }
    } catch (error) {
      const errorMsg = t('routines.saveError') || 'Failed to save routine'
      handleError(error, errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingRoutine(null)
  }

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">
              {t('routines.title') || 'My Routines'}
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('routines.subtitle') || 'Create reusable exercise routines for quick workout setup'}
            </p>
          </div>
          <Button
            variant="accent"
            className="shrink-0"
            onClick={handleCreateRoutine}
            aria-label={t('routines.createRoutine') || 'Create Routine'}
          >
            +<span className="hidden sm:inline">{t('routines.createRoutine') || 'Create Routine'}</span>
          </Button>
        </div>

        {/* Routines List */}
        {loading ? (
          <SkeletonRows />
        ) : routines.length === 0 ? (
          <div className="rounded-uc-card border border-dashed border-uc-border">
            <EmptyState
              icon={<Icon name="workouts" size={28} />}
              title={t('routines.noRoutines') || 'No routines yet'}
              description={t('routines.noRoutinesDescription') || 'Create your first routine to quickly add exercises to workouts'}
              action={
                <Button variant="accent" onClick={handleCreateRoutine}>
                  + {t('routines.createFirstRoutine') || 'Create Your First Routine'}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {routines.map((routine) => {
              const exerciseCount = routine.routineExercises.length
              const variationCount = routine.variations.length
              const shownExercises = routine.routineExercises.slice(0, 3)
              return (
                <Card key={routine.id} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <WorkoutIconTile workoutType="GYM" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[17px] font-extrabold leading-snug text-uc-text break-words">
                        {routine.name}
                      </h3>
                      {routine.description && (
                        <p className="mt-0.5 text-sm text-uc-text-muted">{routine.description}</p>
                      )}
                    </div>
                    <div className="-mr-2 -mt-1 flex shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditRoutine(routine)}
                        aria-label={t('routines.edit') || 'Edit'}
                        title={t('routines.edit') || 'Edit'}
                        className="inline-flex size-11 items-center justify-center rounded-uc-input transition-colors hover:bg-uc-elevated"
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutine(routine.id)}
                        disabled={deletingRoutineId === routine.id}
                        aria-label={t('routines.delete') || 'Delete'}
                        title={t('routines.delete') || 'Delete'}
                        className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-error transition-colors hover:bg-uc-elevated disabled:opacity-50"
                      >
                        {deletingRoutineId === routine.id ? <Spinner /> : <Icon name="delete" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[13px] font-semibold text-uc-text-muted uc-num">
                    {exerciseCount} {exerciseCount === 1
                      ? t('routines.exercise') || 'exercise'
                      : t('routines.exercises') || 'exercises'}
                    {variationCount > 0 && (
                      <>
                        {' · '}
                        {variationCount} {variationCount === 1
                          ? t('routines.variation') || 'variation'
                          : t('routines.variations') || 'variations'}
                      </>
                    )}
                  </p>

                  {exerciseCount > 0 && (
                    <p className="text-sm text-uc-text">
                      {shownExercises
                        .map((re) => re.exercise?.name || t('routines.form.unknownExercise') || 'Unknown')
                        .join(', ')}
                      {exerciseCount > 3 && (
                        <span className="text-uc-text-muted">
                          {' '}+{exerciseCount - 3} {t('routines.more') || 'more'}
                        </span>
                      )}
                    </p>
                  )}

                  {variationCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {routine.variations.map((variation) => (
                        <Chip key={variation.id || variation.name}>
                          {variation.name}
                          {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                            <span className="font-semibold opacity-75 uc-num">
                              {variation.defaultRepRangeMin}–{variation.defaultRepRangeMax} {t('routines.form.reps') || 'reps'}
                            </span>
                          )}
                        </Chip>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
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
            onRefreshExercises={fetchExercises}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.onClose}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
          isLoading={deletingRoutineId !== null}
        />
      </div>
    </div>
  )
}

