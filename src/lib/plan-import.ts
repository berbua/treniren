// Training plan import: a CSV (pasted or uploaded) with one planned session per row, e.g. a plan made with Claude.
//
//   date,type,title,volume,notes
//   2026-11-16,FINGERBOARD,Max hangs 20mm,TR4,5x10s +12kg
//
// Columns are matched by header name (any order); date and type are required, the rest optional.

import type { TrainingVolume, WorkoutType } from '@/types/workout'

export interface PlannedSessionInput {
  date: string // YYYY-MM-DD
  type: WorkoutType
  title: string
  trainingVolume: TrainingVolume | null
  notes: string | null
}

export interface PlanRowError {
  row: number // 1 = first session row under the header; 0 = the file / header
  reason: 'empty' | 'header' | 'date' | 'type' | 'volume' | 'tooMany'
}

export const MAX_PLAN_ROWS = 100

const WORKOUT_TYPES: WorkoutType[] = ['GYM', 'BOULDERING', 'CIRCUITS', 'LEAD_ROCK', 'LEAD_ARTIFICIAL', 'MENTAL_PRACTICE', 'FINGERBOARD']

// Friendly names Claude (or a person) might write instead of the enum value
const TYPE_ALIASES: Record<string, WorkoutType> = {
  LEAD_WALL: 'LEAD_ARTIFICIAL',
  LEAD_GYM: 'LEAD_ARTIFICIAL',
  LEAD_INDOOR: 'LEAD_ARTIFICIAL',
  LEAD_OUTDOOR: 'LEAD_ROCK',
  ROCK: 'LEAD_ROCK',
  BOULDER: 'BOULDERING',
  MENTAL: 'MENTAL_PRACTICE',
  HANGBOARD: 'FINGERBOARD',
  STRENGTH: 'GYM',
}

export const PLAN_CSV_HEADER = 'date,type,title,volume,notes'

/** Instructions to paste into a chat with Claude so the plan comes back in the import format. */
export const PLAN_PROMPT_FOR_CLAUDE = `Please give me the plan as CSV, in a code block, in exactly this format:

${PLAN_CSV_HEADER}
2026-11-16,FINGERBOARD,Max hangs 20mm,TR4,5x10s +12kg
2026-11-17,BOULDERING,Limit bouldering,TR4,"4x4 on 7a+, 3 min rest"

- date: YYYY-MM-DD
- type: one of ${WORKOUT_TYPES.join(', ')} (LEAD_ARTIFICIAL = lead on an indoor wall)
- title: short session name
- volume: TR1 (very light) to TR5 (maximum), or empty
- notes: the session details; put the field in double quotes if it contains a comma
- one row per session, no other text inside the code block`

/** Splits CSV text into rows of fields; handles quoted fields with commas, quotes ("") and line breaks. */
const parseCsv = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = []
  let fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      fields.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      fields.push(field)
      rows.push(fields)
      fields = []
      field = ''
    } else {
      field += char
    }
  }
  fields.push(field)
  rows.push(fields)
  return rows.filter(row => row.some(f => f.trim() !== ''))
}

const normalizeType = (value: string): WorkoutType | null => {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if ((WORKOUT_TYPES as string[]).includes(key)) return key as WorkoutType
  return TYPE_ALIASES[key] ?? null
}

const normalizeVolume = (value: string): TrainingVolume | null | undefined => {
  const match = value.trim().toUpperCase().match(/^(?:TR)?([1-5])$/)
  if (match) return `TR${match[1]}` as TrainingVolume
  return value.trim() === '' ? null : undefined
}

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** Parses pasted or uploaded plan CSV. Code fences (```csv … ```) around it are ignored. */
export const parsePlanCsv = (input: string): { sessions: PlannedSessionInput[]; errors: PlanRowError[] } => {
  const text = input.replace(/^﻿/, '').replace(/^\s*```[a-z]*\s*$/gim, '').trim()
  const errors: PlanRowError[] = []
  if (!text) return { sessions: [], errors: [{ row: 0, reason: 'empty' }] }

  // Comma, or semicolon when the header uses it (spreadsheets with a comma decimal separator)
  const firstLine = text.split('\n', 1)[0]
  const rows = parseCsv(text, firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',')
  const header = rows[0].map(field => field.trim().toLowerCase())
  const column = (name: string) => header.indexOf(name)
  const dateCol = column('date')
  const typeCol = column('type')
  if (dateCol === -1 || typeCol === -1) {
    return { sessions: [], errors: [{ row: 0, reason: 'header' }] }
  }
  const titleCol = column('title')
  const volumeCol = header.findIndex(name => name === 'volume' || name === 'tr')
  const notesCol = column('notes')

  const sessions: PlannedSessionInput[] = []
  rows.slice(1).forEach((fields, index) => {
    const row = index + 1
    const get = (col: number) => (col === -1 ? '' : (fields[col] ?? '').trim())
    const date = get(dateCol)
    const type = normalizeType(get(typeCol))
    const trainingVolume = normalizeVolume(get(volumeCol))
    if (!isValidDate(date)) errors.push({ row, reason: 'date' })
    else if (!type) errors.push({ row, reason: 'type' })
    else if (trainingVolume === undefined) errors.push({ row, reason: 'volume' })
    else {
      sessions.push({
        date,
        type,
        title: get(titleCol).slice(0, 200),
        trainingVolume,
        notes: get(notesCol).slice(0, 2000) || null,
      })
    }
  })
  if (sessions.length > MAX_PLAN_ROWS) {
    errors.push({ row: 0, reason: 'tooMany' })
    sessions.length = MAX_PLAN_ROWS
  }
  return { sessions, errors }
}

/** Workout notes prefilled when logging a planned session: its title and notes. */
export const plannedSessionNotes = (plan: { title: string; notes: string | null }) =>
  [plan.title, plan.notes].filter(Boolean).join('\n')
