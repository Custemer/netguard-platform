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
  const method = String(req.method || '').toUpperCase();
  const path = requestPath(req);
  // The administrator recovery endpoint has its own strict failed-attempt
  // limiter. Keeping it outside the shared quota makes a viva/demo login work
  // even when extension telemetry has consumed the public-IP API allowance.
  if (method === 'POST' && path === '/api/auth/admin-login') return true;
  if (method !== 'GET') return false;
  return path === '/api/health' || GOOGLE_OAUTH_PATHS.has(path);
}

module.exports = { requestPath, skipGlobalApiLimit };
