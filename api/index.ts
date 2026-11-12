import app from '../server/index'

export default function handler(req: any, res: any) {
  // If Vercel passed rewrite, ensure original URL is preserved
  const matched = req.headers['x-matched-path']
  if (matched && typeof matched === 'string' && matched.startsWith('/api') && req.url !== matched) {
    req.url = matched
  }
  return app(req, res)
}
