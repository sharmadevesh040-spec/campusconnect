import { apiRequest } from './api'
import type { Interview } from '@/types'
import { InterviewStatus, InterviewType } from '@/types/interview'
import { SEED_INTERVIEWS } from '@/lib/mockData'

const CACHE_KEY = 'campusconnect_interviews_cache'

function mapInterview(item: any): Interview {
  return {
    id: item.id,
    studentId: item.student_id || item.studentId,
    studentName: item.studentName || 'Student',
    programName: item.organization || item.programName || item.title || 'CampusConnect Ambassador',
    title: item.title || item.programName || 'Interview',
    organization: item.organization || 'CampusConnect Ambassador Program',
    interviewer: item.interviewer || item.interviewerName || 'Program Coordinator',
    interviewerName: item.interviewer || item.interviewerName || 'Program Coordinator',
    interviewerRole: 'Interviewer',
    interviewerEmail: item.studentEmail || '',
    date: new Date(item.date),
    time: item.time,
    duration: item.duration || 45,
    type: (item.type as InterviewType) || InterviewType.ONLINE,
    interviewType: (item.type as InterviewType) || InterviewType.ONLINE,
    location: item.location || 'Online Room',
    meetingLink: item.meeting_link || item.meetingLink,
    status: (item.status as InterviewStatus) || InterviewStatus.SCHEDULED,
    instructions: item.instructions || '',
    feedback: item.feedback,
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now())
  }
}

export async function getInterviews(studentId?: string): Promise<Interview[]> {
  try {
    const data = await apiRequest<any[]>('/api/student/interviews')
    const mapped = data.map(mapInterview)
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return SEED_INTERVIEWS
  }
}

export async function getInterviewsByStudent(studentId: string): Promise<Interview[]> {
  return getInterviews(studentId)
}

export async function getAllInterviews(): Promise<Interview[]> {
  try {
    const data = await apiRequest<any[]>('/api/admin/interviews')
    return data.map(mapInterview)
  } catch {
    return SEED_INTERVIEWS
  }
}

export async function getInterview(id: string): Promise<Interview | null> {
  try {
    const item = await apiRequest<any>(`/api/student/interviews/${id}`)
    return mapInterview(item)
  } catch {
    const all = await getInterviews()
    return all.find(i => i.id === id) || null
  }
}

export async function createInterview(data: any): Promise<string> {
  const res = await apiRequest<any>('/api/admin/interviews', {
    method: 'POST',
    body: JSON.stringify({
      studentId: data.studentId,
      title: data.programName || data.title,
      organization: data.programName || data.organization,
      date: typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0],
      time: data.time,
      duration: data.duration,
      type: data.type || data.interviewType,
      location: data.location,
      meetingLink: data.meetingLink,
      interviewer: data.interviewerName || data.interviewer,
      instructions: data.instructions
    })
  })
  return res.id
}

export async function updateInterview(id: string, data: Partial<Interview>): Promise<void> {
  await apiRequest(`/api/admin/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0]) : undefined,
      time: data.time,
      status: data.status,
      instructions: data.instructions,
      meetingLink: data.meetingLink
    })
  })
}

export async function deleteInterview(id: string): Promise<void> {
  await apiRequest(`/api/admin/interviews/${id}`, { method: 'DELETE' })
}

export async function updateStatus(id: string, status: InterviewStatus): Promise<void> {
  await apiRequest(`/api/admin/interviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
}

export function generateICS(interview: Interview): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = new Date(interview.date)
  const [hours, minutes] = (interview.time || '10:00').replace(/[^0-9:]/g, '').split(':').map(Number)
  const dtStart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hours || 10)}${pad(minutes || 0)}00Z`
  const dtEnd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad((hours || 10) + 1)}${pad(minutes || 0)}00Z`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Student Hub//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${interview.programName || interview.title} Interview`,
    `DESCRIPTION:${interview.instructions || 'CampusConnect Ambassador Interview'}\\nMeeting Link: ${interview.meetingLink || 'N/A'}`,
    `LOCATION:${interview.location || 'Online'}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}
