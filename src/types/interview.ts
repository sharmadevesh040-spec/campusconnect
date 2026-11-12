export enum InterviewStatus {
  SCHEDULED = 'Scheduled',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  RESCHEDULED = 'Rescheduled',
  CANCELLED = 'Cancelled',
  SELECTED = 'Selected',
  REJECTED = 'Rejected',
  PENDING = 'Pending'
}

export enum InterviewType {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  PHONE = 'Phone',
  HYBRID = 'Hybrid',
  GROUP = 'Group'
}

export interface Interview {
  id: string
  studentId: string
  studentName?: string
  programName?: string
  title?: string
  organization?: string
  date: Date
  time: string
  duration?: number
  type?: InterviewType
  interviewType?: InterviewType
  location?: string
  meetingLink?: string
  interviewer?: string
  interviewerName?: string
  interviewerRole?: string
  interviewerEmail?: string
  instructions?: string
  feedback?: string
  notes?: string
  status: InterviewStatus
  createdAt: Date
  updatedAt: Date
}
