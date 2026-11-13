import { useState } from 'react'
import { Award, Download, ExternalLink, Share2, Shield, Eye, QrCode, ShieldCheck, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { useCertificates } from '@/hooks/useCertificates'
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* ── Lookap Theatrical Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/10 p-6 md:p-8 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="spec-tag"><span className="spec-dot-emerald" /> TAMPER-PROOF REPOSITORY</span>
              <span className="spec-tag">SHA-256 VALIDATED</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>My Verified Credentials</span>
              <Award className="w-6 h-6 text-amber-400" />
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              Official university certificates and program milestones issued to your unique student ID. Every credential carries an immutable cryptographic verification hash.
            </p>
          </div>

          <div className="p-3 bg-white/[0.04] border border-white/10 rounded-2xl text-center sm:text-right flex-shrink-0">
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">STORED VAULT CREDENTIALS</p>
            <p className="text-2xl font-bold text-amber-300 font-mono">{certificates.length}</p>
          </div>
        </div>
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
            <div 
              key={cert.id} 
              className="rounded-3xl bg-[#111115] border border-white/[0.09] overflow-hidden flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-amber-400/30 transition-all duration-200 group"
            >
              {/* Header ribbon */}
              <div className="bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-zinc-900 border-b border-white/[0.08] p-5 text-white relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-400/20 border border-amber-400/30 rounded-2xl flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Award className="w-5 h-5" />
                  </div>
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    <Shield className="w-3 h-3 mr-1" />
                    {cert.status || 'Valid'}
                  </Badge>
                </div>
                <p className="text-[10px] text-amber-200/80 font-mono uppercase tracking-widest mb-1">
                  {cert.type || 'Ambassador Credential'}
                </p>
                <h3 className="text-base font-bold leading-tight text-white group-hover:text-amber-200 transition-colors">
                  {cert.title || cert.programName}
                </h3>
              </div>

              {/* Certificate details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-black/20">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase text-zinc-500">Recipient</p>
                    <p className="text-sm font-semibold text-white">{cert.studentName}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[11px] font-mono uppercase text-zinc-500">Issue Date</p>
                      <p className="font-medium text-zinc-300">
                        {format(new Date(cert.issueDate), 'dd MMMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-mono uppercase text-zinc-500">Certificate ID</p>
                      <p className="font-mono font-bold text-amber-400 tracking-wider">{cert.certificateId}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(cert)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>View Certificate</span>
                    </button>
                    <button
                      type="button"
                      disabled={downloading === cert.id}
                      onClick={() => handleDownload(cert.id, cert.studentName, cert.title || cert.programName)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-b from-[#f5f5f7] via-[#d4d4d8] to-[#9999a1] text-zinc-950 text-xs font-bold shadow-md hover:brightness-105 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloading === cert.id ? 'Exporting...' : 'Download Certificate'}</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleShare(cert)} 
                      title="Share verification link"
                      className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-amber-300/80 hover:text-amber-200 font-mono transition-colors pt-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Open Public QR Verification</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
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
            <div className="w-full h-[520px] border border-zinc-700 rounded-2xl overflow-hidden bg-black/80">
              <iframe src={previewBlobUrl} className="w-full h-full" title="Certificate PDF Viewer" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="text-xs font-mono text-zinc-400">
                CERTIFICATE ID: <span className="font-bold text-amber-400">{previewCert?.certificateId}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="tactile"
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
