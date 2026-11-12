import { apiRequest } from './api'
import type { Profile } from '@/types'
import { SEED_PROFILES } from '@/lib/mockData'

const CACHE_KEY = 'campusconnect_students_cache'

export async function getAllStudents(): Promise<Profile[]> {
  try {
    const list = await apiRequest<any[]>('/api/admin/students')
    const mapped: Profile[] = list.map(item => ({
      id: item.id,
      userId: item.id,
      fullName: item.name,
      email: item.email,
      phone: item.phone,
      studentId: item.studentId,
      university: item.university,
      college: item.college,
      course: item.course,
      branch: item.branch,
      year: item.year,
      semester: item.year * 2 - 1,
      skills: ['Ambassador'],
      bio: '',
      photoURL: item.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`,
      completionPercentage: item.completionPct || 85,
      isApproved: item.isActive,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.createdAt)
    }))
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch (err) {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
    return SEED_PROFILES
  }
}

export async function getProfile(uid: string): Promise<Profile | null> {
  try {
    const p = await apiRequest<any>('/api/student/profile')
    return {
      id: p.id || uid,
      userId: p.user_id || uid,
      fullName: p.full_name,
      email: p.email || '',
      phone: p.phone || '',
      studentId: p.student_id,
      university: p.university,
      college: p.college,
      course: p.course,
      branch: p.branch,
      year: p.year,
      semester: p.semester,
      skills: p.skills || [],
      bio: p.bio || '',
      photoURL: p.avatar_url || '',
      completionPercentage: p.completion_pct || 85,
      isApproved: p.is_active ?? true,
      createdAt: new Date(p.created_at || Date.now()),
      updatedAt: new Date(p.updated_at || Date.now())
    }
  } catch {
    const all = await getAllStudents()
    return all.find(s => s.userId === uid || s.id === uid) || all[0] || null
  }
}

export async function updateProfile(uid: string, profile: Partial<Profile>): Promise<void> {
  await apiRequest('/api/student/profile', {
    method: 'PUT',
    body: JSON.stringify({
      phone: profile.phone,
      university: profile.university,
      college: profile.college,
      course: profile.course,
      branch: profile.branch,
      year: profile.year,
      semester: profile.semester,
      skills: profile.skills,
      bio: profile.bio
    })
  })
}

export async function approveStudent(uid: string): Promise<void> {
  await apiRequest(`/api/admin/students/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: true })
  })
}

export async function disableStudent(uid: string): Promise<void> {
  await apiRequest(`/api/admin/students/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: false })
  })
}

export async function bulkImportStudents(csvData: string): Promise<{
  total: number
  validCount: number
  importedCount: number
  errors: any[]
}> {
  return apiRequest('/api/admin/students/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ csvData })
  })
}
