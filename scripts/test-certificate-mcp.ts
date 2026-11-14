import { fallbackStore, runMigration } from '../server/db/index'
import { seedDatabase } from '../server/db/seed'
import {
  uploadCertificateTool,
  getMyCertificatesTool,
  getCertificateTool,
  deleteCertificateTool,
  verifyCertificateTool
} from '../server/mcp/certificateTools'
import fs from 'fs'

async function runAcceptanceTests() {
  console.log('====================================================')
  console.log('  CAMPUSCONNECT CERTIFICATE MCP SYSTEM ACCEPTANCE TEST')
  console.log('====================================================\n')

  // Step 1: Initialize Database & Seed
  console.log('1. Initializing DB and seeding user records...')
  await runMigration()
  await seedDatabase()

  // Verify users exist
  const rahulUser = fallbackStore.data.users.find(u => u.email === 'rahul@campusconnect.edu')
  const amitUser = fallbackStore.data.users.find(u => u.email === 'amit@campusconnect.edu')
  const adminUser = fallbackStore.data.users.find(u => u.email === 'sharmadevesh040@gmail.com')

  if (!rahulUser || !amitUser || !adminUser) {
    throw new Error('Seed failure: Test users (Rahul, Amit, Admin) are not present in the database.')
  }
  console.log('✓ Found Admin (sharmadevesh040@gmail.com)')
  console.log('✓ Found Student A: Rahul Sharma (CC20260045, id: ' + rahulUser.id + ')')
  console.log('✓ Found Student B: Amit Kumar (CC20260046, id: ' + amitUser.id + ')\n')

  // Step 2: Create sample valid PDF buffer
  const samplePdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF'
  )

  // Step 3: Admin uploads certificate for Rahul (CC20260045)
  console.log('2. Admin uploads certificate for Rahul Sharma (CC20260045)...')
  const rahulCertRes = await uploadCertificateTool({
    student_id: 'CC20260045',
    certificate_name: 'Google Student Ambassador Certificate',
    issue_date: '2026-11-14',
    certificate_file: samplePdfBuffer,
    caller_user_id: adminUser.id,
    caller_role: 'super_admin',
    certificate_type: 'Ambassador',
    program: 'Google Student Ambassador 2026'
  })

  if (!rahulCertRes.success || !rahulCertRes.certificate) {
    throw new Error(`Failed to upload Rahul's certificate: ${rahulCertRes.error}`)
  }
  const rahulCert = rahulCertRes.certificate
  console.log(`✓ Rahul's Certificate issued: ID=${rahulCert.certificate_id}`)
  console.log(`✓ Private Storage Path: ${rahulCert.file_path}`)
  console.log(`✓ File Key: ${rahulCert.file_key}`)
  console.log(`✓ Exists on disk: ${fs.existsSync(rahulCert.file_path)}\n`)

  // Step 4: Admin uploads certificate for Amit (CC20260046)
  console.log('3. Admin uploads certificate for Amit Kumar (CC20260046)...')
  const amitCertRes = await uploadCertificateTool({
    student_id: 'CC20260046',
    certificate_name: 'Cloud Architecture Specialist Certificate',
    issue_date: '2026-11-14',
    certificate_file: samplePdfBuffer,
    caller_user_id: adminUser.id,
    caller_role: 'super_admin',
    certificate_type: 'Technical Achievement',
    program: 'Cloud Architecture Cohort 2026'
  })

  if (!amitCertRes.success || !amitCertRes.certificate) {
    throw new Error(`Failed to upload Amit's certificate: ${amitCertRes.error}`)
  }
  const amitCert = amitCertRes.certificate
  console.log(`✓ Amit's Certificate issued: ID=${amitCert.certificate_id}`)
  console.log(`✓ Private Storage Path: ${amitCert.file_path}`)
  console.log(`✓ File Key: ${amitCert.file_key}`)
  console.log(`✓ Exists on disk: ${fs.existsSync(amitCert.file_path)}\n`)

  // Step 5: Test Rahul's View (get_my_certificates)
  console.log('4. Testing get_my_certificates for Rahul Sharma...')
  const rahulMyCerts = await getMyCertificatesTool({
    authenticated_user_id: rahulUser.id,
    caller_role: 'student'
  })

  console.log(`✓ Rahul fetched ${rahulMyCerts.count} certificate(s)`)
  const rahulHasOwn = rahulMyCerts.certificates.some(c => c.certificate_id === rahulCert.certificate_id)
  const rahulHasAmit = rahulMyCerts.certificates.some(c => c.certificate_id === amitCert.certificate_id)

  if (!rahulHasOwn) {
    throw new Error("TEST FAILED: Rahul cannot see his own certificate!")
  }
  if (rahulHasAmit) {
    throw new Error("CRITICAL SECURITY FLAW: Rahul can see Amit's certificate!")
  }
  console.log("✓ PASSED: Rahul sees his own certificate: Google Student Ambassador Certificate")
  console.log("✓ PASSED: Rahul does NOT see Amit's certificate!\n")

  // Step 6: Test Amit's View (get_my_certificates)
  console.log('5. Testing get_my_certificates for Amit Kumar...')
  const amitMyCerts = await getMyCertificatesTool({
    authenticated_user_id: amitUser.id,
    caller_role: 'student'
  })

  console.log(`✓ Amit fetched ${amitMyCerts.count} certificate(s)`)
  const amitHasOwn = amitMyCerts.certificates.some(c => c.certificate_id === amitCert.certificate_id)
  const amitHasRahul = amitMyCerts.certificates.some(c => c.certificate_id === rahulCert.certificate_id)

  if (!amitHasOwn) {
    throw new Error("TEST FAILED: Amit cannot see his own certificate!")
  }
  if (amitHasRahul) {
    throw new Error("CRITICAL SECURITY FLAW: Amit can see Rahul's certificate!")
  }
  console.log("✓ PASSED: Amit sees his own certificate: Cloud Architecture Specialist Certificate")
  console.log("✓ PASSED: Amit does NOT see Rahul's certificate!\n")

  // Step 7: Security Test — Direct Access Attack (Amit attempts to access Rahul's certificate)
  console.log("6. Security Test: Direct ID access attack (Amit attempts to retrieve Rahul's certificate ID)...")
  const attackRes = await getCertificateTool({
    certificate_id: rahulCert.certificate_id,
    caller_user_id: amitUser.id,
    caller_role: 'student'
  })

  if (attackRes.success) {
    throw new Error("CRITICAL SECURITY FLAW: Direct access was NOT rejected! Amit retrieved Rahul's certificate.")
  }
  if (attackRes.statusCode !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden, got ${attackRes.statusCode}`)
  }
  console.log(`✓ PASSED: Direct access attempt strictly rejected with HTTP 403 Forbidden!`)
  console.log(`  Error Message: "${attackRes.error}"\n`)

  // Step 8: Security Test — Student attempts to upload certificate
  console.log("7. Security Test: Unauthorized student attempts to upload a certificate...")
  const studentUploadRes = await uploadCertificateTool({
    student_id: 'CC20260045',
    certificate_name: 'Fake Degree',
    issue_date: '2026-11-14',
    certificate_file: samplePdfBuffer,
    caller_user_id: rahulUser.id,
    caller_role: 'student'
  })

  if (studentUploadRes.success) {
    throw new Error("CRITICAL SECURITY FLAW: Student was allowed to upload a certificate!")
  }
  if (studentUploadRes.statusCode !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden, got ${studentUploadRes.statusCode}`)
  }
  console.log(`✓ PASSED: Student upload rejected with HTTP 403 Forbidden!`)
  console.log(`  Error Message: "${studentUploadRes.error}"\n`)

  // Step 9: Security Test — Student attempts to delete certificate
  console.log("8. Security Test: Unauthorized student attempts to delete a certificate...")
  const studentDeleteRes = await deleteCertificateTool({
    certificate_id: rahulCert.certificate_id,
    caller_user_id: rahulUser.id,
    caller_role: 'student'
  })

  if (studentDeleteRes.success) {
    throw new Error("CRITICAL SECURITY FLAW: Student was allowed to delete a certificate!")
  }
  if (studentDeleteRes.statusCode !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden, got ${studentDeleteRes.statusCode}`)
  }
  console.log(`✓ PASSED: Student delete rejected with HTTP 403 Forbidden!`)
  console.log(`  Error Message: "${studentDeleteRes.error}"\n`)

  // Step 10: Public Verification Check (verify_certificate)
  console.log("9. Testing verify_certificate MCP tool...")
  const verifyRes = await verifyCertificateTool({
    certificate_id: rahulCert.certificate_id
  })

  if (!verifyRes.verified || verifyRes.student_name !== 'Rahul Sharma') {
    throw new Error(`Public verification failed: ${JSON.stringify(verifyRes)}`)
  }
  console.log(`✓ PASSED: Public certificate verified: ID=${verifyRes.certificate_id}, Student=${verifyRes.student_name}, Status=${verifyRes.status}\n`)

  // Step 11: Admin Delete Test
  console.log("10. Testing Admin delete_certificate MCP tool...")
  const deleteRes = await deleteCertificateTool({
    certificate_id: amitCert.certificate_id,
    caller_user_id: adminUser.id,
    caller_role: 'super_admin'
  })

  if (!deleteRes.success) {
    throw new Error(`Admin delete failed: ${deleteRes.error}`)
  }
  console.log(`✓ PASSED: Certificate deleted from DB: ${deleteRes.message}`)

  // Verify it is gone from Amit's view
  const amitCertsAfterDelete = await getMyCertificatesTool({
    authenticated_user_id: amitUser.id,
    caller_role: 'student'
  })
  if (amitCertsAfterDelete.count !== 0) {
    throw new Error("TEST FAILED: Certificate still appeared after admin deletion!")
  }
  console.log("✓ PASSED: Amit now has 0 certificates after admin deletion.\n")

  console.log('====================================================')
  console.log('  ALL 10 ACCEPTANCE & SECURITY TESTS PASSED 100% ✓')
  console.log('====================================================')
}

runAcceptanceTests().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err)
  process.exit(1)
})
