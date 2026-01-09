'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import ExerciseForm from '@/components/ExerciseForm'
import { ExerciseLibrary } from '@/components/ExerciseLibrary'
import { useCsrfToken } from '@/hooks/useCsrfToken'

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

  if (loading) {
    return <LoadingSpinner message="Loading exercises..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-uc-text-light">
              💪 {t('exercises.title') || 'Exercise Library'}
            </h1>
            <p className="text-uc-text-muted mt-2">
              {t('exercises.subtitle') || 'Manage your exercise library and track your progress'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/routines"
              className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors border border-uc-purple/20 flex items-center space-x-2 whitespace-nowrap"
            >
              <span>👯</span>
              <span>{t('exercises.addRoutine') || 'Add Routine'}</span>
            </Link>
            <button
              onClick={handleCreateExercise}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors shadow-lg flex items-center space-x-2 whitespace-nowrap"
            >
              <span>➕</span>
              <span>{t('exercises.addExercise') || 'Add Exercise'}</span>
            </button>
          </div>
        </div>

        {/* Exercise Library Component */}
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

