// Temporary types until we set up the database
export type WorkoutType = 'GYM' | 'BOULDERING' | 'CIRCUITS' | 'LEAD_ROCK' | 'LEAD_ARTIFICIAL' | 'MENTAL_PRACTICE' | 'FINGERBOARD'
export type TrainingVolume = 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5'
export type MentalPracticeType = 'MEDITATION' | 'REFLECTING' | 'OTHER'
export type TimeOfDay = 'MORNING' | 'MIDDAY' | 'EVENING'
export type FocusState = 'CHOKE' | 'DISTRACTION' | 'PRESENT' | 'FOCUSED' | 'CLUTCH' | 'FLOW'
export type ComfortZone = 'COMFORT' | 'STRETCH1' | 'STRETCH2' | 'PANIC'

export interface ClimbSection {
  id: string
  focusState?: FocusState
  tookFall?: boolean
  comfortZone?: ComfortZone
  notes?: string
}

export interface ProcessGoalProgress {
  goalId: string
  progress: 1 | 2 | 3 // 1 = minimal progress, 2 = good progress, 3 = excellent progress
}

export interface ProjectGoalCompletion {
  goalId: string
  completed: boolean
}

export interface MentalState {
  beforeClimbing?: number // 1-5 scale
  duringClimbing?: number // 1-5 scale
  tookFalls?: boolean
  reflections?: string
  climbSections?: ClimbSection[] // For lead climbing
  processGoals?: ProcessGoalProgress[] // Progress on process goals
  projectGoals?: ProjectGoalCompletion[] // Completed project goals
}

export interface Workout {
  id: string
  type: WorkoutType
  startTime: string
  endTime?: string
  trainingVolume?: TrainingVolume
  notes?: string
  preSessionFeel?: number
  dayAfterTiredness?: number
  focusLevel?: number // 1-5 scale for mental practice
  mentalState?: MentalState
  sector?: string // For lead_rock workouts
  mentalPracticeType?: MentalPracticeType // For mental practice workouts
  timeOfDay?: TimeOfDay[] // For mental practice workouts - can be multiple times
  gratitude?: string // 3 things I am grateful for
  improvements?: string // 3 things to do better next time
  planId?: string
  userId: string
  createdAt: string
  updatedAt: string
  tags?: Tag[] // Associated tags
}

export interface Exercise {
  id: string
  name: string
  category?: string
  defaultUnit: string
  userId: string
  createdAt: string
  updatedAt: string
  stats?: {
    timesUsed: number
    lastUsed: string | null
  }
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutTag {
  workoutId: string
  tagId: string
}

export interface WorkoutSet {
  reps: number
  weight: number
  rir?: number // Reps in Reserve
  notes?: string
}

export interface WorkoutExerciseData {
  exerciseId: string
  exerciseName: string
  order: number
  sets: WorkoutSet[]
}

export interface WorkoutFormData {
  type: WorkoutType
  date: string
  trainingVolume?: TrainingVolume
  focusLevel?: number // 1-5 scale for mental practice
  notes: string
  mentalState?: MentalState
  sector?: string // For lead_rock workouts
  mentalPracticeType?: MentalPracticeType // For mental practice workouts
  timeOfDay?: TimeOfDay[] // For mental practice workouts - can be multiple times
  tagIds?: string[] // Array of tag IDs
  exercises?: WorkoutExerciseData[] // Exercises and sets for GYM workouts
  fingerboardHangs?: FingerboardWorkoutHang[] // Hangs for FINGERBOARD workouts
  gratitude?: string // 3 things I am grateful for
  improvements?: string // 3 things to do better next time
}

export interface RoutineVariation {
  id?: string
  name: string
  description?: string
  defaultSets?: number
  defaultRepRangeMin?: number
  defaultRepRangeMax?: number
  defaultRIR?: number
}

export interface RoutineExercise {
  id?: string
  exerciseId: string
  exercise?: Exercise
  order: number
  notes?: string
}

export interface Routine {
  id: string
  userId: string
  name: string
  description?: string
  routineExercises: RoutineExercise[]
  variations: RoutineVariation[]
  createdAt: string
  updatedAt: string
}

export interface RoutineFormData {
  name: string
  description?: string
  exercises: RoutineExercise[]
  variations: RoutineVariation[]
}

export type HandType = 'ONE_HAND' | 'BOTH_HANDS'
export type GripType = 'OPEN_HAND' | 'CRIMP' | 'SLOPER'

export interface FingerboardProtocolHang {
  id?: string
  order: number
  handType: HandType
  gripType: GripType
  crimpSize?: number // crimp size in mm (only used when gripType is CRIMP)
  customDescription?: string // optional custom description
  defaultLoad?: number // kg to add
  defaultUnload?: number // kg to remove
  defaultReps?: number
  defaultTimeSeconds?: number // hang duration in seconds
  notes?: string
}

export interface FingerboardProtocol {
  id: string
  userId: string
  name: string
  description?: string
  hangs: FingerboardProtocolHang[]
  createdAt: string
  updatedAt: string
}

export interface FingerboardProtocolFormData {
  name: string
  description?: string
  hangs: FingerboardProtocolHang[]
}

export interface FingerboardWorkoutHang {
  id?: string
  order: number
  handType: HandType
  gripType: GripType
  crimpSize?: number // crimp size in mm (only used when gripType is CRIMP)
  customDescription?: string // optional custom description
  load?: number // actual kg added
  unload?: number // actual kg removed
  reps?: number // actual reps
  timeSeconds?: number // actual time in seconds
  notes?: string
}

export interface FingerboardTestHang {
  id?: string
  order: number
  handType: HandType
  gripType: GripType
  crimpSize?: number
  customDescription?: string
  targetLoad?: number // optional target load
  targetTimeSeconds?: number // optional target time
  notes?: string
}

export interface FingerboardTestingProtocol {
  id: string
  userId: string
  name: string
  description?: string
  testHangs: FingerboardTestHang[]
  createdAt: string
  updatedAt: string
  _count?: {
    testResults: number
  }
}

export interface FingerboardTestingProtocolFormData {
  name: string
  description?: string
  testHangs: FingerboardTestHang[]
}

export interface FingerboardTestResult {
  id?: string
  protocolId: string
  testHangId: string
  date: string
  handType: HandType
  gripType: GripType
  crimpSize?: number
  customDescription?: string
  load?: number
  unload?: number
  timeSeconds?: number // how long they hung
  success?: boolean
  notes?: string
}

export interface FingerboardTestResultFormData {
  protocolId: string
  date: string
  results: Array<{
    testHangId: string
    load?: number
    unload?: number
    timeSeconds?: number
    success?: boolean
    notes?: string
  }>
}
