import { useState, useEffect } from 'react'
import { User, Mail, Phone, GraduationCap, Edit3, Save, X, Award, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { calculateProfileCompletion } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const completion = calculateProfileCompletion(userProfile || {})

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    university: '',
    college: '',
    course: '',
    branch: '',
    year: 1,
    semester: 1,
    studentId: '',
    bio: '',
    skills: ''
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        university: userProfile.university || '',
        college: userProfile.college || '',
        course: userProfile.course || '',
        branch: userProfile.branch || '',
        year: userProfile.year || 1,
        semester: userProfile.semester || 1,
        studentId: userProfile.studentId || '',
        bio: userProfile.bio || '',
        skills: userProfile.skills?.join(', ') || ''
      })
    }
  }, [userProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    setSaving(true)
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : []
      await updateUserProfile({
        ...formData,
        year: Number(formData.year) || 1,
        semester: Number(formData.semester) || 1,
        skills: skillsArray,
        completionPercentage: calculateProfileCompletion({
          ...userProfile,
          ...formData,
          skills: skillsArray
        })
      })
      toast.success('Profile updated successfully!')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your university information and ambassador credentials</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <Button variant="ghost" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>

      {/* Profile completion */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Profile Completion</span>
            <p className="text-xs text-slate-400 mt-0.5">A complete profile increases verification trust score</p>
          </div>
          <span className={`text-base font-bold ${completion >= 80 ? 'text-emerald-500' : completion >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {completion}%
          </span>
        </div>
        <Progress value={completion} color={completion >= 80 ? 'green' : completion >= 50 ? 'amber' : 'red'} />
      </Card>

      {/* Avatar & Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/30 text-white font-bold text-3xl shadow-md">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.fullName} className="w-full h-full object-cover" />
              ) : (
                (userProfile?.fullName || 'U')[0].toUpperCase()
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{userProfile?.fullName || 'Student'}</h2>
              {userProfile?.isApproved && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified Ambassador
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{userProfile?.email}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {userProfile?.university || 'University Member'} · {userProfile?.course || 'Ambassador Program'}
            </p>
            {userProfile?.studentId && (
              <p className="text-xs text-slate-400 font-mono mt-1">Student ID: {userProfile.studentId}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {userProfile?.bio && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About Me</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{userProfile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {userProfile?.skills && userProfile.skills.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills & Specializations</h3>
            <div className="flex flex-wrap gap-1.5">
              {userProfile.skills.map((s: string) => (
                <Badge key={s} variant="primary" className="text-xs py-1">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Editing Form or View Mode */}
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-5 space-y-4 text-left">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Personal Information</h3>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
            <Textarea
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
            <Input
              label="Skills (comma-separated)"
              placeholder="React, TypeScript, Public Speaking..."
              value={formData.skills}
              onChange={e => setFormData({ ...formData, skills: e.target.value })}
            />
          </Card>

          <Card className="p-5 space-y-4 text-left">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Academic & University Details</h3>
            <Input
              label="University"
              placeholder="Stanford University"
              value={formData.university}
              onChange={e => setFormData({ ...formData, university: e.target.value })}
            />
            <Input
              label="College / Institute"
              placeholder="School of Engineering"
              value={formData.college}
              onChange={e => setFormData({ ...formData, college: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Course"
                placeholder="B.S. Computer Science"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
              />
              <Input
                label="Branch"
                placeholder="Artificial Intelligence"
                value={formData.branch}
                onChange={e => setFormData({ ...formData, branch: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                min={1}
                max={6}
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
              />
              <Input
                label="Semester"
                type="number"
                min={1}
                max={12}
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
              />
            </div>
            <Input
              label="Student ID"
              placeholder="STU-2024-XXXX"
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value })}
            />
          </Card>

          <Button type="submit" className="w-full" loading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </form>
      ) : (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Academic Credentials</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'University', value: userProfile?.university },
              { label: 'College / School', value: userProfile?.college },
              { label: 'Degree / Course', value: userProfile?.course },
              { label: 'Branch / Major', value: userProfile?.branch },
              { label: 'Academic Year', value: userProfile?.year ? `Year ${userProfile.year}` : null },
              { label: 'Semester', value: userProfile?.semester ? `Semester ${userProfile.semester}` : null },
              { label: 'Student ID', value: userProfile?.studentId },
              { label: 'Contact Phone', value: userProfile?.phone },
            ].map(item => item.value ? (
              <div key={item.label}>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{item.value}</p>
              </div>
            ) : null)}
          </div>
        </Card>
      )}
    </div>
  )
}
