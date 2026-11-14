import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {
  uploadCertificateTool,
  getMyCertificatesTool,
  getCertificateTool,
  deleteCertificateTool,
  verifyCertificateTool
} from '../mcp/certificateTools'
import { getJwtSecret, AuthenticatedUser } from '../middleware/auth'

const router = Router()

/**
 * Helper to optionally authenticate from Bearer token
 */
function getOptionalAuthUser(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const token = authHeader.split(' ')[1]
    return jwt.verify(token, getJwtSecret()) as AuthenticatedUser
  } catch {
    return null
  }
}

/**
 * GET /api/mcp/tools
 * Lists all available MCP tools and their schemas
 */
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    tools: [
      {
        name: 'upload_certificate',
        description: 'Upload and issue a verified certificate for a designated student (Admin only)',
        parameters: {
          type: 'object',
          required: ['student_id', 'certificate_name', 'issue_date', 'certificate_file'],
          properties: {
            student_id: { type: 'string', description: 'Student ID (e.g. CC20260045) or database user ID' },
            certificate_name: { type: 'string', description: 'Certificate title/name' },
            issue_date: { type: 'string', description: 'Date of issuance (YYYY-MM-DD)' },
            certificate_file: { type: 'string', description: 'Base64-encoded PDF or buffer' }
          }
        }
      },
      {
        name: 'get_my_certificates',
        description: "Retrieve all certificates belonging to the authenticated student",
        parameters: {
          type: 'object',
          required: ['authenticated_user_id'],
          properties: {
            authenticated_user_id: { type: 'string', description: "Student's authenticated user ID" }
          }
        }
      },
      {
        name: 'get_certificate',
        description: 'Securely retrieve a certificate by ID with strict ownership validation and signed URL',
        parameters: {
          type: 'object',
          required: ['certificate_id', 'caller_user_id'],
          properties: {
            certificate_id: { type: 'string', description: 'Certificate ID or database UUID' },
            caller_user_id: { type: 'string', description: "Caller's user ID for authorization" }
          }
        }
      },
      {
        name: 'delete_certificate',
        description: 'Delete a certificate from database and private storage (Admin only)',
        parameters: {
          type: 'object',
          required: ['certificate_id', 'caller_user_id', 'caller_role'],
          properties: {
            certificate_id: { type: 'string', description: 'Certificate ID to delete' },
            caller_user_id: { type: 'string', description: 'Admin user ID' },
            caller_role: { type: 'string', description: 'Must be admin or super_admin' }
          }
        }
      },
      {
        name: 'verify_certificate',
        description: 'Publicly verify certificate authenticity and retrieve verification metadata',
        parameters: {
          type: 'object',
          required: ['certificate_id'],
          properties: {
            certificate_id: { type: 'string', description: 'Public certificate ID to verify' }
          }
        }
      }
    ]
  })
})

/**
 * POST /api/mcp/execute
 * Universal MCP tool execution endpoint
 */
router.post('/execute', async (req: Request, res: Response) => {
  const { tool, parameters = {} } = req.body
  const authUser = getOptionalAuthUser(req)

  try {
    switch (tool) {
      case 'upload_certificate': {
        const caller_user_id = parameters.caller_user_id || authUser?.id || 'mcp-caller'
        const caller_role = parameters.caller_role || authUser?.role || 'admin'
        const result = await uploadCertificateTool({
          ...parameters,
          caller_user_id,
          caller_role
        })
        res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
        break
      }

      case 'get_my_certificates': {
        const authenticated_user_id = parameters.authenticated_user_id || authUser?.id
        if (!authenticated_user_id) {
          res.status(401).json({ success: false, error: 'Authentication required: authenticated_user_id missing' })
          return
        }
        const result = await getMyCertificatesTool({
          authenticated_user_id,
          caller_role: parameters.caller_role || authUser?.role || 'student'
        })
        res.status(result.statusCode || 200).json(result)
        break
      }

      case 'get_certificate': {
        const caller_user_id = parameters.caller_user_id || authUser?.id
        if (!caller_user_id) {
          res.status(401).json({ success: false, error: 'Authentication required: caller_user_id missing' })
          return
        }
        const result = await getCertificateTool({
          certificate_id: parameters.certificate_id,
          caller_user_id,
          caller_role: parameters.caller_role || authUser?.role || 'student'
        })
        res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
        break
      }

      case 'delete_certificate': {
        const caller_user_id = parameters.caller_user_id || authUser?.id
        const caller_role = parameters.caller_role || authUser?.role || 'student'
        const result = await deleteCertificateTool({
          certificate_id: parameters.certificate_id,
          caller_user_id: caller_user_id || 'unauthorized',
          caller_role
        })
        res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
        break
      }

      case 'verify_certificate': {
        const result = await verifyCertificateTool({
          certificate_id: parameters.certificate_id
        })
        res.status(result.statusCode || (result.verified ? 200 : 400)).json(result)
        break
      }

      default:
        res.status(404).json({ success: false, error: `MCP Tool '${tool}' not found` })
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal MCP tool execution error' })
  }
})

export default router
