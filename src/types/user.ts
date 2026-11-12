export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  emailVerified: boolean
}

export interface Profile {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  university: string
  college: string
  course: string
  branch: string
  year: number
  semester: number
  studentId: string
  photoURL: string
  skills: string[]
  bio: string
  isApproved: boolean
  completionPercentage: number
  role?: UserRole
  createdAt: Date
  updatedAt: Date
}
