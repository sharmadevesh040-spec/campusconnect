import { firestoreStore, seedDatabase as seedFirestore } from './firestore'

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Seeding Firebase Firestore with authoritative CampusConnect records...')
  await seedFirestore()
  console.log('[Seed] Firestore database initialized successfully.')
}
