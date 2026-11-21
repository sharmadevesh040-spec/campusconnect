import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../config'

export async function uploadCertificateToStorage(
  file: File | Blob,
  studentId: string,
  certificateId: string
): Promise<{ fileKey: string; fileUrl: string } | null> {
  if (!isFirebaseConfigured || !storage?.app) return null
  try {
    const safeStudentId = String(studentId).replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeCertId = String(certificateId).replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileKey = `certificates/${safeStudentId}/${safeCertId}.pdf`
    const storageRef = ref(storage, fileKey)

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: 'application/pdf',
      customMetadata: {
        studentId: safeStudentId,
        certificateId: safeCertId,
        uploadedAt: new Date().toISOString()
      }
    })

    const fileUrl = await getDownloadURL(snapshot.ref)
    return { fileKey, fileUrl }
  } catch (err: any) {
    console.error('[Firebase Storage] Upload error:', err.message)
    throw err
  }
}

export async function deleteCertificateFromStorage(fileKey: string): Promise<boolean> {
  if (!isFirebaseConfigured || !storage?.app) return false
  try {
    const storageRef = ref(storage, fileKey)
    await deleteObject(storageRef)
    return true
  } catch (err: any) {
    console.warn('[Firebase Storage] Delete error:', err.message)
    return false
  }
}
