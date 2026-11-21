import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../config'

export async function firebaseSignIn(email: string, password: string): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured || !auth?.app) {
    return null
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('[Firebase Auth] Sign in error:', error.message)
    throw error
  }
}

export async function firebaseSignUp(email: string, password: string): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured || !auth?.app) {
    return null
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('[Firebase Auth] Sign up error:', error.message)
    throw error
  }
}

export async function firebaseSignOut(): Promise<void> {
  if (!isFirebaseConfigured || !auth?.app) {
    return
  }
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error('[Firebase Auth] Sign out error:', error.message)
    throw error
  }
}

export async function firebaseResetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured || !auth?.app) {
    return
  }
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('[Firebase Auth] Password reset error:', error.message)
    throw error
  }
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured || !auth?.app) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
