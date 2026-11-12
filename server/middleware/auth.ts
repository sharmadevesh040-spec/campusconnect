import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db'

const JWT_SECRET = process.env.AUTH_SECRET || 'campusconnect-jwt-secret-key-2026'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'student' | 'admin' | 'super_admin'
  studentId?: string
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' })
  }
}

export const AUTHORIZED_ADMIN_EMAIL = 'sharmadevesh040@gmail.com'

export function requireRole(...roles: ('student' | 'admin' | 'super_admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const isAdminRoute = roles.includes('admin') || roles.includes('super_admin')
    if (isAdminRoute) {
      const email = req.user.email?.toLowerCase().trim()
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        res.status(403).json({
          error: `Access Denied: Only the authorized administrator (${AUTHORIZED_ADMIN_EMAIL}) can access the admin portal.`
        })
        return
      }
    }

    if (roles.includes(req.user.role)) {
      next()
    } else {
      res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] role` })
    }
  }
}

/**
 * Record an action into the audit_logs table
 */
export async function logAudit(
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resource, resourceId || null, metadata ? JSON.stringify(metadata) : null, ipAddress || '127.0.0.1']
    )
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err)
  }
}
