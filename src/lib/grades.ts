// Climbing grades: grade lists per system, and a common rank so climbs logged in different systems can be compared
// (hardest send, grade pyramid). The rank is the position of the equivalent French grade in FRENCH_GRADES;
// conversions are the usual approximate tables.

import type { ClimbSection, SendStyle } from '@/types/workout'

export type ClimbKind = 'route' | 'boulder'
export type GradeSystem = 'french' | 'polish' | 'american'

const FRENCH_GRADES = [
  '3', '4', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8b+', '8c', '8c+', '9a', '9a+', '9b', '9b+', '9c', '9c+',
]

// [grade, French equivalent]
const POLISH_ROUTE: [string, string][] = [
  ['III', '3'], ['III+', '3'], ['IV', '4'], ['IV+', '4'], ['V', '5a'], ['V+', '5b'], ['VI', '5c'], ['VI+', '6a'],
  ['VI.1', '6a+'], ['VI.1+', '6b'], ['VI.2', '6b+'], ['VI.2+', '6c'], ['VI.3', '6c+'], ['VI.3+', '7a'],
  ['VI.4', '7a+'], ['VI.4+', '7b'], ['VI.5', '7b+'], ['VI.5+', '7c'], ['VI.6', '7c+'], ['VI.6+', '8a'],
  ['VI.7', '8a+'], ['VI.7+', '8b'], ['VI.8', '8b+'], ['VI.8+', '8c'],
]

const AMERICAN_ROUTE: [string, string][] = [
  ['5.0', '3'], ['5.1', '3'], ['5.2', '3'], ['5.3', '3'], ['5.4', '3'], ['5.5', '4'], ['5.6', '4'], ['5.7', '5a'],
  ['5.8', '5b'], ['5.9', '5c'], ['5.10a', '6a'], ['5.10b', '6a+'], ['5.10c', '6a+'], ['5.10d', '6b'],
  ['5.11a', '6b+'], ['5.11b', '6c'], ['5.11c', '6c+'], ['5.11d', '7a'], ['5.12a', '7a+'], ['5.12b', '7b'],
  ['5.12c', '7b+'], ['5.12d', '7c'], ['5.13a', '7c+'], ['5.13b', '8a'], ['5.13c', '8a+'], ['5.13d', '8b'],
  ['5.14a', '8b+'], ['5.14b', '8c'], ['5.14c', '8c+'], ['5.14d', '9a'], ['5.15a', '9a+'], ['5.15b', '9b'],
  ['5.15c', '9b+'], ['5.15d', '9c'],
]

const AMERICAN_BOULDER: [string, string][] = [
  ['V0', '4'], ['V1', '5b'], ['V2', '5c'], ['V3', '6a'], ['V4', '6b'], ['V5', '6c'], ['V6', '7a'], ['V7', '7a+'],
  ['V8', '7b'], ['V9', '7c'], ['V10', '7c+'], ['V11', '8a'], ['V12', '8a+'], ['V13', '8b'], ['V14', '8b+'],
  ['V15', '8c'], ['V16', '8c+'], ['V17', '9a'],
]

const frenchTable: [string, string][] = FRENCH_GRADES.map((grade) => [grade, grade])

const tables: Record<ClimbKind, Partial<Record<GradeSystem, [string, string][]>>> = {
  route: { french: frenchTable, polish: POLISH_ROUTE, american: AMERICAN_ROUTE },
  boulder: { french: frenchTable, american: AMERICAN_BOULDER },
}

export const gradeSystemsFor = (kind: ClimbKind): GradeSystem[] => Object.keys(tables[kind]) as GradeSystem[]

export const gradeOptions = (system: string, kind: ClimbKind): string[] =>
  (tables[kind][system as GradeSystem] ?? []).map(([grade]) => grade)

/** Common rank of a grade (higher = harder), or null for an unknown grade. */
export const gradeRank = (system: string | undefined, kind: ClimbKind, grade: string | undefined): number | null => {
  if (!system || !grade) return null
  const french = tables[kind][system as GradeSystem]?.find(([g]) => g === grade)?.[1]
  return french ? FRENCH_GRADES.indexOf(french) : null
}

/** The hardest grade in `system` at or below `rank` (the easiest one when all are harder). */
export const gradeAtRank = (system: GradeSystem, kind: ClimbKind, rank: number): string => {
  const table = tables[kind][system] ?? frenchTable
  let best = table[0][0]
  for (const [grade, french] of table) {
    if (FRENCH_GRADES.indexOf(french) <= rank) best = grade
  }
  return best
}

export const climbKindFor = (workoutType: string): ClimbKind => (workoutType === 'BOULDERING' ? 'boulder' : 'route')

export const SEND_STYLES: SendStyle[] = ['ONSIGHT', 'FLASH', 'REDPOINT', 'REPEAT', 'NOT_SENT']

/** Styles that count as a first-try send (tries = 1). */
export const FIRST_TRY_STYLES: SendStyle[] = ['ONSIGHT', 'FLASH']

export const isSend = (section: Pick<ClimbSection, 'style'>) => !!section.style && section.style !== 'NOT_SENT'

// The last grade system picked on a climb, per kind, so the next climb starts with it
const lastSystemKey = (kind: ClimbKind) => `uc-last-grade-system-${kind}`

export const getLastGradeSystem = (kind: ClimbKind): GradeSystem => {
  try {
    const stored = localStorage.getItem(lastSystemKey(kind)) as GradeSystem | null
    if (stored && gradeSystemsFor(kind).includes(stored)) return stored
  } catch {
    // Storage blocked: fall back to French
  }
  return 'french'
}

export const setLastGradeSystem = (kind: ClimbKind, system: GradeSystem) => {
  try {
    localStorage.setItem(lastSystemKey(kind), system)
  } catch {
    // Storage blocked: the default is used next time
  }
}
