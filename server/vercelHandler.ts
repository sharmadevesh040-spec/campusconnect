import app from './index'

export default function handler(req: any, res: any) {
  // If Vercel rewrote the URL or routed via catch-all, normalize req.url
  const matched = req.headers['x-matched-path'] || req.headers['x-forwarded-url']
  if (matched && typeof matched === 'string' && matched.startsWith('/api') && (req.url === '/api' || req.url === '/' || req.url === '/api/')) {
    req.url = matched
  } else if ((req.url === '/api' || req.url === '/' || req.url === '/api/') && req.query?.all) {
    const subpath = Array.isArray(req.query.all) ? req.query.all.join('/') : req.query.all
    req.url = `/api/${subpath}`
  }
  return app(req, res)
}
