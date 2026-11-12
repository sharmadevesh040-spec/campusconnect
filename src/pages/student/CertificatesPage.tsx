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
import { getCertificateViewBlobUrl } from '@/services/certificateService'
import { toast } from 'sonner'

export default function CertificatesPage() {
  const { certificates, loading, downloadCertificate } = useCertificates()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewCert, setPreviewCert] = useState<any | null>(null)

  const handleDownload = async (certId: string, name: string, title: string) => {
    setDownloading(certId)
    try {
      toast.loading('Preparing certificate PDF...', { id: 'download' })
      await downloadCertificate(certId, name, title)
      toast.success('Certificate ready ✓', {
        id: 'download',
        description: 'Your verified PDF certificate was downloaded successfully.'
      })
    } catch {
      toast.error('Download failed. Please try again.', { id: 'download' })
    } finally {
      setDownloading(null)
    }
  }

  const handleView = async (cert: any) => {
    try {
      toast.loading('Loading verified certificate...', { id: 'preview' })
      const url = await getCertificateViewBlobUrl(cert.id)
      toast.dismiss('preview')
      setPreviewBlobUrl(url)
      setPreviewCert(cert)
    } catch {
      toast.error('Unable to view certificate. Please try again.', { id: 'preview' })
    }
  }

  const handleShare = async (cert: { certificateId: string; programName: string; title?: string }) => {
    const url = `${window.location.origin}/verify/${cert.certificateId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: cert.title || cert.programName,
          text: `Verify my certificate on CampusConnect: ${cert.certificateId}`,
          url
        })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Verification link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-500" />
          My Certificates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {certificates.length} verified credential{certificates.length !== 1 ? 's' : ''} issued to your account.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="No certificates yet"
          description="Your verified certificates will appear here once issued by your student program administrator."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <Card key={cert.id} className="overflow-hidden flex flex-col justify-between border border-slate-200 dark:border-slate-800">
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
                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider mb-1">
                  {cert.type || 'Ambassador Credential'}
                </p>
                <h3 className="text-base font-bold leading-tight">
                  {cert.title || cert.programName}
                </h3>
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
                      <p className="text-slate-400">Issue Date</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {format(new Date(cert.issueDate), 'dd MMMM yyyy')}
                      </p>
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
                      onClick={() => handleView(cert)}
                    >
                      View Certificate
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      loading={downloading === cert.id}
                      onClick={() => handleDownload(cert.id, cert.studentName, cert.title || cert.programName)}
                    >
                      Download
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleShare(cert)} title="Share verification link" aria-label="Share">
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
      {previewBlobUrl && (
        <Modal
          isOpen={Boolean(previewBlobUrl)}
          onClose={() => {
            URL.revokeObjectURL(previewBlobUrl)
            setPreviewBlobUrl(null)
          }}
          title={previewCert?.title || previewCert?.programName || 'Certificate Preview'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="w-full h-[520px] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100">
              <iframe src={previewBlobUrl} className="w-full h-full" title="Certificate PDF Viewer" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                Certificate ID: <span className="font-mono font-bold text-blue-600">{previewCert?.certificateId}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    if (previewCert) {
                      handleDownload(previewCert.id, previewCert.studentName, previewCert.title || previewCert.programName)
                    }
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    URL.revokeObjectURL(previewBlobUrl)
                    setPreviewBlobUrl(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
