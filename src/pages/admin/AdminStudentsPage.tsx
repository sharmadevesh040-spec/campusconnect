import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Users, Search, CheckCircle, XCircle, Edit3, Shield, Mail,
  Phone, GraduationCap, Plus, RefreshCw, UserCheck
} from 'lucide-react'
import { getAllStudents, updateProfile, approveStudent, disableStudent } from '@/services/studentService'
import type { Profile } from '@/types'
import { toast } from 'sonner'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null)

  const loadStudents = async () => {
    setLoading(true)
    try {
      const data = await getAllStudents()
      setStudents(data)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveStudent(id)
      setStudents(prev => prev.map(s => s.id === id || s.userId === id ? { ...s, isApproved: true } : s))
      toast.success(`${name} has been approved as Ambassador!`)
    } catch {
      toast.error('Failed to update student status')
    }
  }

  const handleDisable = async (id: string, name: string) => {
    try {
      await disableStudent(id)
      setStudents(prev => prev.map(s => s.id === id || s.userId === id ? { ...s, isApproved: false } : s))
      toast.warning(`${name}'s status was revoked`)
    } catch {
      toast.error('Failed to update student status')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingStudent) return
    try {
      await updateProfile(editingStudent.userId || editingStudent.id, editingStudent)
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s))
      toast.success('Student details updated')
      setEditingStudent(null)
    } catch {
      toast.error('Failed to save student details')
    }
  }

  const filtered = students.filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.university && s.university.toLowerCase().includes(search.toLowerCase())) ||
      (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'approved') return matchesSearch && s.isApproved
    if (filter === 'pending') return matchesSearch && !s.isApproved
    return matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Student Ambassadors Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review enrollment applications, verify identities, and manage ambassador statuses
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadStudents} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh List
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, email, university or ID..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-medium">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading student directory...</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="👥" title="No students found" description="Try adjusting your search criteria." />
      ) : (
        <div className="space-y-3">
          {filtered.map(student => (
            <Card key={student.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {student.photoURL ? (
                    <img src={student.photoURL} alt={student.fullName} className="w-full h-full object-cover" />
                  ) : (
                    student.fullName[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{student.fullName}</h3>
                    <Badge variant={student.isApproved ? 'success' : 'warning'}>
                      {student.isApproved ? 'Approved' : 'Pending Approval'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {student.university || 'General University'} · {student.course || 'Ambassador'} · {student.studentId || 'No ID'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setEditingStudent({ ...student })}
                >
                  Edit
                </Button>

                {student.isApproved ? (
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleDisable(student.userId || student.id, student.fullName)}
                  >
                    Revoke
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="success"
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleApprove(student.userId || student.id, student.fullName)}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Student Modal */}
      <Modal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title={`Edit Student: ${editingStudent?.fullName}`}
      >
        {editingStudent && (
          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Full Name</label>
              <Input
                value={editingStudent.fullName}
                onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Email</label>
              <Input
                value={editingStudent.email}
                onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">University</label>
              <Input
                value={editingStudent.university || ''}
                onChange={e => setEditingStudent({ ...editingStudent, university: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Course</label>
                <Input
                  value={editingStudent.course || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Student ID</label>
                <Input
                  value={editingStudent.studentId || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
