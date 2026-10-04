# NetGuard Pro — Frontend v3.6 Upgrade & Deployment Guide

**What this is:** the upgraded React dashboard (v3.6) with the new SOC-style graphs and the **Attack Simulator**. No backend or extension changes are required — all API contracts are unchanged.

## What changed (files)

```
src/pages/Dashboard.jsx          → redesigned (gauge, gradient trend, live feed, layer chips)
src/pages/Analytics.jsx          → composed chart, score radial, HTTPS-ratio KPI
src/pages/AttackSimulator.jsx    → NEW — 3 live attack-block demos
src/lib/riskEngine.js            → NEW — extension risk engine ported for the simulator
src/lib/siteProtectionSim.js     → NEW — backend protectionDecision() ported for the simulator
src/components/Sidebar.jsx       → Attack Simulator nav item
src/components/Layout.jsx        → v3.6 badge
src/pages/Landing.jsx            → v3.6 badge
src/App.jsx                      → /attack-sim route
src/index.css                    → design system polish (tooltips, terminal, verdict banners)
vite.config.js                   → optional remote-API proxy (VITE_PROXY_TARGET / VITE_PROXY_ORIGIN)
package.json                     → 3.6.0
```

## Deploy to Vercel (your live site)

**If your Vercel project is connected to a Git repo (recommended):**

1. Copy every changed file above from this package into your repo's `frontend/` folder (same paths).
2. Commit and push — Vercel auto-builds (`npm run build`).
3. After deploy, hard-refresh the site (Ctrl+Shift+R) and confirm the badge shows **v3.6**.

**If you deploy with the Vercel CLI:**

```bash
cd frontend
npm ci
npm run build
vercel --prod
```

Confirm environment variable `VITE_API_URL=https://netguard-platform.onrender.com` is set in
Vercel → Settings → Environment Variables (it already is for your current deployment).

## Run locally against the LIVE Render API (offline-safe viva fallback)

```bash
cd frontend
npm ci
VITE_PROXY_TARGET=https://netguard-platform.onrender.com \
VITE_PROXY_ORIGIN=http://localhost:5173 \
VITE_PREVIEW_HOSTS=1 \
npm run dev
```

Then open http://localhost:5173 — sign in with `admin` / `admin`.
The proxy talks server-side, so the backend's CORS allowlist is respected, and every
dashboard page uses real production data.

## Attack Simulator — how each scenario works

| Scenario | Engine | Safety |
|---|---|---|
| Brute-force login (LIVE/SIM toggle) | Real requests to your own `/api/auth/login`; production limiter = 20 failures / 15 min (successes excluded) | Only your own API. Locks the attacking client for 15 min — demo it LAST. SIM mode reproduces the same arithmetic offline. |
| XSS & phishing URL stream | The exact `risk-engine.js` logic from extension v3.5, in-process | Fully offline/deterministic. Ends with a safe control URL to prove 0 false positives. |
| Application-layer form flood | The exact `protectionDecision()` from `backend/lib/siteProtection.js`, Balanced profile (8 events/5s, 2× auto-block, 15 min) | Fully offline simulation of the production policy path. |

## Before the viva — quick checklist

1. `https://netguard-platform.onrender.com/api/health` → awake, `version: 3.5.1`
2. Vercel site badge → **v3.6**
3. Login `admin` / `admin` works
4. Attack Simulator → run URL stream + form flood once (they don't lock anything)
5. Save the LIVE brute-force for the actual demo (15-min lock applies)
6. Screenshot all three verdict banners as offline insurance
