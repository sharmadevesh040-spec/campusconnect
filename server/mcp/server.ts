import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  uploadCertificateTool,
  getMyCertificatesTool,
  getCertificateTool,
  deleteCertificateTool,
  verifyCertificateTool
} from './certificateTools'

// Initialize the CampusConnect Certificate MCP Server
export const mcpServer = new McpServer({
  name: 'campusconnect-certificates',
  version: '1.0.0'
})

// 1. Tool: upload_certificate
mcpServer.tool(
  'upload_certificate',
  {
    student_id: z.string().describe('Recipient student ID (e.g. CC20260045) or database user ID'),
    certificate_name: z.string().describe('Certificate title/name (e.g. Google Student Ambassador Certificate)'),
    issue_date: z.string().describe('Date of issuance (YYYY-MM-DD)'),
    certificate_file_base64: z.string().describe('Base64-encoded PDF binary file data'),
    caller_user_id: z.string().optional().describe('Admin user ID issuing the certificate'),
    caller_role: z.string().optional().default('admin').describe('Admin privilege role (admin or super_admin)'),
    certificate_type: z.string().optional().default('Ambassador').describe('Type of certificate'),
    program: z.string().optional().default('CampusConnect Ambassador Program 2026').describe('Academic program'),
    description: z.string().optional().describe('Optional certificate description')
  },
  async ({
    student_id,
    certificate_name,
    issue_date,
    certificate_file_base64,
    caller_user_id,
    caller_role,
    certificate_type,
    program,
    description
  }) => {
    try {
      const res = await uploadCertificateTool({
        student_id,
        certificate_name,
        issue_date,
        certificate_file: certificate_file_base64,
        caller_user_id,
        caller_role,
        certificate_type,
        program,
        description
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res, null, 2)
          }
        ],
        isError: !res.success
      }
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
        isError: true
      }
    }
  }
)

// 2. Tool: get_my_certificates
mcpServer.tool(
  'get_my_certificates',
  {
    authenticated_user_id: z.string().describe("Authenticated student's user ID from current session"),
    caller_role: z.string().optional().default('student').describe('Role of caller')
  },
  async ({ authenticated_user_id, caller_role }) => {
    try {
      const res = await getMyCertificatesTool({
        authenticated_user_id,
        caller_role
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res, null, 2)
          }
        ],
        isError: !res.success
      }
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
        isError: true
      }
    }
  }
)

// 3. Tool: get_certificate
mcpServer.tool(
  'get_certificate',
  {
    certificate_id: z.string().describe('Certificate ID (e.g. CERT-2026-0045) or database UUID'),
    caller_user_id: z.string().describe("Caller's user ID for ownership validation"),
    caller_role: z.string().optional().default('student').describe("Caller's role (student, admin, super_admin)")
  },
  async ({ certificate_id, caller_user_id, caller_role }) => {
    try {
      const res = await getCertificateTool({
        certificate_id,
        caller_user_id,
        caller_role
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res, null, 2)
          }
        ],
        isError: !res.success
      }
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
        isError: true
      }
    }
  }
)

// 4. Tool: delete_certificate
mcpServer.tool(
  'delete_certificate',
  {
    certificate_id: z.string().describe('Certificate ID to delete'),
    caller_user_id: z.string().describe("Admin user's ID authorizing deletion"),
    caller_role: z.string().describe("Admin role ('admin' or 'super_admin')")
  },
  async ({ certificate_id, caller_user_id, caller_role }) => {
    try {
      const res = await deleteCertificateTool({
        certificate_id,
        caller_user_id,
        caller_role
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res, null, 2)
          }
        ],
        isError: !res.success
      }
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
        isError: true
      }
    }
  }
)

// 5. Tool: verify_certificate
mcpServer.tool(
  'verify_certificate',
  {
    certificate_id: z.string().describe('Certificate unique ID to verify')
  },
  async ({ certificate_id }) => {
    try {
      const res = await verifyCertificateTool({
        certificate_id
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res, null, 2)
          }
        ],
        isError: !res.verified
      }
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ verified: false, error: err.message }) }],
        isError: true
      }
    }
  }
)

// Entrypoint: when executed directly in CLI / Stdio mode
if (process.argv[1] && process.argv[1].endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  async function runStdioServer() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
    console.error('CampusConnect Certificate MCP Server running on stdio transport.')
  }
  runStdioServer().catch(err => {
    console.error('Fatal MCP Server error:', err)
    process.exit(1)
  })
}
