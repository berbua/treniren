// Strong Mind goals live in localStorage ('processGoals' / 'projectGoals').
//
// achievedAt: the date (YYYY-MM-DD) the goal was achieved. null = not achieved (set when the user un-marks it);
// undefined = never set, so it's filled in from the workouts that recorded it as achieved.

export interface ProcessGoal {
  id: string
  timeframeValue: string
  timeframeUnit: string
  startDate: string
  goalDescription: string
  createdAt: string
  achievedAt?: string | null
}

export interface ProjectGoal {
  id: string
  climbingType: string
  gradeSystem: string
  routeGrade: string
  routeName: string
  sectorLocation: string
  relatedProcessGoal: string
  createdAt: string
  achievedAt?: string | null
}

export type GoalKind = 'process' | 'project'

const storageKey: Record<GoalKind, string> = { process: 'processGoals', project: 'projectGoals' }

export const isGoalAchieved = (goal: { achievedAt?: string | null }) => typeof goal.achievedAt === 'string'

// Process and project ids share one counter ("goal-N" / "project-N"), so seed it from both lists
export const nextGoalId = (prefix: 'goal' | 'project', goals: { id: string }[]) => {
  const numbers = goals.map(g => parseInt(g.id.split('-')[1])).filter(n => !Number.isNaN(n))
  return `${prefix}-${Math.max(-1, ...numbers) + 1}`
}

export const saveGoals = (kind: GoalKind, goals: ProcessGoal[] | ProjectGoal[]) =>
  localStorage.setItem(storageKey[kind], JSON.stringify(goals))

// Marks goals achieved on `date`, keeping the date of goals that are already achieved
export const markGoalsAchieved = (kind: GoalKind, goalIds: string[], date: string) => {
  if (goalIds.length === 0) return
  try {
    const goals: Array<ProcessGoal | ProjectGoal> = JSON.parse(localStorage.getItem(storageKey[kind]) || '[]')
    const updated = goals.map(goal =>
      goalIds.includes(goal.id) && !isGoalAchieved(goal) ? { ...goal, achievedAt: date } : goal
    )
    localStorage.setItem(storageKey[kind], JSON.stringify(updated))
  } catch (e) {
    console.error(`Error updating ${kind} goals:`, e)
  }
}
