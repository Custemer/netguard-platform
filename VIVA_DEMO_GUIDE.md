# NetGuard Pro v3.5 — Viva Demo Guide

## 1. Configure the independent administrator login

In the Render service, set these environment variables and redeploy:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ADMIN_LOGIN_EMAIL=admin@netguard.local
```

The username and password are verified only by the backend. They are not stored in the website or extension bundle. The administrator route has its own failed-attempt limiter and does not use Google OAuth or the shared API quota.

For the viva, enter `admin` in the Username or Email field and `admin` in the Password field. Change `ADMIN_PASSWORD` to a strong password immediately after the controlled demonstration.

## 2. Reload extension v3.5

1. Extract `frontend/public/downloads/netguard-pro-extension.zip`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Remove or reload the old NetGuard extension.
5. Choose Load unpacked and select the folder containing `manifest.json`.
6. Confirm the popup shows v3.5.0 and protection is Active.

## 3. Demonstrate the unsafe-site warning safely

First open any normal page so Chrome has a safe history entry. Then open this harmless `example.com` test URL:

```text
https://example.com/?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E
```

The query contains encoded script-like text, but `example.com` does not execute it. NetGuard should:

1. Blur the website behind the warning.
2. Show the NetGuard AI Risk Recommendation.
3. Display the risk type, layer, and score.
4. Count down visibly from 10 seconds.
5. Return to the previous safe page automatically at zero.

Reload the test URL to demonstrate each button:

- **Continue Anyway** closes the warning and records that the user accepted the risk.
- **Go Back to Safety** immediately returns to the previous page and records a blocked navigation.
- Pressing **Esc** performs the same safe-back action.

The warning uses a deterministic local URL risk engine, so this demonstration still works if Gemini, Google login, or the internet-facing dashboard is unavailable.

## 4. Final checks before presenting

- Render `/api/health` returns `version: "3.5.0"`.
- Vercel displays NetGuard v3.5.
- `admin / admin` local recovery login works.
- Google Sign-In can be shown separately if available.
- The extension is paired with the dashboard if cloud reporting is part of the demo.
- Protection is Active before opening the safe warning-test URL.

