const GOOGLE_OAUTH_PATHS = new Set([
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/auth/google/failure',
]);

function requestPath(req) {
  return String(req.originalUrl || req.url || '')
    .split('?')[0]
    .replace(/\/$/, '') || '/';
}

function skipGlobalApiLimit(req) {
  if (String(req.method || '').toUpperCase() !== 'GET') return false;
  const path = requestPath(req);
  return path === '/api/health' || GOOGLE_OAUTH_PATHS.has(path);
}

module.exports = { requestPath, skipGlobalApiLimit };
