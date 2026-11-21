/**
 * CampusConnect Database Layer
 * Backed by Google Cloud Firestore (Firebase)
 * Completely eliminates PostgreSQL and connection pool drops.
 */

export {
  query,
  runMigration,
  seedDatabase,
  isFirebaseConfigured,
  firestoreDb,
  firebaseApp,
  firestoreStore,
  firestoreStore as fallbackStore
} from './firestore'

export type {
  FirestoreUser,
  FirestoreStudentProfile,
  FirestoreCertificate,
  FirestoreLoginActivity,
  FirestoreEvent,
  FirestoreEventRegistration,
  FirestoreResource,
  FirestoreNotification
} from './firestore'
