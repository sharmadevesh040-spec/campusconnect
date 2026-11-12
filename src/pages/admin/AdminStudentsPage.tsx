import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Users, Search, CheckCircle, XCircle, Edit3, Shield, Mail,
  Phone, GraduationCap, Plus, RefreshCw, UserCheck, FileUp, Download,
  AlertTriangle, Check
} from 'lucide-react'
import Papa from 'papaparse'
import {
  getAllStudents, updateProfile, approveStudent, disableStudent,
  bulkImportStudents
} from '@/services/studentService'
import type { Profile } from '@/types'
import { toast } from 'sonner'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null)
  
  // Bulk CSV Import State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [parsedData, setParsedData] = useState<{
    total: number
    valid: any[]
    errors: { row: number; error: string; data: any }[]
  } | null>(null)
  const [importing, setImporting] = useState(false)

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

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvContent(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    const rows = result.data as Record<string, string>[]

    const valid: any[] = []
    const errors: { row: number; error: string; data: any }[] = []

    rows.forEach((row, idx) => {
      const name = row.name || row.fullName || row.full_name
      const email = row.email
      const studentId = row.student_id || row.studentId || row.id

      if (!name || !email || !studentId) {
        errors.push({ row: idx + 1, error: 'Missing name, email, or student_id', data: row })
      } else if (!email.includes('@')) {
        errors.push({ row: idx + 1, error: 'Invalid email syntax', data: row })
      } else {
        valid.push({
          name,
          email,
          studentId,
          course: row.course || 'B.Tech',
          branch: row.branch || 'CSE',
          year: parseInt(row.year || '1', 10)
        })
      }
    })

    setParsedData({ total: rows.length, valid, errors })
  }

  const executeBulkImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return
    setImporting(true)
    try {
      const res = await bulkImportStudents(csvContent)
      toast.success(`Successfully imported ${res.importedCount} student accounts! 🎉`)
      setIsBulkModalOpen(false)
      setParsedData(null)
      setCsvContent('')
      loadStudents()
    } catch (err: any) {
      toast.error(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(students.map(s => ({
      name: s.fullName,
      email: s.email,
      student_id: s.studentId,
      course: s.course,
      branch: s.branch,
      year: s.year,
      approved: s.isApproved ? 'yes' : 'no'
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `CampusConnect_Students_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Student Ambassadors Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student records, perform bulk CSV onboarding, and configure ambassador credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsBulkModalOpen(true)} leftIcon={<FileUp className="w-4 h-4 text-blue-500" />}>
            Bulk CSV Import
          </Button>
          <Button size="sm" variant="outline" onClick={loadStudents} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-400 font-medium">Total Registered</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{students.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-400 font-medium">Approved Leaders</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{students.filter(s => s.isApproved).length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-400 font-medium">Pending Review</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{students.filter(s => !s.isApproved).length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-400 font-medium">Avg Completion</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {students.length ? Math.round(students.reduce((acc, s) => acc + (s.completionPercentage || 0), 0) / students.length) : 0}%
          </p>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, student ID, university..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>All ({students.length})</Button>
          <Button size="sm" variant={filter === 'approved' ? 'primary' : 'ghost'} onClick={() => setFilter('approved')}>Approved</Button>
          <Button size="sm" variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>Pending</Button>
        </div>
      </Card>

      {/* Student List */}
      <div className="grid gap-3">
        {filtered.map(student => (
          <Card key={student.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center flex-shrink-0">
                {student.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{student.fullName}</span>
                  <Badge variant={student.isApproved ? 'green' : 'amber'} className="text-[10px]">
                    {student.isApproved ? 'Approved Ambassador' : 'Pending Approval'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>
                  <span>•</span>
                  <span>{student.course} — {student.branch} (Yr {student.year})</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">ID: {student.studentId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button size="sm" variant="ghost" onClick={() => setEditingStudent(student)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                Edit
              </Button>
              {student.isApproved ? (
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDisable(student.userId || student.id, student.fullName)}>
                  Revoke
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => handleApprove(student.userId || student.id, student.fullName)} leftIcon={<UserCheck className="w-3.5 h-3.5" />}>
                  Approve
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            title="No students found"
            description="No student ambassadors matched your search criteria."
            actionLabel="Clear Filter"
            onAction={() => { setSearch(''); setFilter('all'); }}
          />
        )}
      </div>

      {/* Bulk CSV Import Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Student Onboarding via CSV">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload or paste a standard CSV with columns: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 font-mono">name,email,student_id,course,branch,year</code>.
          </p>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
            <FileUp className="w-8 h-8 text-blue-500 mx-auto" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Choose a CSV file from your computer</div>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Or Paste CSV Plaintext:</label>
            <textarea
              rows={4}
              placeholder="name,email,student_id,course,branch,year&#10;Rahul Sharma,rahul@email.com,GSA-2026-901,BTech,CSE,2&#10;Aman Gupta,aman@email.com,GSA-2026-902,BTech,IT,1"
              value={csvContent}
              onChange={(e) => { setCsvContent(e.target.value); parseCSV(e.target.value); }}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          {parsedData && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{parsedData.total} students found</span>
                <div className="flex gap-2">
                  <Badge variant="green" className="text-[10px]">{parsedData.valid.length} valid</Badge>
                  {parsedData.errors.length > 0 && (
                    <Badge variant="red" className="text-[10px]">{parsedData.errors.length} errors</Badge>
                  )}
                </div>
              </div>

              {parsedData.errors.length > 0 && (
                <div className="text-[11px] text-red-600 dark:text-red-400 space-y-0.5 max-h-24 overflow-y-auto">
                  {parsedData.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!parsedData || parsedData.valid.length === 0}
              loading={importing}
              onClick={executeBulkImport}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Import {parsedData?.valid.length || 0} Valid Students
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      {editingStudent && (
        <Modal isOpen={Boolean(editingStudent)} onClose={() => setEditingStudent(null)} title="Edit Student Ambassador Profile">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <Input
                value={editingStudent.fullName}
                onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">University</label>
              <Input
                value={editingStudent.university}
                onChange={e => setEditingStudent({ ...editingStudent, university: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Course</label>
                <Input
                  value={editingStudent.course}
                  onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch</label>
                <Input
                  value={editingStudent.branch}
                  onChange={e => setEditingStudent({ ...editingStudent, branch: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingStudent(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
