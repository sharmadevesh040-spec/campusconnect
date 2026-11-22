export enum UserRole {
  STUDENT = 'student',
  MEMBER = 'member',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface User {
  id: string
  uid?: string
  email: string
  role: UserRole
  name?: string
  firstLogin?: boolean
  status?: 'active' | 'disabled'
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
  firstLogin?: boolean
  status?: 'active' | 'disabled'
  createdAt: Date
  updatedAt: Date
}
