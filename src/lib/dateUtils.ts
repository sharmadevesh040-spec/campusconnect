import { format, isToday, isTomorrow, isValid } from 'date-fns'

/**
 * Safely converts any input (string, timestamp, Date, null, undefined) into a valid Date object.
 * If invalid or absent, returns new Date() or fallback Date.
 */
export function safeDate(val: any, fallback: Date = new Date()): Date {
  if (!val) return fallback
  if (val instanceof Date) {
    return isValid(val) ? val : fallback
  }
  const d = new Date(val)
  return isValid(d) ? d : fallback
}

/**
 * Safely extracts the numeric millisecond timestamp for sorting or comparison.
 * Never throws TypeError; returns 0 if invalid.
 */
export function safeTime(val: any): number {
  if (!val) return 0
  if (val instanceof Date) {
    const t = val.getTime()
    return isNaN(t) ? 0 : t
  }
  const d = new Date(val)
  const t = d.getTime()
  return isNaN(t) ? 0 : t
}

/**
 * Safely formats any date-like value using date-fns format().
 * If the date is invalid or absent, returns the fallback string without throwing.
 */
export function safeFormatDate(val: any, formatPattern: string, fallback = '—'): string {
  if (!val) return fallback
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (!isValid(d) || isNaN(d.getTime())) return fallback
    return format(d, formatPattern)
  } catch {
    return fallback
  }
}

/**
 * Safely checks if a date-like value is today without throwing.
 */
export function safeIsToday(val: any): boolean {
  if (!val) return false
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (!isValid(d) || isNaN(d.getTime())) return false
    return isToday(d)
  } catch {
    return false
  }
}

/**
 * Safely checks if a date-like value is tomorrow without throwing.
 */
export function safeIsTomorrow(val: any): boolean {
  if (!val) return false
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (!isValid(d) || isNaN(d.getTime())) return false
    return isTomorrow(d)
  } catch {
    return false
  }
}

/**
 * Generates human-friendly interview date labels: "Today", "Tomorrow", or "dd MMM".
 */
export function safeGetInterviewDate(val: any): string {
  if (!val) return 'Upcoming'
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (!isValid(d) || isNaN(d.getTime())) return 'Upcoming'
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'dd MMM')
  } catch {
    return 'Upcoming'
  }
}

/**
 * Safely parses skills from arrays, JSON strings, or PostgreSQL text[] format like "{React,Node}".
 */
export function safeParseSkills(skills: any): string[] {
  if (Array.isArray(skills)) return skills
  if (typeof skills === 'string') {
    const trimmed = skills.trim()
    if (!trimmed || trimmed === '{}') return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Postgres array string "{Skill A,Skill B}" or comma-separated string
      return trimmed
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
    }
  }
  return []
}
