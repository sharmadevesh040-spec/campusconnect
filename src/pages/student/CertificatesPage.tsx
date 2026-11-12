import { useState } from 'react'
import { Award, Download, ExternalLink, Share2, Shield, Eye, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { useCertificates } from '@/hooks/useCertificates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { CertificateStatus } from '@/types/certificate'
import { toast } from 'sonner'

export default function CertificatesPage() {
  const { certificates, loading, downloadCertificate } = useCertificates()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDownload = async (certId: string, name: string, program: string) => {
    setDownloading(certId)
    try {
      toast.loading('Preparing certificate...', { id: 'download' })
      await new Promise(r => setTimeout(r, 600)) // UX feedback step
      toast.loading('Generating secure download...', { id: 'download' })
      await new Promise(r => setTimeout(r, 500))
      await downloadCertificate(certId)
      toast.success('Certificate ready ✓', {
        id: 'download',
        description: `${name.replace(/\s+/g, '')}_${program.replace(/\s+/g, '_')}_Certificate.svg downloaded`
      })
    } catch {
      toast.error('Download failed. Please try again.', { id: 'download' })
    } finally {
      setDownloading(null)
    }
  }

  const handleShare = async (cert: { certificateId: string; programName: string }) => {
    const url = `${window.location.origin}/verify/${cert.certificateId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: cert.programName, text: `Verify my certificate: ${cert.certificateId}`, url })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Verification link copied to clipboard!')
    }
  }

  const previewCert = preview ? certificates.find(c => c.id === preview) : null

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Certificates</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} available</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <SkeletonCard key={i} />)}</div>
      ) : certificates.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="No certificates yet"
          description="Your certificates will appear here once issued by your student program administrator."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <Card key={cert.id} className="overflow-hidden flex flex-col justify-between">
              {/* Header ribbon */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-200 border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {cert.status}
                  </Badge>
                </div>
                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider mb-1">Certificate of Participation</p>
                <h3 className="text-base font-bold leading-tight">{cert.programName}</h3>
              </div>

              {/* Certificate details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">Recipient</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cert.studentName}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-400">Issued</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{format(cert.issueDate, 'MMMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Certificate ID</p>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{cert.certificateId}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreview(cert.id)}
                    >
                      View Certificate
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      loading={downloading === cert.id}
                      onClick={() => handleDownload(cert.id, cert.studentName, cert.programName)}
                    >
                      Download
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleShare(cert)} title="Share link" aria-label="Share">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1 font-medium"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Open Public Verification Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title={previewCert?.programName || 'Certificate Preview'} size="lg">
        {previewCert && (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-950/20 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <Award className="w-48 h-48" />
              </div>
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-1">CampusConnect Student Hub</p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">CERTIFICATE OF PARTICIPATION</h2>
              <p className="text-xs text-slate-400 mb-4">Presented to</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-300 dark:border-slate-600 pb-1 inline-block px-8">{previewCert.studentName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">{previewCert.description}</p>
              
              <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{previewCert.issuedBy}</p>
                  <p className="text-[10px] text-slate-400">Authorized Program Executive</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-blue-600">
                  {previewCert.certificateId}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                leftIcon={<Download className="w-4 h-4" />}
                loading={downloading === previewCert.id}
                onClick={() => { handleDownload(previewCert.id, previewCert.studentName, previewCert.programName); setPreview(null) }}
              >
                Download Certificate
              </Button>
              <a href={`/verify/${previewCert.certificateId}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full" leftIcon={<QrCode className="w-4 h-4" />}>
                  View Verification URL
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
