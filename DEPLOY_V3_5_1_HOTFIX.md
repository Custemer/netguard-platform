# NetGuard v3.5.1 live hotfix

The live Render backend was still returning the old shared `300 requests / 15 minutes / IP` response. This blocked dashboard actions, health checks, and administrator login together.

## Deploy

1. Upload this package to the existing GitHub repository with `frontend/`, `backend/`, `extension/`, and `render.yaml` at the repository root.
2. In Render, confirm these environment variables:

   ```text
   FRONTEND_URL=https://netguard-platform.vercel.app
   CORS_ORIGINS=https://netguard-platform.vercel.app
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin
   ADMIN_LOGIN_EMAIL=admin@netguard.local
   API_RATE_LIMIT_MAX=3000
   ```

3. In Render, choose **Manual Deploy → Deploy latest commit**. A Render redeploy also clears the old in-memory 429 bucket.
4. Open `https://netguard-platform.onrender.com/api/health`. Do not continue until it returns:

   ```json
   {
     "success": true,
     "version": "3.5.1",
     "adminRecoveryConfigured": true,
     "apiRateLimitPerClient": 3000
   }
   ```

5. In Vercel, verify `VITE_API_URL=https://netguard-platform.onrender.com`, then redeploy the latest commit.
6. Hard-refresh the NetGuard tab with `Ctrl+Shift+R`, sign in with `admin / admin`, and test **Add Site & Auto-Scan**, Settings, Analytics, Reports, and the assistant.

After the viva, replace `ADMIN_PASSWORD=admin` with a strong password and redeploy Render.

## What changed

- Verified users and the extension receive separate hashed JWT quota buckets.
- Fake bearer tokens cannot create new quota buckets.
- Health, Google OAuth, and administrator recovery do not consume the shared API quota.
- Temporary 429/network errors no longer erase a valid dashboard session.
- Repeated API errors reuse one notification instead of stacking multiple toasts.
- There is no Android, APK, VPN, or mobile application code in this package.
