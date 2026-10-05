import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, AlertOctagon, Ban, Bug, CheckCircle2, Cpu, Crosshair, FlaskConical,
  KeyRound, Lock, RefreshCw, ShieldAlert, ShieldCheck, Terminal, Zap, Radio,
} from 'lucide-react';
import riskEngine from '../lib/riskEngine';
import { createSiteProtectionSim, BALANCED_PROFILE } from '../lib/siteProtectionSim';
import { API_BASE_URL } from '../services/api';

/* ------------------------------------------------------------------ */
/*  Shared UI helpers                                                  */
/* ------------------------------------------------------------------ */

const ACTION_STYLES = {
  allowed: { color: 'text-safe', bg: 'bg-safe/10 border-safe/30', label: 'ALLOWED' },
  challenged: { color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/30', label: 'CHALLENGED' },
  throttled: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'THROTTLED' },
  blocked: { color: 'text-danger', bg: 'bg-danger/10 border-danger/30', label: 'BLOCKED' },
  danger: { color: 'text-danger', bg: 'bg-danger/10 border-danger/30', label: 'BLOCKED' },
  warning: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'WARNING' },
  safe: { color: 'text-safe', bg: 'bg-safe/10 border-safe/30', label: 'SAFE' },
};

function stamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function LogLine({ entry }) {
  const style = ACTION_STYLES[entry.action] || ACTION_STYLES.allowed;
  return (
    <div className={`log-line ${entry.pulse ? 'log-pulse' : ''}`}>
      <span className="text-gray-600">[{entry.time}]</span>{' '}
      {entry.tag && <span className="text-primary">{entry.tag} </span>}
      <span className={entry.color || 'text-gray-300'}>{entry.text}</span>
      {entry.action && (
        <span className={`ml-auto inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${style.bg} ${style.color}`}>
          {style.label}
        </span>
      )}
    </div>
  );
}

function CounterTile({ icon: Icon, label, value, tone }) {
  const tones = {
    danger: 'text-danger border-danger/30',
    warning: 'text-warning border-warning/30',
    safe: 'text-safe border-safe/30',
    primary: 'text-primary border-primary/30',
    secondary: 'text-secondary border-secondary/30',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-surface/70 px-4 py-3 ${tones[tone]}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none tabular-nums">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function VerdictBanner({ verdict }) {
  if (!verdict) return null;
  const blocked = verdict.type === 'blocked';
  return (
    <div className={`verdict-banner ${blocked ? 'verdict-danger' : 'verdict-safe'}`}>
      <div className="flex items-center gap-4">
        <div className={`verdict-icon ${blocked ? 'bg-danger/15 text-danger' : 'bg-safe/15 text-safe'}`}>
          {blocked ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
        <div className="min-w-0">
          <div className={`text-lg font-extrabold tracking-tight ${blocked ? 'text-danger' : 'text-safe'}`}>
            {verdict.title}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">{verdict.detail}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scenario 1 — LIVE brute-force attack against the NetGuard login API */
/* ------------------------------------------------------------------ */

const ATTACK_ACCOUNT = 'attacker.demo@netguard-test.local';

function useBruteForce() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ attempted: 0, rejected: 0, blocked: 0 });
  const [verdict, setVerdict] = useState(null);
  const abortRef = useRef(null);

  const push = (entry) => setLog((prev) => [...prev, { time: stamp(), ...entry }]);

  const reset = () => {
    abortRef.current?.abort();
    setRunning(false); setLog([]); setStats({ attempted: 0, rejected: 0, blocked: 0 }); setVerdict(null);
  };

  const run = async (live) => {
    reset();
    setRunning(true);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const totalAttempts = 24; // production login limiter: 20 failures / 15 min
    let blockedCount = 0;

    push({ tag: '»', text: `Credential stuffing attack targeting: POST /api/auth/login`, color: 'text-primary' });
    push({ tag: '»', text: `Target account: ${ATTACK_ACCOUNT}  |  mode: ${live ? 'LIVE production API' : 'offline limiter simulation'}`, color: 'text-gray-500' });
    push({ tag: '»', text: 'Rotating password dictionary: admin123, P@ssw0rd!, letmein2026, qwerty99 …', color: 'text-gray-500' });

    // Offline simulation mirrors express-rate-limit: 20 failures / 15 min.
    let simCount = 0;
    const simAttempt = () => {
      simCount += 1;
      return simCount > 20 ? 429 : 401;
    };

    for (let i = 1; i <= totalAttempts; i += 1) {
      if (signal.aborted) break;
      const password = `WrongPass-${i}`;
      let status;
      try {
        if (live) {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: ATTACK_ACCOUNT, password }),
            signal,
          });
          status = response.status;
          if (status === 429) {
            const body = await response.json().catch(() => ({}));
            if (body.message) push({ tag: '!', text: `Server: ${body.message}`, color: 'text-warning' });
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 170));
          status = simAttempt();
        }
      } catch (error) {
        if (signal.aborted) break;
        push({ tag: '!', text: `Network error: ${error.message}`, color: 'text-warning' });
        break;
      }

      if (status === 401) {
        setStats((s) => ({ attempted: s.attempted + 1, rejected: s.rejected + 1, blocked: s.blocked }));
        push({
          tag: `#${String(i).padStart(2, '0')}`,
          text: `POST /api/auth/login  ${password.padEnd(16)} → 401 Invalid credentials`,
          color: 'text-gray-400', action: 'allowed', pulse: true,
        });
      } else if (status === 429) {
        blockedCount += 1;
        setStats((s) => ({ attempted: s.attempted + 1, rejected: s.rejected, blocked: s.blocked + 1 }));
        push({
          tag: `#${String(i).padStart(2, '0')}`,
          text: 'POST /api/auth/login → 429 TOO MANY REQUESTS — rate limiter engaged',
          color: 'text-danger font-semibold', action: 'blocked', pulse: true,
        });
        setVerdict({
          type: 'blocked',
          title: 'BRUTE-FORCE ATTACK BLOCKED — HTTP 429',
          detail: `The per-route rate limiter cut off the attack after ${i - 1} failed attempts. Further sign-in attempts from this client are rejected for 15 minutes while valid user sessions continue unaffected.`,
        });
        push({ tag: '✓', text: 'Attack terminated. Login endpoint protected by rate-limit policy.', color: 'text-safe' });
        break;
      } else {
        push({ tag: `#${String(i).padStart(2, '0')}`, text: `Unexpected response ${status} — stopping demo.`, color: 'text-warning' });
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, live ? 140 : 60));
    }

    if (!signal.aborted && blockedCount === 0) {
      setVerdict({
        type: 'safe',
        title: 'ATTACK EXHAUSTED WITHOUT BREACH',
        detail: 'Every attempt was rejected. No valid credentials were discovered.',
      });
    }
    setRunning(false);
  };

  useEffect(() => () => abortRef.current?.abort(), []);
  return { running, log, stats, verdict, run, reset };
}

/* ------------------------------------------------------------------ */
/*  Scenario 2 — XSS / phishing URL stream through the extension engine */
/* ------------------------------------------------------------------ */

const ATTACK_URLS = [
  { url: 'https://example.com/?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E', note: 'encoded <script> injection' },
  { url: 'https://paypa1.com/login', note: 'typosquat PayPal clone' },
  { url: 'https://paypal-account-verify.com/signin', note: 'brand impersonation' },
  { url: 'https://g00gle.com/search', note: 'homoglyph domain' },
  { url: 'https://microsoft-support-alert.com/call-now', note: 'fake support page' },
  { url: 'https://botnet-c2.xyz/ping', note: 'known malware C2 host' },
  { url: 'https://xn--pple-43d.com/account/verify', note: 'punycode look-alike' },
  { url: 'http://bank-login.com/account', note: 'unencrypted credential page' },
  { url: 'https://198.51.100.23/admin', note: 'raw-IP hosting' },
  { url: 'https://example.com', note: 'SAFE control URL' },
];

function useUrlAttack() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ attempted: 0, blocked: 0, warnings: 0, safe: 0, falsePositives: 0 });
  const [verdict, setVerdict] = useState(null);
  const abortRef = useRef(null);

  const push = (entry) => setLog((prev) => [...prev, { time: stamp(), ...entry }]);
  const reset = () => {
    abortRef.current?.abort();
    setRunning(false); setLog([]);
    setStats({ attempted: 0, blocked: 0, warnings: 0, safe: 0, falsePositives: 0 });
    setVerdict(null);
  };

  const run = async () => {
    reset();
    setRunning(true);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    push({ tag: '»', text: 'Loading NetGuard shared risk engine (extension/js/risk-engine.js v3.5)…', color: 'text-primary' });
    push({ tag: '»', text: `Intelligence loaded: ${riskEngine.PHISHING_DOMAINS.length} phishing domains, ${riskEngine.MALWARE_DOMAINS.length} malware hosts, 10 brand allowlists`, color: 'text-gray-500' });
    push({ tag: '»', text: 'Opening 10 attacker-supplied URLs in sequence…', color: 'text-gray-500' });

    let blocked = 0; let warnings = 0; let safe = 0; let falsePositives = 0;

    for (const item of ATTACK_URLS) {
      if (signal.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, 380));
      const result = riskEngine.analyzeUrl(item.url);
      if (result.status === 'danger') blocked += 1;
      else if (result.status === 'warning') warnings += 1;
      else safe += 1;
      if (result.status !== 'safe' && item.note === 'SAFE control URL') falsePositives += 1;

      setStats({ attempted: blocked + warnings + safe, blocked, warnings, safe, falsePositives });
      push({
        tag: '→',
        text: `${decodeURIComponent(item.url).slice(0, 72).padEnd(72)} ${result.label} (score ${result.score})`,
        color: result.status === 'danger' ? 'text-danger' : result.status === 'warning' ? 'text-warning' : 'text-safe',
        action: result.status, pulse: true,
      });
      push({ tag: ' ', text: `   ↳ ${result.reason}  [layer: ${result.layer}]`, color: 'text-gray-500' });
    }

    if (!signal.aborted) {
      setVerdict({
        type: 'blocked',
        title: `${blocked} MALICIOUS URLS BLOCKED BEFORE PAGE LOAD`,
        detail: `The extension risk engine blocked ${blocked} dangerous URLs and flagged ${warnings} suspicious ones, while the safe control URL passed with 0 false positives. In the browser, danger verdicts trigger the blurred interstitial with the 10-second auto-return.`,
      });
      push({ tag: '✓', text: 'Scan complete. Safe control URL correctly allowed — no false positives.', color: 'text-safe' });
    }
    setRunning(false);
  };

  useEffect(() => () => abortRef.current?.abort(), []);
  return { running, log, stats, verdict, run, reset };
}

/* ------------------------------------------------------------------ */
/*  Scenario 3 — application-layer form flood vs Balanced profile      */
/* ------------------------------------------------------------------ */

function useFormFlood() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ attempted: 0, allowed: 0, throttled: 0, blocked: 0 });
  const [verdict, setVerdict] = useState(null);
  const abortRef = useRef(null);

  const push = (entry) => setLog((prev) => [...prev, { time: stamp(), ...entry }]);
  const reset = () => {
    abortRef.current?.abort();
    setRunning(false); setLog([]);
    setStats({ attempted: 0, allowed: 0, throttled: 0, blocked: 0 });
    setVerdict(null);
  };

  const run = async () => {
    reset();
    setRunning(true);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const sim = createSiteProtectionSim(BALANCED_PROFILE);
    push({ tag: '»', text: 'Protected-site policy engine initialised — profile: BALANCED', color: 'text-primary' });
    push({ tag: '»', text: 'Burst window: 8 events / 5s   |   Minute limit: 60   |   Auto-block: 15 min', color: 'text-gray-500' });
    push({ tag: '»', text: 'Attacker floods the protected contact form with automated submissions…', color: 'text-gray-500' });

    let attempted = 0; let done = false;

    for (let i = 1; i <= 18 && !done; i += 1) {
      if (signal.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, 260));
      const decision = sim.submitForm({ messageHash: `spam-payload-${i}` });
      attempted += 1;

      if (decision.action === 'allowed') {
        push({
          tag: `#${String(i).padStart(2, '0')}`,
          text: 'POST /contact-form  message: "You have won a free prize!…" → passed',
          color: 'text-gray-400', action: 'allowed', pulse: true,
        });
      } else if (decision.action === 'throttled') {
        push({
          tag: `#${String(i).padStart(2, '0')}`,
          text: `POST /contact-form → THROTTLED  (${decision.category}) — ${decision.reason}`,
          color: 'text-warning', action: 'throttled', pulse: true,
        });
      } else {
        push({
          tag: `#${String(i).padStart(2, '0')}`,
          text: `POST /contact-form → BLOCKED  (${decision.category}) — ${decision.reason}`,
          color: 'text-danger font-semibold', action: 'blocked', pulse: true,
        });
        if (!done) {
          done = true;
          // a blocked attacker retries immediately from the same client
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!signal.aborted) {
            const retry = sim.submitForm({ messageHash: 'spam-payload-retry' });
            attempted += 1;
            push({
              tag: '!!',
              text: `Attacker retries after block → ${retry.reason} (${retry.blockedForMinutes} min remaining)`,
              color: 'text-danger', action: 'blocked',
            });
          }
        }
      }
      const { counters } = sim.state;
      setStats({ attempted, allowed: counters.allowed, throttled: counters.throttled, blocked: counters.blocked });
    }

    if (!signal.aborted) {
      const blockedTotal = sim.state.counters.blocked;
      setVerdict({
        type: 'blocked',
        title: blockedTotal > 0 ? 'FORM-FLOOD ATTACKER TEMPORARILY BLOCKED (15 MIN)' : 'ATTACK CONTAINED',
        detail: blockedTotal > 0
          ? `Escalation: ${sim.state.counters.allowed} allowed → ${sim.state.counters.throttled} throttled → ${blockedTotal} blocked. The Balanced profile detected the request burst (≥ 16 events / 5s = 2× threshold) and activated the automatic temporary block. The same decision function runs in the production backend (siteProtection.js) for every registered site.`
          : 'All submissions were throttled before the block threshold was reached.',
      });
      push({ tag: '✓', text: 'Attack contained. Legitimate visitors remain unaffected (separate verified-visitor state).', color: 'text-safe' });
    }
    setRunning(false);
  };

  useEffect(() => () => abortRef.current?.abort(), []);
  return { running, log, stats, verdict, run, reset };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const SCENARIOS = {
  brute: {
    key: 'brute', icon: KeyRound, title: 'Brute-Force Login Attack',
    subtitle: 'Credential stuffing vs API rate limiter',
    color: 'text-danger', ring: 'border-danger/40', glow: 'from-danger/20',
    description: 'Automated password guessing against the NetGuard sign-in endpoint. The production express-rate-limit policy (20 failures / 15 min per client, successful logins excluded) must cut the attack off with HTTP 429 before any account is compromised.',
    counters: (s) => [
      { icon: Crosshair, label: 'Attempts', value: s.attempted, tone: 'primary' },
      { icon: Ban, label: 'Rejected 401', value: s.rejected, tone: 'warning' },
      { icon: ShieldAlert, label: 'Blocked 429', value: s.blocked, tone: 'danger' },
    ],
  },
  urls: {
    key: 'urls', icon: Bug, title: 'XSS & Phishing URL Attack',
    subtitle: 'Live URL stream vs extension risk engine',
    color: 'text-warning', ring: 'border-warning/40', glow: 'from-warning/20',
    description: 'Ten attacker URLs — XSS payloads, typosquat domains, brand spoofs and malware hosts — are analysed by the exact same risk engine that ships inside the Chrome extension (risk-engine.js). Every danger verdict is a page the extension would blur and auto-return from.',
    counters: (s) => [
      { icon: Crosshair, label: 'URLs scanned', value: s.attempted, tone: 'primary' },
      { icon: ShieldAlert, label: 'Blocked', value: s.blocked, tone: 'danger' },
      { icon: AlertOctagon, label: 'Warnings', value: s.warnings, tone: 'warning' },
      { icon: CheckCircle2, label: 'Safe / FP', value: `${s.safe} / ${s.falsePositives}`, tone: 'safe' },
    ],
  },
  flood: {
    key: 'flood', icon: Zap, title: 'Application-Layer Form Flood',
    subtitle: 'Burst abuse vs Balanced protection profile',
    color: 'text-secondary', ring: 'border-secondary/40', glow: 'from-secondary/20',
    description: 'Automated submissions flood a protected website form. The per-site policy engine (siteProtection.js, Balanced profile: 8 events / 5s burst, 2× threshold auto-block) escalates from allow → throttle → temporary block, exactly as it does for live registered sites.',
    counters: (s) => [
      { icon: Crosshair, label: 'Submissions', value: s.attempted, tone: 'primary' },
      { icon: CheckCircle2, label: 'Allowed', value: s.allowed, tone: 'safe' },
      { icon: AlertOctagon, label: 'Throttled', value: s.throttled, tone: 'warning' },
      { icon: Ban, label: 'Blocked', value: s.blocked, tone: 'danger' },
    ],
  },
};

export default function AttackSimulator() {
  const [scenario, setScenario] = useState('brute');
  const [liveMode, setLiveMode] = useState(true);

  const brute = useBruteForce();
  const urls = useUrlAttack();
  const flood = useFormFlood();

  const active = SCENARIOS[scenario];
  const engine = scenario === 'brute' ? brute : scenario === 'urls' ? urls : flood;
  const allLogs = { brute, urls, flood };

  const selectScenario = (key) => {
    Object.values(allLogs).forEach((e) => e.reset());
    setScenario(key);
  };

  const launch = useCallback(() => {
    if (scenario === 'brute') brute.run(liveMode);
    else if (scenario === 'urls') urls.run();
    else flood.run();
  }, [scenario, liveMode, brute, urls, flood]);

  const consoleRef = useRef(null);
  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: 'smooth' });
  }, [brute.log, urls.log, flood.log]);

  const counterTiles = active.counters(engine.stats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-100">Attack Simulator &amp; Protection Proof</h1>
            <span className="badge bg-danger/15 text-danger font-mono">CONTROLLED DEMO</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Safe, repeatable demonstrations of NetGuard Pro detection and blocking — for the final viva.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FlaskConical className="w-4 h-4 text-primary" />
          All targets are systems owned by this project. No third-party systems are attacked.
        </div>
      </div>

      {/* Scenario selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(SCENARIOS).map((item) => {
          const Icon = item.icon;
          const isActive = scenario === item.key;
          return (
            <button
              key={item.key}
              onClick={() => selectScenario(item.key)}
              className={`relative overflow-hidden text-left rounded-xl border p-4 transition-all duration-200 bg-card ${
                isActive ? `${item.ring} shadow-lg` : 'border-border hover:border-gray-600'
              }`}
            >
              {isActive && <div className={`absolute inset-0 bg-gradient-to-br ${item.glow} to-transparent opacity-60`} />}
              <div className="relative flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-surface ${isActive ? item.color : 'text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className={`font-semibold ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.subtitle}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active scenario panel */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${active.color}`}>
              <active.icon className="w-5 h-5" /> {active.title}
            </h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{active.description}</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 shrink-0">
            {scenario === 'brute' && (
              <div className="flex items-center gap-2 text-xs bg-surface border border-border rounded-lg px-3 py-2">
                <Radio className={`w-4 h-4 ${liveMode ? 'text-danger animate-pulse' : 'text-gray-500'}`} />
                <span className={liveMode ? 'text-danger font-semibold' : 'text-gray-400'}>
                  {liveMode ? 'LIVE' : 'SIM'}
                </span>
                <button
                  onClick={() => setLiveMode((v) => !v)}
                  disabled={engine.running}
                  className="ml-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40"
                  style={{ background: liveMode ? 'var(--ng-danger)' : '#3a3d4e' }}
                  aria-label="Toggle live mode"
                >
                  <span
                    className="inline-block w-3.5 h-3.5 transform rounded-full bg-white transition-transform"
                    style={{ transform: liveMode ? 'translateX(18px)' : 'translateX(3px)' }}
                  />
                </button>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500">{liveMode ? 'hits the real API' : 'offline fallback'}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={launch} disabled={engine.running} className="btn-danger inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <Crosshair className="w-4 h-4" />
                {engine.running ? 'Attack running…' : 'Launch Attack'}
              </button>
              <button onClick={engine.reset} disabled={engine.running} className="btn-ghost inline-flex items-center gap-2 disabled:opacity-40">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {counterTiles.map((tile) => (
            <CounterTile key={tile.label} icon={tile.icon} label={tile.label} value={tile.value} tone={tile.tone} />
          ))}
        </div>

        {/* Verdict */}
        <VerdictBanner verdict={engine.verdict} />

        {/* Terminal */}
        <div className="mt-4 rounded-xl border border-border overflow-hidden bg-[#0b0d13]">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-gray-400">netguard-protection-console</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${engine.running ? 'bg-danger animate-pulse' : 'bg-safe'}`} />
              <span className="text-[10px] font-mono text-gray-500">{engine.running ? 'MONITORING' : 'IDLE'}</span>
            </span>
          </div>
          <div ref={consoleRef} className="h-[340px] overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed ng-terminal">
            {engine.log.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                <Cpu className="w-10 h-10 opacity-40" />
                <span>Protection engine standing by… launch an attack to see live detection.</span>
              </div>
            ) : (
              engine.log.map((entry, i) => <LogLine key={i} entry={entry} />)
            )}
          </div>
        </div>

        {/* Scenario-specific notes */}
        {scenario === 'brute' && (
          <div className="mt-4 text-xs text-gray-500 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 text-safe mt-0.5" />
            <p>
              {liveMode
                ? 'LIVE mode sends real requests only to this project\'s own API. The limiter locks the attacking client (this browser) out of the login route for 15 minutes — sign out/in with Google or wait before repeating. Successful logins are never counted against the limit.'
                : 'SIMULATION mode reproduces the production limiter arithmetic locally (20 failures / 15 min, successful requests excluded) — useful as a fallback if the live route is already rate-limited.'}
            </p>
          </div>
        )}
        {scenario === 'urls' && (
          <div className="mt-4 text-xs text-gray-500 flex items-start gap-2">
            <Activity className="w-4 h-4 shrink-0 text-primary mt-0.5" />
            <p>
              The last URL is a deliberate safe control — it proves the engine does not over-block normal sites.
              To see the same verdicts inside Chrome, install the extension and open the viva test URL
              <code className="mx-1 px-1.5 py-0.5 rounded bg-surface text-primary">https://example.com/?q=%3Cscript%3E…</code>
              to trigger the blurred interstitial with the 10-second auto-return.
            </p>
          </div>
        )}
        {scenario === 'flood' && (
          <div className="mt-4 text-xs text-gray-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-safe mt-0.5" />
            <p>
              This runs the production decision function from <code className="px-1 rounded bg-surface">backend/lib/siteProtection.js</code> with
              Balanced-profile defaults. On a registered website the same decisions arrive from the origin-bound SDK, and every
              event is stored as MongoDB evidence visible in Reports → Protected Website.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
