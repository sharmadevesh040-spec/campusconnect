export enum EventStatus {
  OPEN = 'Open',
  ALMOST_FULL = 'Almost Full',
  CLOSED = 'Closed',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Event {
  id: string
  title: string
  description: string
  date: Date
  endDate?: Date
  time: string
  venue: string
  meetingLink?: string
  organizer: string
  maxParticipants?: number
  maxCapacity?: number
  registeredCount: number
  registrationDeadline: Date
  status: EventStatus
  isRegistered?: boolean
  bannerURL?: string
  imageURL?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface EventRegistration {
  id: string
  eventId: string
  studentId: string
  registeredAt: Date
  status: 'Registered' | 'Cancelled' | 'Attended'
}
