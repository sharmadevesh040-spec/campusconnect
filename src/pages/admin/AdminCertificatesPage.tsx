import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Award, Plus, ShieldCheck, XCircle, ExternalLink, QrCode, Search,
  RefreshCw, FileUp, Download, CheckCircle2, Layers
} from 'lucide-react'
import { format } from 'date-fns'
import QRCode from 'qrcode'
import {
  getAllCertificates, createCertificate, revokeCertificate, downloadCertificate
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedCertQR, setSelectedCertQR] = useState<{ id: string; qr: string; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    certificateId: generateCertificateId(),
    studentId: '',
    programName: 'Google Student Ambassador',
    issuedBy: 'Executive Program Board',
    description: 'Awarded for extraordinary community outreach, inclusive tech workshops, and student mentorship.',
    status: CertificateStatus.ACTIVE
  })

  const [bulkData, setBulkData] = useState({
    programName: 'Campus Ambassador Fall Cohort',
    issuedBy: 'Executive Program Board',
    description: 'Awarded to all eligible cohort participants.'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [certs, stus] = await Promise.all([getAllCertificates(), getAllStudents()])
      setCertificates(certs)
      setStudents(stus)
      if (stus.length > 0 && !formData.studentId) {
        setFormData(prev => ({ ...prev, studentId: stus[0].userId || stus[0].id }))
      }
    } catch {
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const targetStudent = students.find(s => s.userId === formData.studentId || s.id === formData.studentId) || students[0]
      await createCertificate({
        certificateId: formData.certificateId,
        studentId: targetStudent.userId || targetStudent.id,
        studentName: targetStudent.fullName,
        programName: formData.programName,
        issueDate: new Date(),
        pdfURL: '',
        thumbnailURL: '',
        status: CertificateStatus.ACTIVE,
        verificationURL: `/verify/${formData.certificateId}`,
        issuedBy: formData.issuedBy,
        description: formData.description,
        file: selectedFile || undefined
      })
      toast.success(`Certificate ${formData.certificateId} issued to ${targetStudent.fullName}! 🎉`)
      setIsModalOpen(false)
      setSelectedFile(null)
      setFormData(prev => ({ ...prev, certificateId: generateCertificateId() }))
      loadData()
    } catch {
      toast.error('Failed to issue certificate')
    }
  }

  const handleBulkIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (students.length === 0) return
    try {
      for (const s of students.slice(0, 10)) {
        const certId = generateCertificateId()
        await createCertificate({
          certificateId: certId,
          studentId: s.userId || s.id,
          studentName: s.fullName,
          programName: bulkData.programName,
          issueDate: new Date(),
          pdfURL: '',
          thumbnailURL: '',
          status: CertificateStatus.ACTIVE,
          verificationURL: `/verify/${certId}`,
          issuedBy: bulkData.issuedBy,
          description: bulkData.description
        })
      }
      toast.success(`Bulk certificates generated for ${Math.min(students.length, 10)} students! 🎉`)
      setIsBulkModalOpen(false)
      loadData()
    } catch {
      toast.error('Bulk generation failed')
    }
  }

  const handleRevoke = async (id: string, certId: string) => {
    if (!confirm(`Are you sure you want to revoke credential ${certId}?`)) return
    try {
      await revokeCertificate(id)
      setCertificates(prev => prev.map(c => c.id === id || c.certificateId === certId ? { ...c, status: CertificateStatus.REVOKED } : c))
      toast.warning(`Certificate ${certId} revoked`)
    } catch {
      toast.error('Failed to revoke certificate')
    }
  }

  const showQRModal = async (c: Certificate) => {
    const url = `${window.location.origin}/verify/${c.certificateId}`
    const qrData = await QRCode.toDataURL(url, { width: 300 })
    setSelectedCertQR({ id: c.certificateId, qr: qrData, name: c.studentName })
  }

  const filtered = certificates.filter(c =>
    c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.programName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Certificate Authority & Issuance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Issue cryptographically trackable certificates with unique IDs and public QR verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsBulkModalOpen(true)} leftIcon={<Layers className="w-4 h-4 text-purple-500" />}>
            Bulk Issue
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Issue Certificate
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Filter by certificate ID, student name, or program..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((cert) => (
          <Card key={cert.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{cert.studentName}</span>
                  <Badge variant={cert.status === CertificateStatus.ACTIVE ? 'green' : 'red'} className="text-[10px]">
                    {cert.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{cert.certificateId}</span>
                  <span>•</span>
                  <span>{cert.programName}</span>
                  <span>•</span>
                  <span>Issued: {format(new Date(cert.issueDate), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button size="sm" variant="outline" onClick={() => showQRModal(cert)} leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                QR Code
              </Button>
              <Button size="sm" variant="ghost" onClick={() => downloadCertificate(cert.certificateId, cert.studentName, cert.programName)} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Download PDF
              </Button>
              {cert.status === CertificateStatus.ACTIVE && (
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRevoke(cert.id, cert.certificateId)}>
                  Revoke
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            title="No certificates issued"
            description="No certificates match your query. Click Issue Certificate to award credentials."
            actionLabel="Issue First Certificate"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {/* QR Code Modal */}
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
              Scanning this QR code directs anyone to the public verification endpoint.
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

      {/* Issue Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Official Verified Certificate">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Student Ambassador</label>
            <select
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.userId || s.id}>
                  {s.fullName} ({s.studentId}) — {s.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Program / Award Title</label>
            <Input
              required
              value={formData.programName}
              onChange={e => setFormData({ ...formData, programName: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Generated Certificate ID</label>
            <Input
              readOnly
              className="bg-slate-50 dark:bg-slate-800 font-mono text-blue-600 font-bold"
              value={formData.certificateId}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upload Certificate PDF (Optional)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">If not provided, a digitally formatted PDF will be rendered automatically on download.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Issue & Notify Student</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Cohort Certificate Issuance">
        <form onSubmit={handleBulkIssue} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantly generate and issue unique, verified certificates to all active ambassadors in this cohort.
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Program Milestone Name</label>
            <Input
              required
              value={bulkData.programName}
              onChange={e => setBulkData({ ...bulkData, programName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Issuing Board</label>
            <Input
              required
              value={bulkData.issuedBy}
              onChange={e => setBulkData({ ...bulkData, issuedBy: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Generate for {students.length} Students</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
