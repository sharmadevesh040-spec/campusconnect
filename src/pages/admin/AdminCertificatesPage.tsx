import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Award, Plus, ShieldCheck, XCircle, ExternalLink, QrCode, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import {
  getAllCertificates, createCertificate, revokeCertificate
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
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    certificateId: generateCertificateId(),
    studentId: 'student-1',
    programName: 'Google Student Ambassador',
    issuedBy: 'Executive Program Board',
    description: 'Awarded for extraordinary community outreach, inclusive tech workshops, and student mentorship.',
    status: CertificateStatus.ACTIVE
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [certs, stus] = await Promise.all([getAllCertificates(), getAllStudents()])
      setCertificates(certs)
      setStudents(stus)
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
        description: formData.description
      })
      toast.success(`Certificate ${formData.certificateId} issued to ${targetStudent.fullName}! 🎉`)
      setIsModalOpen(false)
      setFormData(prev => ({ ...prev, certificateId: generateCertificateId() }))
      loadData()
    } catch {
      toast.error('Failed to issue certificate')
    }
  }

  const handleRevoke = async (id: string, certId: string) => {
    if (!confirm(`Are you sure you want to revoke credential ${certId}?`)) return
    try {
      await revokeCertificate(id)
      setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: CertificateStatus.REVOKED } : c))
      toast.warning(`Certificate ${certId} revoked`)
    } catch {
      toast.error('Failed to revoke certificate')
    }
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Issue cryptographically trackable certificates with unique IDs and public QR verification
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormData(prev => ({ ...prev, certificateId: generateCertificateId() }))
            setIsModalOpen(true)
          }}
        >
          Issue Certificate
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Certificate ID (e.g. GSA-2026-000123), student name, or program..."
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading certificate ledger...</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🏆" title="No certificates found" description="Try another search term or click 'Issue Certificate'." />
      ) : (
        <div className="space-y-3">
          {filtered.map(cert => (
            <Card key={cert.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {cert.certificateId}
                  </span>
                  <Badge variant={cert.status === CertificateStatus.ACTIVE ? 'success' : 'danger'}>
                    {cert.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cert.programName}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Recipient: <strong>{cert.studentName}</strong> · Issued on {format(new Date(cert.issueDate), 'dd MMMM yyyy')}
                </p>
                <p className="text-xs text-slate-400 italic line-clamp-1">{cert.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                <a
                  href={`/verify/${cert.certificateId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Verify Page
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {cert.status === CertificateStatus.ACTIVE && (
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleRevoke(cert.id, cert.certificateId)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Verified Certificate"
        size="lg"
      >
        <form onSubmit={handleIssue} className="space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Unique Certificate ID</label>
              <Input
                value={formData.certificateId}
                onChange={e => setFormData({ ...formData, certificateId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Assign Student Recipient</label>
              <select
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {students.map(s => (
                  <option key={s.id} value={s.userId || s.id}>{s.fullName} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Program / Award Name"
            value={formData.programName}
            onChange={e => setFormData({ ...formData, programName: e.target.value })}
            required
          />

          <Input
            label="Issued By Authority"
            value={formData.issuedBy}
            onChange={e => setFormData({ ...formData, issuedBy: e.target.value })}
            required
          />

          <Input
            label="Citation / Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1">
              Issue & Sign Certificate
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
