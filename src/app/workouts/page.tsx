'use client'

import { useState, useEffect } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import EnhancedWorkoutForm from '@/components/EnhancedWorkoutForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Workout, WorkoutFormData } from '@/types/workout'

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

  // Fetch workouts
  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data)
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create workout
  const createWorkout = async (workoutData: WorkoutFormData) => {
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        await fetchWorkouts()
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error creating workout:', error)
    }
  }

  // Update workout
  const updateWorkout = async (id: string, workoutData: WorkoutFormData) => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        await fetchWorkouts()
        setShowForm(false)
        setEditingWorkout(null)
      }
    } catch (error) {
      console.error('Error updating workout:', error)
    }
  }

  // Delete workout
  const deleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchWorkouts()
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  // Handle form submission
  const handleSubmit = (workoutData: WorkoutFormData) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, workoutData)
    } else {
      createWorkout(workoutData)
    }
  }

  // Handle edit
  const handleEdit = (id: string) => {
    const workout = workouts.find(w => w.id === id)
    setEditingWorkout(workout || null)
    setShowForm(true)
  }

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false)
    setEditingWorkout(null)
  }

  useEffect(() => {
    fetchWorkouts()
  }, [])

  if (loading) {
    return <LoadingSpinner message="Loading workouts..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              My Workouts
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Track your training sessions and progress
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Workout
          </button>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏋️‍♀️</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No workouts yet
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Start tracking your training by adding your first workout
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Your First Workout
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={handleEdit}
                onDelete={deleteWorkout}
              />
            ))}
          </div>
        )}

        {showForm && (
          <EnhancedWorkoutForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingWorkout || undefined}
          />
        )}
      </div>
    </div>
  )
}
