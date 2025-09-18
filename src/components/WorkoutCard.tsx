'use client'

import { WorkoutType, TrainingVolume } from '@/types/workout'

interface WorkoutCardProps {
  workout: {
    id: string
    type: WorkoutType
    date: string
    trainingVolume?: TrainingVolume
    notes?: string
    preSessionFeel?: number
    dayAfterTiredness?: number
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const getTrainingTypeColor = (type: WorkoutType) => {
  switch (type) {
    case 'GYM':
      return 'bg-training-gym'
    case 'BOULDERING':
      return 'bg-training-bouldering'
    case 'CIRCUITS':
      return 'bg-training-circuits'
    case 'LEAD_ROCK':
      return 'bg-training-leadRock'
    case 'LEAD_ARTIFICIAL':
      return 'bg-training-leadArtificial'
    default:
      return 'bg-gray-500'
  }
}

const getTrainingTypeLabel = (type: WorkoutType) => {
  switch (type) {
    case 'GYM':
      return '🏋️ Gym'
    case 'BOULDERING':
      return '🧗 Bouldering'
    case 'CIRCUITS':
      return '🔄 Circuits'
    case 'LEAD_ROCK':
      return '🏔️ Lead Rock'
    case 'LEAD_ARTIFICIAL':
      return '🧗‍♀️ Lead Wall'
    default:
      return type
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function WorkoutCard({ workout, onEdit, onDelete }: WorkoutCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getTrainingTypeColor(workout.type)}`} />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              {getTrainingTypeLabel(workout.type)}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatDate(workout.date)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(workout.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(workout.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {workout.trainingVolume && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Volume:</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
              {workout.trainingVolume}
            </span>
          </div>
        )}


        {workout.preSessionFeel && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Pre-session feel:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`w-2 h-2 rounded-full ${
                    rating <= (workout.preSessionFeel || 0)
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {workout.dayAfterTiredness && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Day after tiredness:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`w-2 h-2 rounded-full ${
                    rating <= (workout.dayAfterTiredness || 0)
                      ? 'bg-red-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {workout.notes && (
          <div className="mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
