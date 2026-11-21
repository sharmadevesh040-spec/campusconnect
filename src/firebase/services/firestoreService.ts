import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config'

export async function getStudentProfileFromFirestore(userId: string) {
  if (!isFirebaseConfigured || !db?.app) return null
  try {
    const docRef = doc(db, 'students', userId)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
    // Try query by user_id
    const q = query(collection(db, 'students'), where('user_id', '==', userId), limit(1))
    const querySnap = await getDocs(q)
    if (!querySnap.empty) {
      const d = querySnap.docs[0]
      return { id: d.id, ...d.data() }
    }
    return null
  } catch (err: any) {
    console.warn('[Firestore] Error getting student profile:', err.message)
    return null
  }
}

export async function getStudentCertificatesFromFirestore(studentIdOrEmail: string) {
  if (!isFirebaseConfigured || !db?.app) return []
  try {
    const q = query(
      collection(db, 'certificates'),
      where('student_id', '==', studentIdOrEmail)
    )
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err: any) {
    console.warn('[Firestore] Error getting certificates:', err.message)
    return []
  }
}

export async function recordStudentLoginActivityFirestore(activity: {
  userId: string
  studentId?: string
  device: string
  browser: string
  ip?: string
}) {
  if (!isFirebaseConfigured || !db?.app) return
  try {
    await addDoc(collection(db, 'loginActivity'), {
      ...activity,
      login_at: serverTimestamp(),
      last_active_at: serverTimestamp(),
      status: 'Online'
    })
  } catch (err: any) {
    console.warn('[Firestore] Error recording login activity:', err.message)
  }
}
