import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465

  const user = (process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'sharmadevesh040@gmail.com').trim()
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '')
  const from = process.env.SMTP_FROM || `CampusConnect <${user}>`

  return { host, port, isSecure, user, pass, from }
}

export function getTransporter(): nodemailer.Transporter {
  const { host, port, isSecure, user, pass } = getSmtpConfig()

  if (!pass) {
    console.warn('[SMTP] No SMTP_PASSWORD or SMTP_PASS configured in environment. Emails will be logged locally.')
    return nodemailer.createTransport({
      jsonTransport: true
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  })
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { from, host, port, user } = getSmtpConfig()
  try {
    const mailer = getTransporter()
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html
    })

    console.log(`[SMTP] Dispatched to ${to} via ${host}:${port} as ${user}`)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error(`[SMTP Error] Delivery failed to ${to} via ${host}:${port}:`, error?.message || error)
    return { success: false, error: error?.message || 'SMTP delivery failed' }
  }
}

function getAppBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5173'
}

// 1. Send Email Verification Code via SMTP
export async function sendVerificationEmail(to: string, code: string, fullName: string = 'Student'): Promise<boolean> {
  const appBase = getAppBaseUrl()
  const verifyLink = `${appBase}/verify-email?email=${encodeURIComponent(to)}&code=${code}`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #3b82f6; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px; font-weight: bold;">
          🎓
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">CampusConnect</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Student Ambassador Hub</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">Verify Your Email Address</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, thank you for joining CampusConnect. Please enter the 6-digit verification code below to activate your student ambassador account.
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #3b82f6; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This code is valid for 15 minutes.</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Verify Email Now &rarr;
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you did not request this email, you can safely ignore it.
      </p>
    </div>
  `

  const res = await sendEmail({
    to,
    subject: `🔐 Your CampusConnect Verification Code: ${code}`,
    html,
    text: `Your CampusConnect verification code is: ${code}. Link: ${verifyLink}`
  })
  return res.success
}

// 2. Send Password Reset Code via SMTP
export async function sendPasswordResetEmail(to: string, code: string, fullName: string = 'User'): Promise<boolean> {
  const appBase = getAppBaseUrl()
  const resetLink = `${appBase}/reset-password?email=${encodeURIComponent(to)}&code=${code}`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #2563eb; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px;">
          🔑
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">Reset Your Password</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0;">CampusConnect Security Notice</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, we received a request to reset your password for your CampusConnect account. Use the code below to proceed:
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #6366f1; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This reset code expires in 15 minutes.</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Reset My Password &rarr;
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `

  const res = await sendEmail({
    to,
    subject: `🔑 CampusConnect Password Reset Code: ${code}`,
    html,
    text: `Your CampusConnect password reset code is: ${code}. Link: ${resetLink}`
  })
  return res.success
}

// 3. Send Login OTP Code via SMTP (Passwordless / 2FA Login)
export async function sendLoginOTPEmail(to: string, otp: string, fullName: string = 'User'): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #10b981; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 24px;">
          🛡️
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 12px 0 4px 0;">One-Time Login Code</h1>
        <p style="color: #64748b; font-size: 13px; margin: 0;">CampusConnect Secure Authentication</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi <strong>${fullName}</strong>, here is your one-time verification passcode to sign in to CampusConnect:
        </p>
        <div style="text-align: center; padding: 16px; background-color: #ffffff; border: 2px dashed #10b981; border-radius: 12px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">This passcode expires in 10 minutes and can only be used once.</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        Never share this code with anyone. CampusConnect staff will never ask for your code.
      </p>
    </div>
  `

  const res = await sendEmail({
    to,
    subject: `🛡️ Your CampusConnect Login Code: ${otp}`,
    html,
    text: `Your CampusConnect one-time login code is: ${otp}`
  })
  return res.success
}

// 4. Send Interview Notification via SMTP
export async function sendInterviewNotificationEmail(to: string, interview: any, studentName: string): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #0f172a; margin-top: 0;">Interview Scheduled: ${interview.title || 'Ambassador Interview'}</h2>
      <p style="color: #475569; font-size: 14px;">Hi ${studentName}, your interview schedule has been confirmed.</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${interview.date}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${interview.time}</p>
        <p style="margin: 4px 0;"><strong>Location/Link:</strong> ${interview.meeting_link || interview.location || 'Online'}</p>
        <p style="margin: 4px 0;"><strong>Interviewer:</strong> ${interview.interviewer || 'Program Coordinator'}</p>
      </div>
      <p style="color: #64748b; font-size: 12px;">Please log in to your CampusConnect dashboard to view details and join.</p>
    </div>
  `

  const res = await sendEmail({
    to,
    subject: `📅 Interview Scheduled: ${interview.title || 'CampusConnect Ambassador'}`,
    html
  })
  return res.success
}
