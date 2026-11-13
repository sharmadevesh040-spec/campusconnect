import app from '../server/index'

export default function handler(req: any, res: any) {
  // If Vercel rewrote the URL, restore original request path so Express route handlers match
  const matched = req.headers['x-matched-path'] || req.headers['x-forwarded-url'] || req.headers['x-now-route-matches']
  if (matched && typeof matched === 'string' && matched.startsWith('/api') && req.url !== matched) {
    req.url = matched
  } else if ((req.url === '/api' || req.url === '/' || req.url === '/api/') && req.query?.all) {
    const subpath = Array.isArray(req.query.all) ? req.query.all.join('/') : req.query.all
    req.url = `/api/${subpath}`
  }
  return app(req, res)
}
