// NetGuard Pro v3.6.5 — Shared URL Risk Engine (browser build)
// Faithful port of extension/js/risk-engine.js with Shannon Entropy and MITRE ATT&CK mapping.

const PHISHING_DOMAINS = [
  'paypa1.com', 'amazon-secure-login.com', 'g00gle.com', 'faceb00k.com',
  'netflix-billing-update.com', 'apple-id-verify.net', 'secure-bankofamerica.com',
  'microsoft-support-alert.com', 'login-instagram.xyz', 'verify-paypal.info',
  'account-google-verify.com', 'icloud-locked.net', 'ebay-account-verify.org',
  'dropbox-shared-files.com', 'linkedin-premium-free.com', 'signin-paypal-account.com',
  'update-amazon-account.net', 'google-security-alert.xyz',
];

const MALWARE_DOMAINS = [
  'malware-download.ru', 'virus-host.cn', 'exploit-kit.io', 'botnet-c2.xyz',
  'ransomware-spread.tk', 'trojan-dropper.ml', 'keylogger-host.pw',
  'cryptominer-pool.ru', 'adware-injector.cn', 'spyware-collect.xyz',
];

const TRACKER_DOMAINS = [
  'doubleclick.net', 'googletagmanager.com', 'facebook.com',
  'analytics.twitter.com', 'hotjar.com', 'mixpanel.com', 'segment.io',
  'amplitude.com', 'heap.io', 'fullstory.com', 'criteo.com', 'taboola.com',
];

const LEGITIMATE_BRANDS = [
  ['paypal', ['paypal.com', 'paypalobjects.com']],
  ['amazon', ['amazon.com', 'amazon.co.uk', 'amazon.in', 'amazonaws.com']],
  ['google', ['google.com', 'google.lk', 'googleapis.com', 'googleusercontent.com']],
  ['apple', ['apple.com', 'icloud.com', 'apple.news']],
  ['microsoft', ['microsoft.com', 'microsoftonline.com', 'live.com', 'office.com', 'outlook.com']],
  ['netflix', ['netflix.com']],
  ['facebook', ['facebook.com', 'facebook.net', 'fb.com']],
  ['instagram', ['instagram.com']],
  ['dropbox', ['dropbox.com', 'dropboxapi.com']],
  ['linkedin', ['linkedin.com', 'linkedin.cn']],
  ['binance', ['binance.com']],
  ['esoft', ['esoft.lk', 'esoft.ac.lk']],
];

const PHISHING_HOST_PATTERNS = [
  /paypa1/i, /amaz0n/i, /g00gle/i, /faceb00k/i,
  /login[-.]secure/i, /secure[-.]login/i, /account[-.]verify/i,
  /verify[-.]account/i, /apple[-.]id[-.]verify/i,
  /microsoft[-.]support[-.]alert/i, /netflix[-.]billing/i,
];
const RISKY_TLD = /\.(tk|ml|pw|xyz|ru|cn|top|club|gq|cf|ga)$/i;
const MALWARE_WORDS = /(^|[.\-_/])(exploit|botnet|ransom|trojan|keylog|cryptominer|spyware|adware|malware|virus)([.\-_/]|$)/i;
const CREDENTIAL_WORDS = /(^|[.\-_/])(login|signin|verify|account|billing|password|wallet|security|unlock|support)([.\-_/]|$)/i;
const XSS_QUERY = /(<script[\s>]|javascript:|on\w+\s*=|document\.cookie|eval\s*\()/i;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function domainMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

export function foldHomoglyphs(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/cl/g, 'd')
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'l')
    .replace(/5/g, 's')
    .replace(/8/g, 'b');
}

export function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;
  const len = str.length;
  const freqs = {};
  for (let i = 0; i < len; i++) {
    const c = str[i];
    freqs[c] = (freqs[c] || 0) + 1;
  }
  let entropy = 0;
  for (const char in freqs) {
    const p = freqs[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

function parseUrl(value) {
  try {
    const raw = String(value || '').trim();
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function finding(status, category, severity, score, label, reason, layer, signals = [], mitre = 'T1204') {
  return { status, category, severity, score, label, reason, layer, signals, mitre };
}

function safeFinding() {
  return finding('safe', 'safe', 'none', 0, 'URL IS SAFE',
    'No high-confidence URL threat signals were detected.', 'All Layers', [], 'N/A');
}

export function analyzeUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed) {
    return finding('warning', 'invalid-url', 'medium', 45, 'INVALID URL',
      'The address could not be validated as an HTTP or HTTPS website.', 'URL Validation', [], 'N/A');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const hostAndPath = `${hostname}${parsed.pathname}`.toLowerCase();

  const phishingMatch = PHISHING_DOMAINS.find((domain) => domainMatches(hostname, domain));
  if (phishingMatch) {
    return finding('danger', 'phishing', 'critical', 100, 'PHISHING WEBSITE DETECTED',
      `This domain matches the NetGuard phishing intelligence list (${phishingMatch}).`,
      'Threat Intelligence', ['known-phishing-domain'], 'T1566.002');
  }

  const malwareMatch = MALWARE_DOMAINS.find((domain) => domainMatches(hostname, domain));
  if (malwareMatch) {
    return finding('danger', 'malware', 'critical', 100, 'MALWARE HOST DETECTED',
      `This domain matches the NetGuard malware intelligence list (${malwareMatch}).`,
      'Threat Intelligence', ['known-malware-domain'], 'T1204.001');
  }

  const spoofedBrand = LEGITIMATE_BRANDS.find(([brand, validDomains]) => (
    hostname.includes(brand) && !validDomains.some((domain) => domainMatches(hostname, domain))
  ));
  if (spoofedBrand) {
    return finding('danger', 'brand-spoofing', 'critical', 96, 'BRAND SPOOFING DETECTED',
      `The domain uses “${spoofedBrand[0]}” but is not an authorized ${spoofedBrand[0]} domain.`,
      'Heuristic Analysis', ['brand-name-mismatch'], 'T1566.002');
  }

  // Algorithmic Typosquatting & Homoglyph Lookalike Detection
  const labels = hostname.split('.');
  for (const [brand, validDomains] of LEGITIMATE_BRANDS) {
    if (validDomains.some((domain) => domainMatches(hostname, domain))) continue;

    for (const label of labels) {
      if (!label || label.length < 3) continue;
      const subTokens = label.split('-');
      for (const token of subTokens) {
        if (!token || token.length < 3) continue;
        const folded = foldHomoglyphs(token);
        if (folded === brand || (folded.includes(brand) && token !== brand)) {
          return finding('danger', 'brand-spoofing', 'critical', 96, 'HOMOGLYPH SPOOFING DETECTED',
            `The domain label “${token}” visually imitates the protected brand “${brand}”.`,
            'Heuristic Analysis', ['homoglyph-spoofing', 'brand-impersonation'], 'T1566.002');
        }
        const dist = levenshtein(token, brand);
        if (dist === 1 && brand.length >= 4) {
          return finding('danger', 'brand-spoofing', 'critical', 94, 'TYPOSQUATTING DETECTED',
            `The domain label “${token}” is an algorithmic 1-character typo of “${brand}”.`,
            'Heuristic Analysis', ['typosquatting-detected', 'levenshtein-distance-1'], 'T1566.002');
        }
      }
    }
  }

  // Lexical Shannon Entropy Analysis (DGA / Botnet C2 detection)
  if (!IPV4.test(hostname)) {
    for (const label of labels) {
      if (label.length >= 14 && (RISKY_TLD.test(hostname) || /[-_0-9]/.test(label))) {
        const entropy = calculateEntropy(label);
        if (entropy >= 3.65) {
          return finding('danger', 'dga-domain', 'high', 89, 'ALGORITHMIC DGA DOMAIN DETECTED',
            `Abnormally high Shannon entropy (${entropy} bits) indicates an algorithmically generated botnet/malware domain.`,
            'Heuristic Analysis', ['high-shannon-entropy', 'dga-pattern'], 'T1568.002');
        }
      }
    }
  }

  if (PHISHING_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return finding('danger', 'phishing-pattern', 'high', 92, 'PHISHING PATTERN DETECTED',
      'The hostname contains a high-confidence credential-theft pattern.',
      'Heuristic Analysis', ['phishing-host-pattern'], 'T1566.002');
  }

  if (MALWARE_WORDS.test(hostAndPath) && (RISKY_TLD.test(hostname) || CREDENTIAL_WORDS.test(hostAndPath))) {
    return finding('danger', 'suspicious-keyword', 'high', 88, 'MALICIOUS URL PATTERN',
      'The address combines malware-related wording with other high-risk URL signals.',
      'Heuristic Analysis', ['malware-keyword', 'compound-risk'], 'T1204.001');
  }

  if (hostname.split('.').some((label) => label.startsWith('xn--')) && CREDENTIAL_WORDS.test(hostAndPath)) {
    return finding('danger', 'phishing', 'high', 86, 'DECEPTIVE DOMAIN DETECTED',
      'An internationalized hostname is combined with credential-related wording.',
      'Heuristic Analysis', ['punycode-host', 'credential-keyword'], 'T1566.002');
  }

  for (const [, valuePart] of parsed.searchParams) {
    if (XSS_QUERY.test(valuePart)) {
      return finding('danger', 'xss-attempt', 'critical', 98, 'XSS PAYLOAD DETECTED',
        'The address contains script-like input that may attempt to execute in the page.',
        'Content Security', ['xss-query-payload'], 'T1059.007');
    }
  }

  if (parsed.protocol === 'http:' && CREDENTIAL_WORDS.test(hostAndPath)) {
    return finding('danger', 'zero-trust-http', 'high', 82, 'UNENCRYPTED LOGIN RISK',
      'This credential-related page uses HTTP, so submitted information would not be encrypted.',
      'Zero Trust', ['unencrypted-http', 'credential-keyword'], 'T1557');
  }

  const tracker = TRACKER_DOMAINS.find((domain) => domainMatches(hostname, domain));
  if (tracker) {
    return finding('warning', 'tracker', 'medium', 55, 'TRACKER DOMAIN',
      'This address belongs to a known cross-site tracking service.',
      'Behavioral Analysis', ['known-tracker'], 'T1005');
  }

  if (RISKY_TLD.test(hostname)) {
    return finding('warning', 'high-risk-tld', 'medium', 55, 'HIGH-RISK DOMAIN ENDING',
      'This top-level domain needs extra caution, but it is not malicious by itself.',
      'Heuristic Analysis', ['high-risk-tld'], 'T1583.001');
  }

  if (IPV4.test(hostname)) {
    return finding('warning', 'dns-leak', 'medium', 50, 'DIRECT IP ACCESS',
      'The address bypasses normal hostname validation.', 'DNS Monitor', ['direct-ip'], 'T1071.001');
  }

  if (parsed.protocol === 'http:') {
    return finding('warning', 'zero-trust-http', 'high', 65, 'UNENCRYPTED CONNECTION',
      'This site does not use HTTPS encryption.', 'Zero Trust', ['unencrypted-http'], 'T1557');
  }

  return safeFinding();
}

export default {
  analyzeUrl,
  domainMatches,
  parseUrl,
  levenshtein,
  foldHomoglyphs,
  calculateEntropy,
  LEGITIMATE_BRANDS,
  PHISHING_DOMAINS,
  MALWARE_DOMAINS,
};
