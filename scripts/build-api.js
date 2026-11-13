import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

async function build() {
  console.log('📦 Bundling serverless functions for Vercel deployment...')
  
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true })
  }

  // Bundle server into api/index.js
  await esbuild.build({
    entryPoints: ['server/vercelHandler.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    outfile: 'api/index.js',
    sourcemap: false,
    minify: false,
  })

  // Also write api/[...all].js identical to api/index.js
  fs.copyFileSync('api/index.js', 'api/[...all].js')

  // Remove .ts files in api/ to avoid extension conflict collisions during Vercel deployment
  if (fs.existsSync('api/index.ts')) {
    fs.unlinkSync('api/index.ts')
  }
  if (fs.existsSync('api/[...all].ts')) {
    fs.unlinkSync('api/[...all].ts')
  }

  console.log('✅ Serverless API bundled successfully: api/index.js & api/[...all].js')
}

build().catch(err => {
  console.error('❌ Failed to bundle serverless API:', err)
  process.exit(1)
})
