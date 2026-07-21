const test = require('node:test');
const assert = require('node:assert/strict');
const { requestPath, skipGlobalApiLimit } = require('../lib/rateLimitPolicy');

function request(method, originalUrl) {
  return { method, originalUrl };
}

test('Google OAuth navigation bypasses the shared API request quota', () => {
  assert.equal(skipGlobalApiLimit(request('GET', '/api/auth/google')), true);
  assert.equal(skipGlobalApiLimit(request('GET', '/api/auth/google?source=login')), true);
  assert.equal(skipGlobalApiLimit(request('GET', '/api/auth/google/callback?code=abc&state=xyz')), true);
  assert.equal(skipGlobalApiLimit(request('GET', '/api/auth/google/failure')), true);
});

test('health checks bypass the shared API quota', () => {
  assert.equal(skipGlobalApiLimit(request('GET', '/api/health')), true);
});

test('normal API and password-auth requests remain globally rate limited', () => {
  assert.equal(skipGlobalApiLimit(request('GET', '/api/dashboard/overview')), false);
  assert.equal(skipGlobalApiLimit(request('POST', '/api/auth/login')), false);
  assert.equal(skipGlobalApiLimit(request('POST', '/api/auth/register')), false);
});

test('requestPath ignores query strings and one trailing slash', () => {
  assert.equal(requestPath(request('GET', '/api/auth/google/?x=1')), '/api/auth/google');
});
