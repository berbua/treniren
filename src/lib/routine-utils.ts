import { prisma } from '@/lib/prisma'

/**
 * Checks the exercises a routine links to: each id may appear only once (unique per routine in the DB)
 * and must be one of the user's own exercises. Returns an error message, or null when all are fine.
 */
export async function validateRoutineExercises(
  userId: string,
  exercises: { exerciseId: string }[] | undefined
): Promise<string | null> {
  if (!exercises || exercises.length === 0) return null

  const exerciseIds = exercises.map((e) => e.exerciseId)
  const uniqueIds = new Set(exerciseIds)
  if (uniqueIds.size !== exerciseIds.length) {
    return 'Each exercise can only be added to a routine once'
  }

  const ownedCount = await prisma.exercise.count({
    where: { id: { in: [...uniqueIds] }, userId },
  })
  if (ownedCount !== uniqueIds.size) {
    return 'One or more exercises not found or do not belong to user'
  }

  return null
}
