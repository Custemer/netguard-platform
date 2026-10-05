import { useEffect, useMemo, useState } from 'react';
import {
  Shield, AlertTriangle, Eye, Globe, TrendingUp, Copy, CheckCircle,
  RefreshCw, Activity, Lock, Zap, Radio, Cpu, ArrowUpRight, ShieldCheck, Bot, Fingerprint,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api, { apiUrl } from '../services/api';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { critical: '#ff3b5c', high: '#ff6432', medium: '#ffa726', low: '#00e676', none: '#5a7a99' };

const CATEGORY_LABELS = {
  phishing: 'Phishing', malware: 'Malware', tracker: 'Trackers', 'crypto-miner': 'Crypto Miner',
  'xss-attempt': 'XSS Attempt', 'zero-trust-http': 'Zero Trust', 'session-exposed': 'Session Leak',
  'hidden-iframe': 'Hidden Iframe', malvertising: 'Malvertising', 'credential-risk': 'Credential Risk',
  'dns-leak': 'Secure DNS Bypass', 'phishing-pattern': 'Phishing Pattern', 'brand-spoofing': 'Brand Spoofing',
  'suspicious-keyword': 'Suspicious Keyword', 'high-risk-tld': 'Risky TLD',
};

function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ---- polished shared tooltip ---- */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ng-tooltip">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          <span className="text-gray-400">{entry.name}</span>
          <span className="ml-auto font-bold text-gray-100 tabular-nums">
            {formatter ? formatter(entry.value) : entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- KPI card with sparkline ---- */
function KpiCard({ icon: Icon, label, value, sub, tone, children }) {
  const tones = {
    danger: 'text-danger bg-danger/10 border-danger/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    safe: 'text-safe bg-safe/10 border-safe/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
  };
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
        <div className={`p-1.5 rounded-lg border ${tones[tone]} transition-transform group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-[2rem] font-extrabold text-gray-50 leading-none mt-2 tabular-nums tracking-tight">
        {value}
      </div>
      {children}
      {sub && <div className="text-[11px] text-gray-500 mt-1.5">{sub}</div>}
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data?.length) return null;
  return (
    <div className="h-8 -mx-1 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#spark-${color.replace('#', '')})`} isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [trendWindow, setTrendWindow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [updatedAgo, setUpdatedAgo] = useState(0);

  useEffect(() => {
    loadDashboard();
    fetch(apiUrl('/api/health'))
      .then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
    const clockTimer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setUpdatedAgo((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/api/dashboard/overview');
      if (res.data.success) setData(res.data.data);
      await loadTrend(res.data.data);
      setUpdatedAgo(0);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* Trend with honest window fallback: 7d → 30d → 90d (uses the same
     analytics API as the Analytics page, so nothing is fabricated). */
  const loadTrend = async (overview) => {
    const fromOverview = (overview?.trendData || []).map((row) => ({
      date: row._id, threats: row.count || 0, blocked: row.blocked || 0,
    }));
    if (fromOverview.length) {
      setTrend(fromOverview); setTrendWindow(7); return;
    }
    for (const days of [7, 30, 90]) {
      try {
        const res = await api.get('/api/dashboard/analytics', { params: { days } });
        const rows = (res.data.data?.dailyThreats || []).map((row) => ({
          date: row._id, threats: row.threats || 0, blocked: row.blocked || 0,
        }));
        if (rows.length) { setTrend(rows); setTrendWindow(days); return; }
      } catch { /* try next window */ }
    }
    setTrend([]); setTrendWindow(7);
  };

  const copyProtectionCode = () => {
    if (data?.protectionCode) {
      navigator.clipboard.writeText(data.protectionCode);
      setCopied(true);
      toast.success('Protection code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const severityTotal = useMemo(
    () => (data?.threatsBySeverity || []).reduce((sum, row) => sum + row.count, 0), [data],
  );

  /* threat level gauge — highest severity observed in recent threats */
  const threatLevel = useMemo(() => {
    const weights = { critical: 88, high: 72, medium: 46, low: 24 };
    let level = 8; let label = 'SECURE'; let color = '#00e676';
    (data?.recentThreats || []).forEach((t) => {
      const w = weights[t.severity] ?? 0;
      if (w > level) level = w;
    });
    if ((data?.threatsBySeverity || []).some((s) => s._id === 'critical')) { level = Math.max(level, 88); }
    if (level >= 80) { label = 'CRITICAL'; color = '#ff3b5c'; }
    else if (level >= 65) { label = 'ELEVATED'; color = '#ff6432'; }
    else if (level >= 40) { label = 'GUARDED'; color = '#ffa726'; }
    return { level, label, color };
  }, [data]);

  const sparkThreats = useMemo(
    () => trend.map((row) => ({ v: row.threats })), [trend],
  );

  const settings = data?.settings || {};
  const layerChips = [
    { key: 'zeroTrustMode', label: 'Zero Trust', icon: Lock },
    { key: 'behavioralDetection', label: 'Behavioral', icon: Bot },
    { key: 'threatIntelEnabled', label: 'Threat Intel', icon: Fingerprint },
    { key: 'autoBlock', label: 'Auto Block', icon: Zap },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning" />
        <p>Failed to load dashboard. Please try again.</p>
        <button onClick={loadDashboard} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Security Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time posture, threat activity and protection evidence
            {updatedAgo > 5 && <span className="text-gray-600"> · updated {updatedAgo}s ago</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-gray-500 border border-border rounded-lg px-2.5 py-1.5 bg-surface/50 tabular-nums">
            {clock.toLocaleTimeString('en-GB', { hour12: false })} MVT
          </span>
          {health && (
            <span className="text-[11px] font-mono flex items-center gap-1.5 border border-safe/30 text-safe rounded-lg px-2.5 py-1.5 bg-safe/5">
              <Radio className="w-3 h-3 animate-pulse" /> API v{health.version} · online
            </span>
          )}
          <button onClick={loadDashboard} className="btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <span className="text-xs bg-safe/20 text-safe px-3 py-1.5 rounded-full font-medium flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-safe opacity-60 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-safe"></span>
            </span>
            Protection Active
          </span>
        </div>
      </div>

      {/* ===== Protection layer chips ===== */}
      <div className="card !py-3.5 !px-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mr-1">Active layers</span>
        {layerChips.map((chip) => {
          const on = settings[chip.key] !== false;
          const Icon = chip.icon;
          return (
            <span key={chip.key} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${on ? 'border-safe/30 bg-safe/10 text-safe' : 'border-border bg-surface text-gray-500'}`}>
              <Icon className="w-3.5 h-3.5" /> {chip.label}
              <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-safe' : 'bg-gray-600'}`} />
            </span>
          );
        })}
        <span className="ml-auto text-[11px] text-gray-600 font-mono">extension v3.5 · platform v3.6</span>
      </div>

      {/* ===== KPI row ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={AlertTriangle} label="Total Threats" tone="danger"
          value={data.totalThreats?.toLocaleString()} sub={`${data.threats24h || 0} in last 24h · ${data.threats7d || 0} this week`}>
          <Sparkline data={sparkThreats} color="#ff3b5c" />
        </KpiCard>
        <KpiCard icon={Eye} label="Trackers Detected" tone="warning"
          value={data.userStats?.trackersDetected?.toLocaleString()} sub="Cross-site tracking services flagged">
          <div className="h-8 mt-2 flex items-end gap-1">
            {trend.slice(-14).map((row, i) => (
              <div key={i} className="flex-1 rounded-sm bg-warning/40 hover:bg-warning transition-colors"
                style={{ height: `${Math.max(8, Math.min(100, (row.threats / Math.max(...trend.map((t) => t.threats), 1)) * 100))}%` }} />
            ))}
          </div>
        </KpiCard>
        <KpiCard icon={ShieldCheck} label="Safe Scans" tone="safe"
          value={data.userStats?.safeScans?.toLocaleString()} sub="URLs verified clean" />
        <KpiCard icon={Globe} label="Protected Sites" tone="primary"
          value={data.protectedSites?.length || 0} sub="Origins under NetGuard monitoring">
          {data.protectedSites?.length > 0 && (
            <div className="flex gap-1 mt-3">
              {data.protectedSites.slice(0, 5).map((site) => (
                <span key={site._id || site.origin} title={site.origin || site.siteUrl}
                  className="text-[9px] font-mono text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 truncate max-w-[80px]">
                  {(site.origin || site.siteUrl || '').replace(/^https?:\/\//, '')}
                </span>
              ))}
            </div>
          )}
        </KpiCard>
      </div>

      {/* ===== Charts row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat trend */}
        <div className="card lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Threat Activity
            </h3>
            {trendWindow && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                {trendWindow === 7 ? 'LAST 7 DAYS' : trendWindow === 30 ? 'LAST 30 DAYS' : 'LAST 90 DAYS'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-600 mb-3">
            {trendWindow === 90 ? 'No activity in shorter windows — showing the widest 90-day evidence window.' : 'Detections recorded by the extension risk engine.'}
          </p>
          {trend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00e676" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232637" vertical={false} />
                <XAxis dataKey="date" stroke="#5a7a99" fontSize={11} tickLine={false}
                  tickFormatter={(v) => v?.slice(5)} axisLine={{ stroke: '#2a2d3e' }} />
                <YAxis stroke="#5a7a99" fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="threats" name="Threats" stroke="#ff3b5c" strokeWidth={2.5}
                  fill="url(#gThreats)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f1117' }} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#00e676" strokeWidth={2}
                  fill="url(#gBlocked)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#0f1117' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-center px-6">
              <Activity className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">No threat activity recorded in the last 90 days.</p>
              <p className="text-xs text-gray-600 max-w-sm">
                Pair the v3.5 extension with this account and browse normally — detections appear here in real time.
                The <a href="/attack-sim" className="text-primary hover:underline">Attack Simulator</a> can also generate a live blocking demonstration.
              </p>
            </div>
          )}
        </div>

        {/* Threat level gauge + severity donut */}
        <div className="card flex flex-col">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-secondary" /> Threat Level
          </h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={170}>
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: 'level', value: threatLevel.level, fill: threatLevel.color }]} startAngle={210} endAngle={-30}>
                <RadialBar background={{ fill: '#232637' }} dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: threatLevel.color }}>
                {threatLevel.level}
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] mt-1" style={{ color: threatLevel.color }}>
                {threatLevel.label}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-gray-600 text-center -mt-1 mb-3">
            Derived from the highest severity in recent detections
          </div>

          <div className="border-t border-border pt-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Severity mix</h4>
            {data.threatsBySeverity?.length ? (
              <div className="space-y-2">
                {data.threatsBySeverity.map((row) => (
                  <div key={row._id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400 capitalize">{row._id}</span>
                      <span className="tabular-nums text-gray-300">{row.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(row.count / severityTotal) * 100}%`, background: SEVERITY_COLORS[row._id] || '#4f8ef7' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No severity data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Category + Recent threats ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Threat Categories</h3>
          {data.threatsByCategory?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.threatsByCategory.slice(0, 7)} layout="vertical" margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4f8ef7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232637" horizontal={false} />
                <XAxis type="number" stroke="#5a7a99" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="_id" stroke="#5a7a99" fontSize={10} width={96}
                  tickFormatter={(v) => CATEGORY_LABELS[v] || v} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(79,142,247,0.06)' }} />
                <Bar dataKey="count" name="Detections" fill="url(#gBar)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-600">No category data yet.</div>
          )}
        </div>

        {/* Recent threats feed */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-danger opacity-60 animate-ping"></span>
                <span className="relative inline-flex w-2 h-2 rounded-full bg-danger"></span>
              </span>
              Live Threat Feed
            </h3>
            <a href="/threats" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          {data.recentThreats?.length ? (
            <div className="space-y-2 max-h-[290px] overflow-y-auto ng-scroll pr-1">
              {data.recentThreats.slice(0, 10).map((threat, i) => (
                <div key={threat._id || i} className="group flex items-center gap-3 p-3 rounded-xl bg-surface/70 hover:bg-surface border border-transparent hover:border-border transition-all">
                  <span className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLORS[threat.severity] || '#4f8ef7' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-200">
                        {CATEGORY_LABELS[threat.category] || threat.category}
                      </span>
                      <span className={`badge ${threat.severity === 'critical' || threat.severity === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                        {threat.severity?.toUpperCase()}
                      </span>
                      {threat.detectionLayer && (
                        <span className="text-[10px] font-mono text-gray-600 border border-border rounded px-1.5 py-0.5">
                          {threat.detectionLayer}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{threat.detail}</div>
                  </div>
                  <span className="text-[11px] text-gray-600 font-mono flex-shrink-0" title={new Date(threat.createdAt).toLocaleString()}>
                    {relativeTime(threat.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[290px] flex flex-col items-center justify-center gap-3 text-center">
              <Cpu className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">No recent threats — your browsing is clean.</p>
              <p className="text-xs text-gray-600">Detections from the paired extension appear here instantly.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Protection code ===== */}
      {data.protectionCode && (
        <div className="card bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Your Protection Code</div>
                <div className="text-2xl font-mono font-bold text-primary tracking-widest mt-0.5">{data.protectionCode}</div>
                <div className="text-xs text-gray-500 mt-1">Use this code when integrating the NetGuard SDK on your websites</div>
              </div>
            </div>
            <button onClick={copyProtectionCode}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-lg transition-all self-start md:self-auto">
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
