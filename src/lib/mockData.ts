import { Interview, InterviewStatus, InterviewType } from '@/types/interview'
import { Certificate, CertificateStatus } from '@/types/certificate'
import { Event, EventStatus } from '@/types/event'
import { Task, TaskStatus } from '@/types/task'
import { Announcement, AnnouncementPriority } from '@/types/announcement'
import { AppNotification, NotificationType } from '@/types/notification'
import { Resource, ResourceType } from '@/types/resource'
import { Profile, UserRole } from '@/types/user'

export const SEED_PROFILES: Profile[] = [
  {
    id: 'student-1',
    userId: 'student-1',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    phone: '+1 (555) 234-5678',
    university: 'Stanford University',
    college: 'School of Engineering',
    course: 'B.S. Computer Science',
    branch: 'Artificial Intelligence & Systems',
    year: 3,
    semester: 6,
    studentId: 'STU-2024-8841',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'Public Speaking', 'Community Leadership'],
    bio: 'Passionate student technologist and Google Student Ambassador lead. Excited about building inclusive developer communities and mentorship programs.',
    isApproved: true,
    completionPercentage: 92,
    createdAt: new Date('2026-01-15T09:00:00Z'),
    updatedAt: new Date('2026-11-01T14:30:00Z')
  },
  {
    id: 'admin-1',
    userId: 'admin-1',
    fullName: 'Dr. Sarah Jenkins',
    email: 'admin@campusconnect.edu',
    phone: '+1 (555) 987-6543',
    university: 'Stanford University',
    college: 'Office of Student Programs',
    course: 'Faculty Director',
    branch: 'Student Ambassador Network',
    year: 1,
    semester: 1,
    studentId: 'ADM-1001',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    skills: ['Program Management', 'Mentorship', 'Evaluation', 'Strategic Planning'],
    bio: 'Regional Director for University Ambassador Initiatives across North America.',
    isApproved: true,
    completionPercentage: 100,
    createdAt: new Date('2025-08-01T00:00:00Z'),
    updatedAt: new Date('2026-10-15T00:00:00Z')
  },
  {
    id: 'student-2',
    userId: 'student-2',
    fullName: 'Devon Vance',
    email: 'devon.vance@tech.edu',
    phone: '+1 (555) 345-6789',
    university: 'MIT',
    college: 'EECS',
    course: 'M.Eng Computer Science',
    branch: 'Robotics',
    year: 1,
    semester: 2,
    studentId: 'MIT-2025-0912',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    skills: ['Rust', 'ROS', 'Embedded Systems', 'IoT'],
    bio: 'Robotics researcher and open-source enthusiast.',
    isApproved: true,
    completionPercentage: 85,
    createdAt: new Date('2026-02-10T10:00:00Z'),
    updatedAt: new Date('2026-11-05T12:00:00Z')
  },
  {
    id: 'student-3',
    userId: 'student-3',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@iit.ac.in',
    phone: '+91 98765 43210',
    university: 'IIT Delhi',
    college: 'Department of Computer Science',
    course: 'B.Tech',
    branch: 'CSE',
    year: 4,
    semester: 7,
    studentId: '2023CS10492',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    skills: ['Cloud Computing', 'Go', 'Kubernetes', 'Competitive Programming'],
    bio: 'Aspiring distributed systems engineer and campus hackathon organizer.',
    isApproved: false,
    completionPercentage: 70,
    createdAt: new Date('2026-11-01T08:00:00Z'),
    updatedAt: new Date('2026-11-10T08:00:00Z')
  }
]

export const SEED_INTERVIEWS: Interview[] = [
  {
    id: 'int-101',
    studentId: 'student-1',
    title: 'Google Student Ambassador Final Round',
    organization: 'Google University Programs',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000 + 24 * 60 * 1000), // starts in ~2h 24m
    time: '10:30 AM',
    duration: 45,
    interviewType: InterviewType.ONLINE,
    location: 'Google Meet',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewer: 'Program Coordinator & Senior Dev Advocate',
    instructions: 'Please be in a quiet room with good lighting and have your camera enabled. Prepare a 3-minute pitch describing how you would organize a campus tech festival.',
    status: InterviewStatus.CONFIRMED,
    notes: 'Focus on community impact and event leadership examples.',
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-10T12:00:00Z')
  },
  {
    id: 'int-102',
    studentId: 'student-1',
    title: 'Campus Ambassador Technical Assessment',
    organization: 'Cloud Developer Community',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '02:00 PM',
    duration: 60,
    interviewType: InterviewType.ONLINE,
    location: 'Zoom',
    meetingLink: 'https://zoom.us/j/987654321',
    interviewer: 'Sarah Lin, Regional Lead',
    instructions: 'Review fundamentals of web development and workshop facilitation.',
    status: InterviewStatus.SCHEDULED,
    notes: 'Live demonstration of introductory workshop.',
    createdAt: new Date('2026-11-05T14:00:00Z'),
    updatedAt: new Date('2026-11-08T09:00:00Z')
  },
  {
    id: 'int-103',
    studentId: 'student-1',
    title: 'Regional Ambassador Screening',
    organization: 'Open Source University Network',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    time: '11:00 AM',
    duration: 30,
    interviewType: InterviewType.ONLINE,
    location: 'Google Meet',
    meetingLink: '',
    interviewer: 'David Martinez',
    instructions: 'Preliminary behavioral interview.',
    status: InterviewStatus.SELECTED,
    notes: 'Candidate showed outstanding engagement and initiative.',
    createdAt: new Date('2026-10-20T10:00:00Z'),
    updatedAt: new Date('2026-11-07T16:00:00Z')
  }
]

export const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificateId: 'GSA-2026-000123',
    studentId: 'student-1',
    studentName: 'Alex Morgan',
    programName: 'Google Student Ambassador',
    issueDate: new Date('2026-11-12T00:00:00Z'),
    expiryDate: new Date('2028-11-12T00:00:00Z'),
    pdfURL: '',
    thumbnailURL: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
    status: CertificateStatus.ACTIVE,
    verificationURL: '/verify/GSA-2026-000123',
    issuedBy: 'University Programs Executive Board',
    description: 'In recognition of outstanding student leadership, community mentorship, and dedication to campus tech advocacy.',
    createdAt: new Date('2026-11-12T00:00:00Z'),
    updatedAt: new Date('2026-11-12T00:00:00Z')
  },
  {
    id: 'cert-2',
    certificateId: 'GSA-2026-000456',
    studentId: 'student-1',
    studentName: 'Alex Morgan',
    programName: 'Campus Cloud Computing Leader',
    issueDate: new Date('2026-09-18T00:00:00Z'),
    pdfURL: '',
    thumbnailURL: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&auto=format&fit=crop&q=80',
    status: CertificateStatus.ACTIVE,
    verificationURL: '/verify/GSA-2026-000456',
    issuedBy: 'Cloud Developer Community',
    description: 'Awarded for successfully conducting hands-on cloud labs for over 250 university peers.',
    createdAt: new Date('2026-09-18T00:00:00Z'),
    updatedAt: new Date('2026-09-18T00:00:00Z')
  },
  {
    id: 'cert-3',
    certificateId: 'GSA-2026-000789',
    studentId: 'student-1',
    studentName: 'Alex Morgan',
    programName: 'Ambassador Orientation Honors',
    issueDate: new Date('2026-07-25T00:00:00Z'),
    pdfURL: '',
    thumbnailURL: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&auto=format&fit=crop&q=80',
    status: CertificateStatus.ACTIVE,
    verificationURL: '/verify/GSA-2026-000789',
    issuedBy: 'CampusConnect Foundation',
    description: 'Completed comprehensive leadership, ethics, and community building training curriculum.',
    createdAt: new Date('2026-07-25T00:00:00Z'),
    updatedAt: new Date('2026-07-25T00:00:00Z')
  }
]

export const SEED_EVENTS: Event[] = [
  {
    id: 'ev-1',
    title: 'Global Student Summit 2026',
    description: 'Join thousands of student ambassadors worldwide for keynote sessions, hackathon kickoffs, and networking with industry mentors.',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    time: '10:00 AM - 02:00 PM EST',
    venue: 'Virtual Auditorium & Stage A',
    meetingLink: 'https://campusconnect.live/summit-2026',
    organizer: 'CampusConnect Executive Committee',
    maxParticipants: 1500,
    registeredCount: 1240,
    registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: EventStatus.ALMOST_FULL,
    imageURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    tags: ['Summit', 'Global', 'Keynote', 'Leadership'],
    createdAt: new Date('2026-10-15T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z')
  },
  {
    id: 'ev-2',
    title: 'AI in Education Hands-on Workshop',
    description: 'A deep dive into deploying educational assistive tools and generative models securely on modern web frameworks.',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    time: '04:30 PM - 06:30 PM EST',
    venue: 'Computer Science Building, Hall 101 & Livestream',
    meetingLink: 'https://meet.google.com/ws-ai-2026',
    organizer: 'Developer Student Club',
    maxParticipants: 200,
    registeredCount: 88,
    registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    status: EventStatus.OPEN,
    imageURL: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    tags: ['Workshop', 'Technical', 'AI', 'Coding'],
    createdAt: new Date('2026-10-25T00:00:00Z'),
    updatedAt: new Date('2026-11-05T00:00:00Z')
  },
  {
    id: 'ev-3',
    title: 'Resume & Portfolio Review Night',
    description: 'Senior engineers and talent coordinators provide 1-on-1 feedback on resume formatting, GitHub showcases, and interview readiness.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    time: '06:00 PM - 09:00 PM EST',
    venue: 'Online Breakout Rooms',
    meetingLink: 'https://campusconnect.live/portfolio-night',
    organizer: 'University Relations Team',
    maxParticipants: 80,
    registeredCount: 78,
    registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: EventStatus.ALMOST_FULL,
    imageURL: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    tags: ['Career', 'Mentorship', 'Resume'],
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-09T00:00:00Z')
  }
]

export const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    studentId: 'student-1',
    title: 'Complete Ambassador Orientation Modules',
    description: 'Review the 4 core learning modules on campus communication, code of conduct, and event planning.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: TaskStatus.IN_PROGRESS,
    priority: 'high',
    attachmentURL: '',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-09T00:00:00Z')
  },
  {
    id: 'task-2',
    studentId: 'student-1',
    title: 'Submit Monthly Event Report & Metrics',
    description: 'Upload participant attendance sheet and feedback survey summary for October workshops.',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    status: TaskStatus.PENDING,
    priority: 'medium',
    attachmentURL: '',
    createdAt: new Date('2026-11-05T00:00:00Z'),
    updatedAt: new Date('2026-11-05T00:00:00Z')
  },
  {
    id: 'task-3',
    studentId: 'student-1',
    title: 'Upload Updated Student ID & Verification',
    description: 'Submit proof of current enrollment for the active academic semester.',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: TaskStatus.COMPLETED,
    priority: 'high',
    attachmentURL: '',
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2026-10-20T00:00:00Z'),
    updatedAt: new Date('2026-11-09T00:00:00Z')
  },
  {
    id: 'task-4',
    studentId: 'student-1',
    title: 'Form Study Group for Cloud Certifications',
    description: 'Coordinate with at least 5 peers on campus to register for upcoming exam study cohorts.',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: TaskStatus.PENDING,
    priority: 'low',
    attachmentURL: '',
    createdAt: new Date('2026-11-08T00:00:00Z'),
    updatedAt: new Date('2026-11-08T00:00:00Z')
  }
]

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Interview schedule has been updated for Final Round Candidates',
    content: 'All shortlisted candidates for the Winter Ambassador Cohort should verify their assigned Google Meet interview slots in the Interviews tab. Please ensure your microphone and webcam permissions are tested in advance.',
    priority: AnnouncementPriority.URGENT,
    category: 'Interviews',
    attachmentURL: '',
    isRead: false,
    publishedAt: new Date('2026-11-12T08:00:00Z'),
    targetRoles: ['student'],
    createdAt: new Date('2026-11-12T08:00:00Z'),
    updatedAt: new Date('2026-11-12T08:00:00Z')
  },
  {
    id: 'ann-2',
    title: 'Registration now open: Global Student Summit 2026',
    content: 'We are thrilled to announce that registration is officially open. Seats are filled on a first-come, first-served basis. Attendees will receive digital swag and eligibility for program project grants.',
    priority: AnnouncementPriority.HIGH,
    category: 'Events',
    attachmentURL: '',
    isRead: false,
    publishedAt: new Date('2026-11-10T12:00:00Z'),
    targetRoles: ['student'],
    createdAt: new Date('2026-11-10T12:00:00Z'),
    updatedAt: new Date('2026-11-10T12:00:00Z')
  },
  {
    id: 'ann-3',
    title: 'New Certificate Verification Portal launched',
    content: 'Every certified ambassador now has a unique public verification URL with QR code support. You can link your verification URL directly on LinkedIn or your academic resume.',
    priority: AnnouncementPriority.MEDIUM,
    category: 'Platform Updates',
    attachmentURL: '',
    isRead: true,
    publishedAt: new Date('2026-11-04T15:30:00Z'),
    targetRoles: ['student', 'admin'],
    createdAt: new Date('2026-11-04T15:30:00Z'),
    updatedAt: new Date('2026-11-04T15:30:00Z')
  }
]

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'student-1',
    type: NotificationType.INTERVIEW_REMINDER,
    title: 'Interview tomorrow at 10:30 AM',
    message: 'Your Google Student Ambassador Final Round begins in 2h 24m. Check your instructions and meeting link.',
    isRead: false,
    relatedId: 'int-101',
    relatedType: 'interview',
    createdAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: 'notif-2',
    userId: 'student-1',
    type: NotificationType.NEW_CERTIFICATE,
    title: 'New certificate available',
    message: 'Your Google Student Ambassador Certificate of Participation (GSA-2026-000123) has been issued!',
    isRead: false,
    relatedId: 'cert-1',
    relatedType: 'certificate',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'notif-3',
    userId: 'student-1',
    type: NotificationType.EVENT_REMINDER,
    title: 'Event registration closes soon',
    message: 'Global Student Summit 2026 is almost full. Complete your registration before slots close.',
    isRead: true,
    relatedId: 'ev-1',
    relatedType: 'event',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'notif-4',
    userId: 'student-1',
    type: NotificationType.TASK_DEADLINE,
    title: 'Orientation deadline approaching',
    message: 'Task "Complete Ambassador Orientation Modules" is due in 3 days.',
    isRead: true,
    relatedId: 'task-1',
    relatedType: 'task',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
  }
]

export const SEED_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Ambassador Interview Master Guide 2026',
    description: 'Comprehensive preparation manual including 50+ real questions, STAR model response breakdowns, and presentation rubrics.',
    type: ResourceType.PDF,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    category: 'Interview Preparation',
    thumbnailURL: '',
    tags: ['Interview', 'STAR Method', 'Guide'],
    isPublic: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z')
  },
  {
    id: 'res-2',
    title: 'Tech Resume & Portfolio Template Kit',
    description: 'Clean ATS-friendly resume templates with targeted bullet points for student leaders and developer advocates.',
    type: ResourceType.DOCUMENT,
    url: 'https://docs.google.com',
    category: 'Resume',
    thumbnailURL: '',
    tags: ['Resume', 'Career', 'Portfolio'],
    isPublic: true,
    createdAt: new Date('2026-09-10T00:00:00Z'),
    updatedAt: new Date('2026-10-12T00:00:00Z')
  },
  {
    id: 'res-3',
    title: 'Public Speaking & Workshop Facilitation Masterclass',
    description: '45-minute video walkthrough on commanding student engagement and structuring live coding demonstrations.',
    type: ResourceType.VIDEO,
    url: 'https://www.youtube.com',
    category: 'Communication',
    thumbnailURL: '',
    tags: ['Video', 'Public Speaking', 'Facilitation'],
    isPublic: true,
    createdAt: new Date('2026-10-05T00:00:00Z'),
    updatedAt: new Date('2026-10-20T00:00:00Z')
  },
  {
    id: 'res-4',
    title: 'Official Ambassador Brand & Event Playbook',
    description: 'Standards for hosting campus meetups, promoting student workshops, and adhering to community guidelines.',
    type: ResourceType.PDF,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    category: 'Ambassador Guidelines',
    thumbnailURL: '',
    tags: ['Playbook', 'Guidelines', 'Branding'],
    isPublic: true,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-11-05T00:00:00Z')
  },
  {
    id: 'res-5',
    title: 'Cloud Architecture & Web Fundamentals Syllabus',
    description: 'Curated technical reference for preparing cloud tech talks and beginner dev workshops.',
    type: ResourceType.WEBSITE,
    url: 'https://developer.mozilla.org',
    category: 'Technical',
    thumbnailURL: '',
    tags: ['Cloud', 'Web', 'Technical'],
    isPublic: true,
    createdAt: new Date('2026-09-15T00:00:00Z'),
    updatedAt: new Date('2026-10-30T00:00:00Z')
  },
  {
    id: 'res-6',
    title: 'Frequently Asked Questions (FAQ) for Ambassadors',
    description: 'Answers to stipend allocations, swag requests, certificate credentials, and letter of recommendation policies.',
    type: ResourceType.EXTERNAL_LINK,
    url: 'https://campusconnect.edu/faq',
    category: 'FAQs',
    thumbnailURL: '',
    tags: ['FAQ', 'Support'],
    isPublic: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z')
  }
]
