export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  SELECTED = 'selected',
  REJECTED = 'rejected',
  PENDING = 'pending'
}

export enum InterviewType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PHONE = 'phone',
  GROUP = 'group'
}

export interface Interview {
  id: string
  studentId: string
  title: string
  organization: string
  date: Date
  time: string
  duration: number
  interviewType: InterviewType
  location: string
  meetingLink: string
  interviewer: string
  instructions: string
  status: InterviewStatus
  notes: string
  createdAt: Date
  updatedAt: Date
}
