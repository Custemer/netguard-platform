# NetGuard Platform v3.5.1 verification report

Date: 2026-07-22

## Incident reproduced

The live backend returned HTTP 429 for both `/api/health` and `/api/auth/admin-login` with `RateLimit: limit=300, remaining=0`. This proved the failure was the old shared IP quota, not the `admin / admin` form fields.

## Repairs verified

- Essential health, Google OAuth, and administrator recovery routes bypass the shared dashboard quota.
- Administrator recovery still has its own strict failed-attempt limiter.
- Each cryptographically verified JWT receives a separate hashed quota bucket.
- Invalid/fake bearer tokens stay in the IP bucket and cannot bypass throttling.
- The default per-client quota is 3000 requests per 15 minutes and is configurable with `API_RATE_LIMIT_MAX`.
- A live in-process route test exhausted the normal quota, then confirmed health and admin recovery still returned HTTP 200.
- A temporary HTTP 429 or network failure no longer deletes a valid cached dashboard session.
- Failed credential attempts no longer trigger an unnecessary login-page redirect loop.
- Parallel/repeated request failures reuse one visible toast notification.

## Results

- Backend tests: 22/22 passed.
- Chrome extension tests: 10/10 passed.
- React/Vite production build: passed.
- Android/APK/VPN project files: absent.
- Production secrets committed to the package: none detected.

The Chrome extension remains version 3.5.0. The cloud platform/backend hotfix version is 3.5.1.
