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
import aiRoutes from './routes/ai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logger
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/health')) {
    console.log(`[API] ${req.method} ${req.path}`)
  }
  next()
})

// Mount API Routes
app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api', publicRoutes)

// Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]:', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

// Auto-start server in local development
async function start() {
  try {
    await runMigration()
    await seedDatabase()

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
