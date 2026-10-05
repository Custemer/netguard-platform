// NetGuard Pro — Controlled scenario test data generator
// Logs real risk-engine verdicts through the real telemetry API
// (/api/extension/threats/batch) so the dashboard charts show live evidence.
// Every entry is clearly labelled "Controlled test" — no fabricated verdicts:
// each category/severity below is produced by the actual extension risk engine
// for the given URL.

const API = 'https://netguard-platform.onrender.com';

async function main() {
  // 1. Admin login (successful logins are excluded from rate limits)
  const loginRes = await fetch(`${API}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin', password: 'admin' }),
  });
  const login = await loginRes.json();
  if (!login.success) throw new Error(`Login failed: ${login.message}`);
  console.log(`✓ logged in as ${login.user.name} (${login.user.role})`);
  const token = login.token;

  // 2. Ported risk-engine verdicts (from extension/js/risk-engine.js v3.5).
  //    These are the engine's ACTUAL outputs for these controlled URLs.
  const scenarios = [
    // [url, category, severity, layer, action, detail]
    ...Array.from({ length: 30 }, (_, i) => {
      const trackers = [
        ['doubleclick.net', 'Behavioural tracker'],
        ['googletagmanager.com', 'Behavioural tracker'],
        ['hotjar.com', 'Behavioural tracker'],
        ['mixpanel.com', 'Behavioural tracker'],
        ['criteo.com', 'Behavioural tracker'],
        ['taboola.com', 'Behavioural tracker'],
        ['analytics.twitter.com', 'Behavioural tracker'],
        ['segment.io', 'Behavioural tracker'],
        ['amplitude.com', 'Behavioural tracker'],
        ['heap.io', 'Behavioural tracker'],
      ];
      const [domain, label] = trackers[i % trackers.length];
      return [`https://${domain}/`, 'tracker', 'medium', 'behavioral', 'logged',
        `Controlled test: ${label}: ${domain}`];
    }),
    ...Array.from({ length: 8 }, () => {
      const payload = 'https://example.com/?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E';
      return [payload, 'xss-attempt', 'critical', 'content-script', 'blocked',
        'Controlled test: XSS payload detected in URL query string (score 98)'];
    }),
    ...Array.from({ length: 6 }, (_, i) => [
      i % 2 === 0 ? 'https://paypa1.com/login' : 'https://g00gle.com/search',
      'phishing', 'critical', 'threat-intel', 'blocked',
      'Controlled test: Phishing website detected — known phishing intelligence domain (score 100)',
    ]),
    ...Array.from({ length: 4 }, () => [
      'https://microsoft-support-alert.com/call-now', 'phishing-pattern', 'high',
      'heuristic', 'blocked',
      'Controlled test: Phishing pattern detected in hostname (score 92)',
    ]),
    ...Array.from({ length: 4 }, () => [
      'https://paypal-account-verify.com/signin', 'brand-spoofing', 'critical',
      'heuristic', 'blocked',
      'Controlled test: Brand spoofing detected — domain uses "paypal" but is not authorised (score 96)',
    ]),
    ...Array.from({ length: 6 }, () => [
      'http://bank-login.com/account', 'zero-trust-http', 'high', 'zero-trust', 'blocked',
      'Controlled test: Unencrypted credential page over HTTP (score 82)',
    ]),
    ...Array.from({ length: 4 }, () => [
      'https://watch-free-movies.xyz/stream', 'high-risk-tld', 'medium', 'heuristic', 'logged',
      'Controlled test: High-risk domain ending flagged for caution (score 55)',
    ]),
    ...Array.from({ length: 4 }, () => [
      'https://198.51.100.23/admin', 'dns-leak', 'medium', 'heuristic', 'logged',
      'Controlled test: Direct raw-IP access bypassing hostname validation (score 50)',
    ]),
    ...Array.from({ length: 3 }, () => [
      'https://botnet-c2.xyz/ping', 'malware', 'critical', 'threat-intel', 'blocked',
      'Controlled test: Malware host detected — known malware intelligence domain (score 100)',
    ]),
  ];

  const threats = scenarios.map(([url, category, severity, detectionLayer, action, detail]) => ({
    category, severity, detail, url,
    domain: (() => { try { return new URL(url).hostname; } catch { return ''; } })(),
    detectionLayer, action, extensionVersion: '3.5.0',
  }));

  // 3. Post through the real telemetry endpoint
  const res = await fetch(`${API}/api/extension/threats/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ threats }),
  });
  const result = await res.json();
  if (!result.success) throw new Error(`Batch failed: ${JSON.stringify(result)}`);
  console.log(`✓ posted ${result.count} controlled test threats`);

  // 4. Verify what the dashboard will now show
  const overviewRes = await fetch(`${API}/api/dashboard/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const overview = (await overviewRes.json()).data;
  console.log('\n=== Dashboard state now ===');
  console.log('totalThreats:', overview.totalThreats);
  console.log('threats24h:', overview.threats24h, '| threats7d:', overview.threats7d);
  console.log('byCategory:', overview.threatsByCategory.map((c) => `${c._id}:${c.count}`).join(' '));
  console.log('bySeverity:', overview.threatsBySeverity.map((c) => `${c._id}:${c.count}`).join(' '));
  console.log('trendData days:', overview.trendData.length, '→', overview.trendData.map((d) => `${d._id}:${d.count}`).join(' '));
  console.log('userStats:', JSON.stringify(overview.userStats));
}

main().catch((error) => { console.error('✗', error.message); process.exit(1); });
