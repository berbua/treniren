'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import ExerciseForm from '@/components/ExerciseForm'
import { ExerciseLibrary } from '@/components/ExerciseLibrary'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { Button, SkeletonRows, buttonClasses } from '@/components/ui'

export default function ExercisesPage() {
  return (
    <AuthGuard>
      <ExercisesPageContent />
    </AuthGuard>
  )
}

function ExercisesPageContent() {
  const { t } = useLanguage()
  const confirmation = useConfirmation()
  const { getToken } = useCsrfToken()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch exercises
  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExercise = () => {
    setEditingExercise(null)
    setShowForm(true)
  }

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setShowForm(true)
  }

  const handleDeleteExercise = async (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('exercises.deleteConfirmTitle') || 'Delete Exercise',
        message: t('workouts.errors.deleteExerciseConfirm') || 'Are you sure you want to delete this exercise? This will also remove it from all workouts. This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingExerciseId(id)
          const token = await getToken()
          const response = await fetch(`/api/exercises/${id}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': token,
            },
          })

          if (response.ok) {
            await fetchExercises()
          } else {
            const error = await response.json()
            alert(`Failed to delete exercise: ${error.error}`)
          }
        } catch (error) {
          console.error('Error deleting exercise:', error)
          alert(t('workouts.errors.deleteExerciseFailed') || 'Failed to delete exercise')
        } finally {
          setDeletingExerciseId(null)
        }
      }
    )
  }

  const handleFormSubmit = async (exerciseData: { name: string; category?: string; defaultUnit: string }) => {
    setIsSubmitting(true)
    try {
      const url = editingExercise ? `/api/exercises/${editingExercise.id}` : '/api/exercises'
      const method = editingExercise ? 'PUT' : 'POST'

      const token = await getToken()
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify(exerciseData),
      })

      if (response.ok) {
        await fetchExercises()
        setShowForm(false)
        setEditingExercise(null)
      } else {
        const error = await response.json()
        alert(`Failed to ${editingExercise ? 'update' : 'create'} exercise: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
      alert(`Failed to ${editingExercise ? 'update' : 'create'} exercise`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(exercises.map(e => e.category).filter(Boolean) as string[]))]

  // Filter exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">
              {t('exercises.title') || 'Exercise Library'}
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('exercises.subtitle') || 'Manage your exercise library and track your progress'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/routines"
              aria-label={t('exercises.addRoutine') || 'Add Routine'}
              className={buttonClasses('ghost', 'md')}
            >
              <span aria-hidden>👯</span>
              <span className="hidden sm:inline">{t('exercises.addRoutine') || 'Add Routine'}</span>
            </Link>
            <Button variant="accent" onClick={handleCreateExercise} aria-label={t('exercises.addExercise') || 'Add Exercise'}>
              +<span className="hidden sm:inline">{t('exercises.addExercise') || 'Add Exercise'}</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : (
          <ExerciseLibrary
            exercises={filteredExercises}
            onEdit={handleEditExercise}
            onDelete={handleDeleteExercise}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            onQuickAdd={handleFormSubmit}
            deletingExerciseId={deletingExerciseId}
            onCreateExercise={handleCreateExercise}
          />
        )}

        {/* Exercise Form Modal */}
        {showForm && (
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingExercise(null)
            }}
            isSubmitting={isSubmitting}
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
          isLoading={deletingExerciseId !== null}
        />
      </div>
    </div>
  )
}

