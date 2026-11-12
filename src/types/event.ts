export enum EventStatus {
  OPEN = 'open',
  ALMOST_FULL = 'almost_full',
  CLOSED = 'closed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Event {
  id: string
  title: string
  description: string
  date: Date
  endDate: Date
  time: string
  venue: string
  meetingLink: string
  organizer: string
  maxParticipants: number
  registeredCount: number
  registrationDeadline: Date
  status: EventStatus
  imageURL: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface EventRegistration {
  id: string
  eventId: string
  studentId: string
  registeredAt: Date
  status: 'registered' | 'cancelled' | 'attended'
}
