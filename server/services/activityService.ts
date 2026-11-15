import crypto from 'crypto'
import { Request } from 'express'
import { query } from '../db'

export interface ClientInfo {
  device: string
  browser: string
  ip: string
  userAgent: string
}

export function parseClientInfo(req: Request): ClientInfo {
  const ua = req.headers['user-agent'] || ''
  
  // Parse device
  let device = 'Desktop PC'
  if (/windows phone/i.test(ua)) device = 'Windows Phone'
  else if (/win64|win32|windows/i.test(ua)) device = 'Windows PC'
  else if (/ipad/i.test(ua)) device = 'iPad'
  else if (/iphone/i.test(ua)) device = 'iPhone'
  else if (/android/i.test(ua)) device = 'Android'
  else if (/macintosh|mac os x/i.test(ua)) device = 'Mac'
  else if (/linux/i.test(ua)) device = 'Linux PC'

  // Parse browser
  let browser = 'Browser'
  if (/edg([ea]|ios)/i.test(ua)) browser = 'Edge'
  else if (/opr|opera/i.test(ua)) browser = 'Opera'
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'

  // Parse IP safely
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || req.ip || '127.0.0.1'

  return { device, browser, ip, userAgent: ua }
}

/**
 * Record a verified student login event.
 * ONLY called after successful authentication.
 */
export async function recordStudentLogin(userId: string, studentId: string, req: Request): Promise<void> {
  try {
    const client = parseClientInfo(req)
    const activityId = crypto.randomUUID()

    // 1. Insert into student_login_activity table
    await query(
      `INSERT INTO student_login_activity (id, user_id, student_id, login_at, last_active_at, device, browser, ip_address, user_agent)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, $5, $6, $7)`,
      [activityId, userId, studentId, client.device, client.browser, client.ip, client.userAgent]
    ).catch(e => console.warn('[Activity] Notice on activity insert:', e.message))

    // 2. Update profile with last_login_at, last_active_at, and increment login_count
    await query(
      `UPDATE profiles SET
        last_login_at = CURRENT_TIMESTAMP,
        last_active_at = CURRENT_TIMESTAMP,
        login_count = COALESCE(login_count, 0) + 1,
        last_login_device = $1,
        last_login_browser = $2,
        last_login_ip = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [client.device, client.browser, client.ip, userId]
    ).catch(e => console.warn('[Activity] Notice on profile activity update:', e.message))
  } catch (err: any) {
    console.error('[Activity] Failed to record student login:', err)
  }
}

/**
 * Record a student heartbeat to maintain active/online status.
 */
export async function recordStudentHeartbeat(userId: string): Promise<void> {
  try {
    // Update profile last_active_at
    await query(
      `UPDATE profiles SET last_active_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    ).catch(() => {})

    // Update latest activity record last_active_at
    await query(
      `UPDATE student_login_activity SET last_active_at = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id FROM student_login_activity
         WHERE user_id = $1 AND logout_at IS NULL
         ORDER BY login_at DESC LIMIT 1
       )`,
      [userId]
    ).catch(() => {})
  } catch {}
}

/**
 * Record student logout to update session logout_at.
 */
export async function recordStudentLogout(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE profiles SET last_active_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    ).catch(() => {})

    await query(
      `UPDATE student_login_activity SET logout_at = CURRENT_TIMESTAMP, last_active_at = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id FROM student_login_activity
         WHERE user_id = $1 AND logout_at IS NULL
         ORDER BY login_at DESC LIMIT 1
       )`,
      [userId]
    ).catch(() => {})
  } catch {}
}
