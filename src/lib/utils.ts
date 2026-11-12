import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'
import type { Profile } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

export function formatRelativeTime(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function generateCertificateId(): string {
  const year = new Date().getFullYear()
  const num = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  return `GSA-${year}-${num}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}

export function createICSEvent(params: {
  title: string; description: string; location: string
  startDate: Date; endDate: Date
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusConnect//EN',
    'BEGIN:VEVENT',
    `UID:${generateId()}@campusconnect`,
    `DTSTART:${fmt(params.startDate)}`,
    `DTEND:${fmt(params.endDate)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description}`,
    `LOCATION:${params.location}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n')
}

export function calculateProfileCompletion(profile: Partial<Profile>): number {
  const fields: (keyof Profile)[] = ['fullName','email','phone','university','college','course','branch','year','semester','studentId','photoURL','bio']
  const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '' && profile[f] !== 0).length
  return Math.round((filled / fields.length) * 100)
}
