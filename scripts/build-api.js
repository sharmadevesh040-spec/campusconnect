import * as esbuild from 'esbuild'
import fs from 'fs'

async function build() {
  console.log('📦 Bundling single authoritative serverless API for Vercel deployment...')
  
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true })
  }

  // Remove any conflicting or duplicate handlers
  for (const file of ['api/[...all].js', 'api/[...all].ts', 'api/index.ts']) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  }

  // Bundle Express backend into single authoritative entrypoint: api/index.js
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

  console.log('✅ Single Vercel Serverless API bundled successfully: api/index.js')
}

build().catch(err => {
  console.error('❌ Failed to bundle serverless API:', err)
  process.exit(1)
})
