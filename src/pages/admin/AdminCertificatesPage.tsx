import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Award, Plus, ShieldCheck, QrCode, Search,
  Download, Eye, Edit3, Trash2, FileUp, RefreshCw, XCircle, CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import QRCode from 'qrcode'
import {
  getAllCertificates, createCertificate, updateCertificate,
  replaceCertificatePdf, deleteCertificate, downloadCertificate,
  getCertificateViewBlobUrl
} from '@/services/certificateService'
import { getAllStudents } from '@/services/studentService'
import { generateCertificateId } from '@/lib/utils'
import type { Certificate, Profile } from '@/types'
import { CertificateStatus } from '@/types/certificate'
import { toast } from 'sonner'

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCertQR, setSelectedCertQR] = useState<{ id: string; qr: string; name: string } | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Selected item for actions
  const [activeCert, setActiveCert] = useState<Certificate | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replaceFile, setReplaceFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Issue Form state
  const [issueForm, setIssueForm] = useState({
    studentId: '',
    title: 'Google Student Ambassador Certificate',
    type: 'Ambassador',
    programName: 'Google Student Ambassador Program 2026',
    issueDate: new Date().toISOString().split('T')[0],
    description: 'Awarded for extraordinary community leadership, inclusive tech workshops, and peer mentorship.'
  })

  // Edit Form state
  const [editForm, setEditForm] = useState({
    title: '',
    type: 'Ambassador',
    programName: '',
    issueDate: '',
    description: '',
    status: 'Valid'
  })

  const loadData = async (queryParam?: string) => {
    setLoading(true)
    try {
      const [certs, stus] = await Promise.all([
        getAllCertificates(queryParam !== undefined ? queryParam : search),
        getAllStudents()
      ])
      setCertificates(certs)
      setStudents(stus)
      if (stus.length > 0 && !issueForm.studentId) {
        setIssueForm(prev => ({ ...prev, studentId: stus[0].userId || stus[0].id }))
      }
    } catch {
      toast.error('Failed to load certificates from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Search on Enter or debounced
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData(search)
  }

  // Handle Create / Issue
  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueForm.studentId || !issueForm.title) {
      toast.error('Please select a student and enter certificate title')
      return
    }

    setIsSubmitting(true)
    try {
      const targetStudent = students.find(s => s.userId === issueForm.studentId || s.id === issueForm.studentId)
      await createCertificate({
        studentId: issueForm.studentId,
        title: issueForm.title,
        type: issueForm.type,
        programName: issueForm.programName || issueForm.title,
        issueDate: issueForm.issueDate,
        description: issueForm.description,
        file: selectedFile || undefined
      })

      toast.success(`Certificate issued successfully to ${targetStudent?.fullName || 'student'}! 🎉`)
      setIsIssueModalOpen(false)
      setSelectedFile(null)
      setIssueForm({
        studentId: students[0]?.userId || students[0]?.id || '',
        title: 'Google Student Ambassador Certificate',
        type: 'Ambassador',
        programName: 'Google Student Ambassador Program 2026',
        issueDate: new Date().toISOString().split('T')[0],
        description: 'Awarded for extraordinary community leadership, inclusive tech workshops, and peer mentorship.'
      })
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEdit = (cert: Certificate) => {
    setActiveCert(cert)
    setEditForm({
      title: cert.title || cert.programName,
      type: cert.type || 'Participation',
      programName: cert.programName,
      issueDate: cert.issueDate instanceof Date ? cert.issueDate.toISOString().split('T')[0] : String(cert.issueDate).split('T')[0],
      description: cert.description || '',
      status: cert.status || 'Valid'
    })
    setIsEditModalOpen(true)
  }

  // Handle Edit Save
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCert) return

    setIsSubmitting(true)
    try {
      await updateCertificate(activeCert.id, {
        title: editForm.title,
        type: editForm.type,
        program: editForm.programName,
        issueDate: editForm.issueDate,
        description: editForm.description,
        status: editForm.status
      })
      toast.success('Certificate details updated successfully')
      setIsEditModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Replace File Modal
  const openReplace = (cert: Certificate) => {
    setActiveCert(cert)
    setReplaceFile(null)
    setIsReplaceModalOpen(true)
  }

  // Handle Replace File
  const handleReplaceSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCert || !replaceFile) {
      toast.error('Please select a replacement PDF file')
      return
    }

    setIsSubmitting(true)
    try {
      await replaceCertificatePdf(activeCert.id, replaceFile)
      toast.success(`PDF replaced for certificate ${activeCert.certificateId}`)
      setIsReplaceModalOpen(false)
      setReplaceFile(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to replace PDF')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Delete Modal
  const openDelete = (cert: Certificate) => {
    setActiveCert(cert)
    setIsDeleteModalOpen(true)
  }

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!activeCert) return

    setIsSubmitting(true)
    try {
      await deleteCertificate(activeCert.id)
      toast.success(`Certificate ${activeCert.certificateId} permanently deleted`)
      setIsDeleteModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preview Certificate
  const handleView = async (cert: Certificate) => {
    try {
      toast.loading('Loading certificate preview...', { id: 'view' })
      const url = await getCertificateViewBlobUrl(cert.id)
      toast.dismiss('view')
      setPreviewBlobUrl(url)
      setPreviewTitle(`${cert.title || cert.programName} — ${cert.studentName}`)
    } catch {
      toast.error('Unable to open certificate preview', { id: 'view' })
    }
  }

  // Show QR Modal
  const showQRModal = async (c: Certificate) => {
    const url = `${window.location.origin}/verify/${c.certificateId}`
    const qrData = await QRCode.toDataURL(url, { width: 300 })
    setSelectedCertQR({ id: c.certificateId, qr: qrData, name: c.studentName })
  }

  // Filter client-side as well for instant responsiveness
  const filtered = certificates.filter(c => {
    const q = search.toLowerCase()
    return (
      c.certificateId.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      (c.studentCode && c.studentCode.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.programName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Certificate Management & Issuance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Issue, update, replace, and audit cryptographically verified certificates linked directly to PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => loadData()} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsIssueModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Issue Certificate
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search certificates by student name, student ID, certificate ID, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </form>

      {/* Certificate List */}
      <div className="grid gap-3">
        {filtered.map((cert) => (
          <Card key={cert.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{cert.studentName}</span>
                  {cert.studentCode && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {cert.studentCode}
                    </span>
                  )}
                  <Badge variant={cert.status === 'Valid' || cert.status === CertificateStatus.ACTIVE ? 'green' : 'red'} className="text-[10px]">
                    {cert.status}
                  </Badge>
                  {cert.type && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {cert.type}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {cert.title || cert.programName}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{cert.certificateId}</span>
                  <span>•</span>
                  <span>Issued: {format(new Date(cert.issueDate), 'dd MMM yyyy')}</span>
                  {cert.studentEmail && (
                    <>
                      <span>•</span>
                      <span>{cert.studentEmail}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
              <Button size="sm" variant="ghost" onClick={() => handleView(cert)} leftIcon={<Eye className="w-3.5 h-3.5" />}>
                View
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadCertificate(cert.id, cert.studentName, cert.title || cert.programName)} leftIcon={<Download className="w-3.5 h-3.5" />}>
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => showQRModal(cert)} leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                QR
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(cert)} title="Edit details" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openReplace(cert)} title="Replace PDF file" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDelete(cert)} title="Delete record">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && !loading && (
          <EmptyState
            title="No certificates found"
            description={search ? `No certificates match "${search}". Try another query or clear filter.` : "No certificates issued yet. Click Issue Certificate to award credentials."}
            actionLabel="Issue Certificate"
            onAction={() => setIsIssueModalOpen(true)}
          />
        )}
      </div>

      {/* 1. ISSUE CERTIFICATE MODAL */}
      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Official Verified Certificate">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">1. Select Registered Student</label>
            <select
              value={issueForm.studentId}
              onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.userId || s.id}>
                  {s.fullName} ({s.studentId || 'ID Pending'}) — {s.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">2. Certificate Title / Name</label>
              <Input
                required
                placeholder="e.g. Google Student Ambassador Certificate"
                value={issueForm.title}
                onChange={e => setIssueForm({ ...issueForm, title: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">3. Certificate Type</label>
              <select
                value={issueForm.type}
                onChange={e => setIssueForm({ ...issueForm, type: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="Ambassador">Ambassador</option>
                <option value="Participation">Participation</option>
                <option value="Excellence">Excellence</option>
                <option value="Completion">Completion</option>
                <option value="Leadership">Leadership</option>
                <option value="Merit">Merit</option>
                <option value="Honor">Honor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">4. Program Name</label>
              <Input
                required
                placeholder="Google Student Ambassador Program 2026"
                value={issueForm.programName}
                onChange={e => setIssueForm({ ...issueForm, programName: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">5. Issue Date</label>
              <Input
                type="date"
                required
                value={issueForm.issueDate}
                onChange={e => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">6. Optional Description / Citation</label>
            <textarea
              rows={2}
              placeholder="Citation text describing student accomplishment..."
              value={issueForm.description}
              onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">7. Upload Certificate PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Select student's PDF certificate to upload to secure storage. If omitted, a verified digital certificate PDF will be generated dynamically.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting}>
              Issue & Notify Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. EDIT CERTIFICATE METADATA MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Certificate Metadata">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certificate Title</label>
            <Input
              required
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certificate Type</label>
              <select
                value={editForm.type}
                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="Ambassador">Ambassador</option>
                <option value="Participation">Participation</option>
                <option value="Excellence">Excellence</option>
                <option value="Completion">Completion</option>
                <option value="Leadership">Leadership</option>
                <option value="Merit">Merit</option>
                <option value="Honor">Honor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="Valid">Valid</option>
                <option value="Revoked">Revoked</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Program Name</label>
              <Input
                required
                value={editForm.programName}
                onChange={e => setEditForm({ ...editForm, programName: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Issue Date</label>
              <Input
                type="date"
                required
                value={editForm.issueDate}
                onChange={e => setEditForm({ ...editForm, issueDate: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. REPLACE PDF MODAL */}
      <Modal isOpen={isReplaceModalOpen} onClose={() => setIsReplaceModalOpen(false)} title="Replace Certificate PDF">
        <form onSubmit={handleReplaceSave} className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload a replacement PDF file for certificate <strong className="font-mono text-blue-600">{activeCert?.certificateId}</strong> ({activeCert?.studentName}).
            The existing PDF will be overwritten in secure storage.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select New PDF File</label>
            <input
              type="file"
              accept=".pdf"
              required
              onChange={e => setReplaceFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReplaceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting} disabled={!replaceFile}>
              Upload & Replace
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Certificate Deletion">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to permanently delete certificate <strong className="font-mono text-red-600">{activeCert?.certificateId}</strong> issued to <strong>{activeCert?.studentName}</strong>?
          </p>
          <p className="text-xs text-red-500 font-medium">
            This will permanently remove the record from PostgreSQL and delete the PDF file from storage. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="bg-red-600 text-white hover:bg-red-700 border-red-600" size="sm" loading={isSubmitting} onClick={handleDeleteConfirm}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. PDF PREVIEW MODAL */}
      {previewBlobUrl && (
        <Modal isOpen={Boolean(previewBlobUrl)} onClose={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }} title={previewTitle || 'Certificate Preview'}>
          <div className="space-y-3">
            <div className="w-full h-[500px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100">
              <iframe src={previewBlobUrl} className="w-full h-full" title="PDF Preview" />
            </div>
            <div className="flex justify-end gap-2">
              <a href={previewBlobUrl} download="Certificate.pdf">
                <Button size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Download File
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. QR CODE MODAL */}
      {selectedCertQR && (
        <Modal isOpen={Boolean(selectedCertQR)} onClose={() => setSelectedCertQR(null)} title="Public Verification QR Code">
          <div className="text-center space-y-4 py-2">
            <div className="p-4 bg-white rounded-2xl inline-block shadow-md border border-slate-100 mx-auto">
              <img src={selectedCertQR.qr} alt="Certificate QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedCertQR.name}</p>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{selectedCertQR.id}</p>
            </div>
            <p className="text-xs text-slate-500">
              Scanning this QR code directs verifiers to the public cryptographic verification endpoint.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <a href={selectedCertQR.qr} download={`${selectedCertQR.id}_QR.png`}>
                <Button size="sm" leftIcon={<Download className="w-4 h-4" />}>Download QR Image</Button>
              </a>
              <Button variant="outline" size="sm" onClick={() => window.open(`/verify/${selectedCertQR.id}`, '_blank')}>
                Open Verification Page
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
