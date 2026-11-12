import {
  collection, doc, getDocs, addDoc, updateDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { Certificate } from '@/types'
import { CertificateStatus } from '@/types'
import { SEED_CERTIFICATES } from '@/lib/mockData'

const COL = 'certificates'
const STORAGE_KEY = 'campusconnect_certificates'

function getLocalStore(): Certificate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CERTIFICATES))
      return SEED_CERTIFICATES
    }
    const parsed = JSON.parse(raw)
    return parsed.map((item: any) => ({
      ...item,
      issueDate: new Date(item.issueDate),
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  } catch {
    return SEED_CERTIFICATES
  }
}

function saveLocalStore(items: Certificate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save certificates to localStorage', e)
  }
}

function fromFirestore(data: Record<string, unknown>): Certificate {
  return {
    ...data,
    issueDate: data.issueDate instanceof Timestamp ? data.issueDate.toDate() : new Date(data.issueDate as string),
    expiryDate: data.expiryDate instanceof Timestamp ? data.expiryDate.toDate() : data.expiryDate ? new Date(data.expiryDate as string) : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string),
  } as Certificate
}

export async function getCertificatesByStudent(uid: string): Promise<Certificate[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), where('studentId', '==', uid), orderBy('issueDate', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  const all = getLocalStore()
  return all.filter(c => c.studentId === uid || c.studentId === 'student-1')
}

export async function getAllCertificates(): Promise<Certificate[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), orderBy('issueDate', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }))
  }
  return getLocalStore()
}

export async function getCertificateByCertId(certId: string): Promise<Certificate | null> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COL), where('certificateId', '==', certId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return fromFirestore({ id: snap.docs[0].id, ...snap.docs[0].data() })
  }
  const all = getLocalStore()
  return all.find(c => c.certificateId.toLowerCase() === certId.toLowerCase()) || null
}

export async function createCertificate(data: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
  const id = `cert-${Date.now()}`
  const newCert: Certificate = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const all = getLocalStore()
  saveLocalStore([newCert, ...all])
  return id
}

export async function revokeCertificate(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), { status: CertificateStatus.REVOKED, updatedAt: serverTimestamp() })
    return
  }
  const all = getLocalStore()
  const idx = all.findIndex(c => c.id === id)
  if (idx !== -1) {
    all[idx].status = CertificateStatus.REVOKED
    all[idx].updatedAt = new Date()
    saveLocalStore(all)
  }
}

export async function downloadCertificate(certId: string): Promise<void> {
  // Generates and downloads a clean certificate document
  const cert = (await getAllCertificates()).find(c => c.id === certId || c.certificateId === certId)
  if (!cert) throw new Error('Certificate not found')

  // Generate SVG-based high-resolution Certificate and trigger download
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="850" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="770" fill="none" stroke="#e2e8f0" stroke-width="4" rx="20"/>
  <rect x="55" y="55" width="1090" height="740" fill="none" stroke="#3b82f6" stroke-width="2" rx="15" stroke-dasharray="10 5"/>
  
  <text x="600" y="150" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#2563eb" text-anchor="middle" letter-spacing="4">CAMPUSCONNECT STUDENT HUB</text>
  <text x="600" y="210" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="#0f172a" text-anchor="middle">CERTIFICATE OF PARTICIPATION</text>
  <text x="600" y="260" font-family="system-ui, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">THIS IS PROUDLY PRESENTED TO</text>
  
  <text x="600" y="340" font-family="system-ui, sans-serif" font-size="42" font-weight="800" fill="#1e3a8a" text-anchor="middle">${cert.studentName}</text>
  <line x1="300" y1="365" x2="900" y2="365" stroke="#cbd5e1" stroke-width="2"/>
  
  <text x="600" y="420" font-family="system-ui, sans-serif" font-size="20" fill="#334155" text-anchor="middle">For distinguished participation and leadership in the program</text>
  <text x="600" y="470" font-family="system-ui, sans-serif" font-size="32" font-weight="700" fill="#2563eb" text-anchor="middle">${cert.programName}</text>
  
  <text x="600" y="530" font-family="system-ui, sans-serif" font-size="16" fill="#64748b" text-anchor="middle" max-width="800">${cert.description}</text>
  
  <g transform="translate(180, 640)">
    <line x1="0" y1="0" x2="240" y2="0" stroke="#0f172a" stroke-width="1.5"/>
    <text x="120" y="30" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#0f172a" text-anchor="middle">${cert.issuedBy}</text>
    <text x="120" y="50" font-family="system-ui, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Program Executive</text>
  </g>
  
  <g transform="translate(780, 640)">
    <line x1="0" y1="0" x2="240" y2="0" stroke="#0f172a" stroke-width="1.5"/>
    <text x="120" y="30" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#0f172a" text-anchor="middle">${cert.issueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</text>
    <text x="120" y="50" font-family="system-ui, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Date of Issuance</text>
  </g>
  
  <rect x="500" y="690" width="200" height="34" rx="8" fill="#eff6ff" stroke="#bfdbfe"/>
  <text x="600" y="713" font-family="monospace" font-size="13" font-weight="700" fill="#1d4ed8" text-anchor="middle">ID: ${cert.certificateId}</text>
</svg>
`
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanName = cert.studentName.replace(/\s+/g, '')
  const cleanProg = cert.programName.replace(/\s+/g, '_')
  a.href = url
  a.download = `${cleanName}_${cleanProg}_Certificate.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
