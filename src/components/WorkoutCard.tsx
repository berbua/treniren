'use client'

import { WorkoutType, TrainingVolume, MentalState, Tag } from '@/types/workout'

interface WorkoutCardProps {
  workout: {
    id: string
    type: WorkoutType
    startTime: string
    trainingVolume?: TrainingVolume
    notes?: string
    preSessionFeel?: number
    dayAfterTiredness?: number
    focusLevel?: number
    mentalState?: MentalState
    sector?: string
    mentalPracticeType?: string
    gratitude?: string
    improvements?: string
    tags?: Tag[]
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
    case 'MENTAL_PRACTICE':
      return 'bg-training-mentalPractice'
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
    case 'MENTAL_PRACTICE':
      return '🧘 Mental Practice'
    default:
      return type
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
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
              {formatDate(workout.startTime)}
            </p>
            {workout.tags && workout.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {workout.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(workout.id)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit workout"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(workout.id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete workout"
            >
              🗑️
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

        {workout.sector && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Sector:</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
              🏔️ {workout.sector}
            </span>
          </div>
        )}

        {workout.type === 'MENTAL_PRACTICE' && workout.mentalPracticeType && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Practice type:</span>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
              🧘 {workout.mentalPracticeType}
            </span>
          </div>
        )}

        {workout.type !== 'MENTAL_PRACTICE' && workout.preSessionFeel && (
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

        {workout.type === 'MENTAL_PRACTICE' && workout.focusLevel && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Focus level:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`w-2 h-2 rounded-full ${
                    rating <= (workout.focusLevel || 0)
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {workout.type !== 'MENTAL_PRACTICE' && workout.dayAfterTiredness && (
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

        {/* Mental State Display */}
        {workout.mentalState && (workout.mentalState.beforeClimbing || (workout.mentalState.climbSections && workout.mentalState.climbSections.length > 0)) && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm">🧠</span>
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">Strong Mind</span>
            </div>
            <div className="space-y-1 text-xs">
              {workout.mentalState.beforeClimbing && (
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600 dark:text-purple-400">Before:</span>
                  <span className={`font-medium ${
                    workout.mentalState.beforeClimbing === 1 ? 'text-red-600' :
                    workout.mentalState.beforeClimbing === 2 ? 'text-orange-600' :
                    workout.mentalState.beforeClimbing === 3 ? 'text-yellow-600' :
                    workout.mentalState.beforeClimbing === 4 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {workout.mentalState.beforeClimbing === 1 ? 'Very Nervous' :
                     workout.mentalState.beforeClimbing === 2 ? 'Nervous' :
                     workout.mentalState.beforeClimbing === 3 ? 'Neutral' :
                     workout.mentalState.beforeClimbing === 4 ? 'Confident' : 'Very Confident'}
                  </span>
                </div>
              )}
              {(workout.type === 'LEAD_ROCK' || workout.type === 'LEAD_ARTIFICIAL') && workout.mentalState.climbSections && workout.mentalState.climbSections.length > 0 && (
                <div className="space-y-1">
                  <span className="text-purple-600 dark:text-purple-400">Climbs:</span>
                  {workout.mentalState.climbSections.map((section, index) => (
                    <div key={section.id} className="ml-2 text-xs">
                      <span className="text-purple-600 dark:text-purple-400">Climb {index + 1}:</span>
                      {section.focusState && (
                        <span className={`ml-1 font-medium ${
                          section.focusState === 'CHOKE' ? 'text-red-600' :
                          section.focusState === 'DISTRACTION' ? 'text-orange-600' :
                          section.focusState === 'PRESENT' ? 'text-yellow-600' :
                          section.focusState === 'FOCUSED' ? 'text-blue-600' :
                          section.focusState === 'CLUTCH' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {section.focusState}
                        </span>
                      )}
                      {section.tookFall !== undefined && (
                        <span className={`ml-1 ${section.tookFall ? 'text-pink-600' : 'text-green-600'}`}>
                          ({section.tookFall ? 'Fell' : 'No fall'})
                        </span>
                      )}
                      {section.comfortZone && (
                        <span className={`ml-1 ${
                          section.comfortZone === 'COMFORT' ? 'text-green-600' :
                          section.comfortZone === 'STRETCH1' ? 'text-yellow-600' :
                          section.comfortZone === 'STRETCH2' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          - {section.comfortZone === 'COMFORT' ? 'Comfort' :
                              section.comfortZone === 'STRETCH1' ? 'Stretch 1' :
                              section.comfortZone === 'STRETCH2' ? 'Stretch 2' : 'Panic'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {workout.mentalState.reflections && (
                <div className="mt-2">
                  <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                    &ldquo;{workout.mentalState.reflections}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gratitude and Improvements */}
        {(workout.gratitude || workout.improvements) && (
          <div className="mt-3 space-y-2">
            {workout.gratitude && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm">🙏</span>
                  <span className="text-xs font-semibold text-green-800 dark:text-green-200">Gratitude</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {workout.gratitude}
                </p>
              </div>
            )}
            {workout.improvements && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">Improvements</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {workout.improvements}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
