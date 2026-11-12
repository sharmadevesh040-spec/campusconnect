import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { runMigration } from './db'
import { seedDatabase } from './db/seed'
import authRoutes from './routes/auth'
import studentRoutes from './routes/student'
import adminRoutes from './routes/admin'
import publicRoutes from './routes/public'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logger & Vercel path normalizer
app.use((req, _res, next) => {
  const matched = req.headers['x-matched-path'] as string
  if (matched && matched.startsWith('/api') && req.url !== matched) {
    req.url = matched
  }
  if (!req.path.startsWith('/api/health')) {
    console.log(`[API] ${req.method} ${req.path}`)
  }
  next()
})

// Ensure DB migrations & seed run before handling any request (critical for Vercel serverless cold starts)
let initPromise: Promise<void> | null = null

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await runMigration()
        await seedDatabase()
      } catch (err: any) {
        console.warn('[Init Notice]:', err?.message || err)
      }
    })()
  }
  return initPromise
}

app.use(async (_req, _res, next) => {
  await ensureInitialized()
  next()
})

// Mount API Routes (both with and without /api prefix for Vercel rewrite compatibility)
app.use('/api/auth', authRoutes)
app.use('/auth', authRoutes)

app.use('/api/student', studentRoutes)
app.use('/student', studentRoutes)

app.use('/api/admin', adminRoutes)
app.use('/admin', adminRoutes)

app.use('/api', publicRoutes)
app.use('/', publicRoutes)

// Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]:', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

// Auto-start server in local development
async function start() {
  try {
    await ensureInitialized()

    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 CampusConnect API server running at http://localhost:${PORT}`)
      })
    }
  } catch (err) {
    console.error('Failed to initialize CampusConnect server:', err)
  }
}

start()

export default app
