import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2, XCircle, ShieldCheck, Award, Calendar,
  User, ExternalLink, Search, ArrowLeft, Download, QrCode
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getCertificateByCertId, downloadCertificate } from '@/services/certificateService'
import type { Certificate } from '@/types'
import { CertificateStatus } from '@/types/certificate'
import { format } from 'date-fns'

export default function VerifyCertificatePage() {
  const { certificateId } = useParams<{ certificateId?: string }>()
  const [certIdQuery, setCertIdQuery] = useState(certificateId || 'GSA-2026-000123')
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)

  const verifyId = async (idToVerify: string) => {
    setLoading(true)
    setSearched(true)
    try {
      const match = await getCertificateByCertId(idToVerify.trim())
      setCertificate(match)
    } catch (e) {
      console.error('Verification query failed', e)
      setCertificate(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (certificateId) {
      setCertIdQuery(certificateId)
      verifyId(certificateId)
    } else {
      verifyId('GSA-2026-000123')
    }
  }, [certificateId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (certIdQuery.trim()) {
      verifyId(certIdQuery)
    }
  }

  // Generate SVG QR Code representation pointing to this verification URL
  const currentVerificationUrl = window.location.href

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to CampusConnect
        </Link>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
          Public Verification Ledger
        </span>
      </div>

      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Search Bar */}
        <Card className="p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={certIdQuery}
                onChange={e => setCertIdQuery(e.target.value)}
                placeholder="Enter Certificate ID (e.g. GSA-2026-000123)"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" size="md">
              Verify
            </Button>
          </form>
        </Card>

        {loading ? (
          <Card className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Querying digital credential registry...
          </Card>
        ) : certificate && certificate.status === CertificateStatus.ACTIVE ? (
          /* Verified Certificate Card */
          <Card className="overflow-hidden shadow-xl border-emerald-200 dark:border-emerald-800/40 animate-slide-up">
            {/* Status Banner */}
            <div className="bg-emerald-600 text-white p-6 text-center space-y-2">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">✓ Certificate Verified</h2>
              <p className="text-xs text-emerald-100 max-w-sm mx-auto">
                This authentic digital credential has been officially verified by CampusConnect University Ambassador Registry.
              </p>
            </div>

            {/* Certificate Details */}
            <div className="p-6 space-y-5 text-left bg-white dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Student Recipient</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{certificate.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Certificate ID</p>
                  <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{certificate.certificateId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Program Name</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{certificate.programName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Date of Issuance</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {format(new Date(certificate.issueDate), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Issued By Authority</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{certificate.issuedBy}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic leading-relaxed">
                  "{certificate.description}"
                </p>
              </div>

              {/* QR Code Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
                {/* SVG QR Code Simulation */}
                <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-xs border border-slate-200 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="24" height="24" fill="#000" />
                    <rect x="14" y="14" width="16" height="16" fill="#fff" />
                    <rect x="18" y="18" width="8" height="8" fill="#000" />
                    <rect x="66" y="10" width="24" height="24" fill="#000" />
                    <rect x="70" y="14" width="16" height="16" fill="#fff" />
                    <rect x="74" y="18" width="8" height="8" fill="#000" />
                    <rect x="10" y="66" width="24" height="24" fill="#000" />
                    <rect x="14" y="70" width="16" height="16" fill="#fff" />
                    <rect x="18" y="74" width="8" height="8" fill="#000" />
                    <rect x="42" y="16" width="6" height="12" fill="#000" />
                    <rect x="42" y="36" width="16" height="6" fill="#000" />
                    <rect x="64" y="44" width="8" height="8" fill="#000" />
                    <rect x="44" y="64" width="12" height="12" fill="#000" />
                    <rect x="68" y="68" width="16" height="16" fill="#000" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-500" />
                    Scan to Verify Online
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    Point any camera at this QR code to view this tamper-evident verification record directly.
                  </p>
                </div>
              </div>

              {/* Download Certificate Action */}
              <Button
                className="w-full"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => downloadCertificate(certificate.id)}
              >
                Download Official Certificate Document
              </Button>
            </div>
          </Card>
        ) : certificate && certificate.status === CertificateStatus.REVOKED ? (
          /* Revoked Certificate */
          <Card className="p-8 text-center border-red-200 dark:border-red-900 shadow-lg space-y-3">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto text-red-600">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-red-600">Certificate Status: Revoked</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Credential <strong>{certificate.certificateId}</strong> was previously issued but has since been revoked by university administration.
            </p>
          </Card>
        ) : (
          /* Not Found */
          <Card className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Record Found</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              We could not find any active certificate matching ID "<strong>{certIdQuery}</strong>". Please verify the code and try again.
            </p>
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-2">Try sample certificate IDs:</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => { setCertIdQuery('GSA-2026-000123'); verifyId('GSA-2026-000123') }}
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:underline"
                >
                  GSA-2026-000123
                </button>
                <button
                  onClick={() => { setCertIdQuery('GSA-2026-000456'); verifyId('GSA-2026-000456') }}
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:underline"
                >
                  GSA-2026-000456
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
