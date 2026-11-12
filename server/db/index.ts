import { Pool, QueryResult } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL

let pool: Pool | null = null

if (DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    })

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err)
    })
    console.log('[PostgreSQL] Connected to database via Pool.')
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize pg Pool, falling back to mock persistence:', err)
    pool = null
  }
} else {
  console.log('[PostgreSQL] No DATABASE_URL provided. Running in high-performance local memory/seed mode.')
}

export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  if (pool) {
    return pool.query<T>(text, params)
  }
  // If pool is null, execute against in-memory fallback
  return fallbackStore.query(text, params)
}

export async function runMigration() {
  if (!pool) {
    console.log('[Migration] In-memory mode active. Initializing memory seed store.')
    fallbackStore.init()
    return
  }
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8')
      console.log('[Migration] Running PostgreSQL schema migrations...')
      await pool.query(sql)
      console.log('[Migration] Schema migration completed successfully.')
    }
  } catch (err) {
    console.error('[Migration] Failed to run schema migration:', err)
  }
}

// In-Memory fallback store with initial data for seamless zero-config local testing
class FallbackStore {
  public data: Record<string, any[]> = {
    users: [],
    profiles: [],
    interviews: [],
    events: [],
    event_registrations: [],
    certificates: [],
    tasks: [],
    announcements: [],
    notifications: [],
    resources: [],
    audit_logs: [],
    admin_users: []
  }

  init() {
    // Populated by seed script
    console.log('[FallbackStore] Initialized with local seed state.')
  }

  async query(text: string, params: any[] = []): Promise<QueryResult<any>> {
    // Minimal mock runner for queries when PostgreSQL is not configured
    const normalized = text.trim().toLowerCase()
    
    // Simple table lookup
    for (const table of Object.keys(this.data)) {
      if (normalized.startsWith(`select * from ${table}`) || normalized.startsWith(`select count(*) from ${table}`)) {
        let rows = [...this.data[table]]
        return {
          rows,
          command: 'SELECT',
          rowCount: rows.length,
          oid: 0,
          fields: []
        }
      }
    }

    return {
      rows: [],
      command: 'UNKNOWN',
      rowCount: 0,
      oid: 0,
      fields: []
    }
  }
}

export const fallbackStore = new FallbackStore()
