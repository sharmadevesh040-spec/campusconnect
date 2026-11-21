import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

/**
 * CampusConnect Firebase Configuration
 * Configured with the official campus-connect-60a9f Firebase Project
 * Prioritizes Vite environment variables (VITE_FIREBASE_*) with safe production defaults.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDw2d3amFeLbHAXaIAgY7UreWQOmLZSyMk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-connect-60a9f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-connect-60a9f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-connect-60a9f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "369238821789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:369238821789:web:c4c2fa07ec6f12aecdbd74",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HVM8JRSPH8"
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
)

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let analytics: Analytics | undefined

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Initialize Analytics only in client-side browser environments that support it
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    }).catch(() => {})
  }
} catch (err) {
  console.warn('[Firebase] Client initialization note:', err)
  app = (getApps()[0] || {}) as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
  storage = {} as FirebaseStorage
}

export { app, auth, db, storage, analytics }
export default app
