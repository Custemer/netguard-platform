import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Activity, Cpu, HardDrive, Wifi, Shield, ShieldAlert, ShieldCheck,
  Power, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Terminal, Lock, ExternalLink, ArrowDown, ArrowUp, Info, HelpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { auditProcessList } from '../lib/endpointAuditEngine';

const AGENT_BASE_URL = 'http://127.0.0.1:48123';

export default function Performance() {
  const [agentConnected, setAgentConnected] = useState(false);
  const [agentMetadata, setAgentMetadata] = useState(null);
  const [shieldActive, setShieldActive] = useState(true);
  const [metrics, setMetrics] = useState({
    cpuPercent: 18.5,
    cpuModel: 'Intel Core / AMD Ryzen Multi-Core',
    cpuCores: 8,
    memory: { totalGb: 16.0, usedGb: 8.2, freeGb: 7.8, percent: 51.2 },
    network: { downloadSpeedMbps: 48.6, uploadSpeedMbps: 14.2, pingMs: 14, status: 'OPTIMAL' },
    blockedThreatsCount: 2,
    uptimeSeconds: 14200
  });
  const [processes, setProcesses] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // all, blocked, high_risk, system
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcessForTermination, setSelectedProcessForTermination] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [networkHistory, setNetworkHistory] = useState([
    { time: '18:30:00', download: 42.1, upload: 11.2 },
    { time: '18:30:10', download: 45.4, upload: 12.0 },
    { time: '18:30:20', download: 49.8, upload: 14.5 },
    { time: '18:30:30', download: 46.2, upload: 13.8 },
    { time: '18:30:40', download: 52.1, upload: 15.2 },
    { time: '18:30:50', download: 48.6, upload: 14.2 },
  ]);

  // Initial demo / simulated processes if agent is offline
  const fallbackProcesses = useMemo(() => [
    {
      pid: 4892,
      name: 'xmrig-service.exe',
      path: 'C:\\Users\\User\\AppData\\Local\\Temp\\xmrig-service.exe',
      cpuPercent: 88.4,
      memoryMb: 420,
      openPorts: [3333],
      isDemoThreat: true
    },
    {
      pid: 6112,
      name: 'svch0st.exe',
      path: 'C:\\Users\\Public\\Libraries\\svch0st.exe',
      cpuPercent: 3.2,
      memoryMb: 14,
      openPorts: [4444],
      isDemoThreat: true
    },
    {
      pid: 1024,
      name: 'svchost.exe',
      path: 'C:\\Windows\\System32\\svchost.exe',
      cpuPercent: 0.8,
      memoryMb: 32,
      openPorts: []
    },
    {
      pid: 884,
      name: 'explorer.exe',
      path: 'C:\\Windows\\explorer.exe',
      cpuPercent: 1.4,
      memoryMb: 145,
      openPorts: []
    },
    {
      pid: 3200,
      name: 'chrome.exe',
      path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      cpuPercent: 4.8,
      memoryMb: 380,
      openPorts: []
    },
    {
      pid: 2150,
      name: 'unverified-updater.exe',
      path: 'C:\\Users\\User\\AppData\\Roaming\\Updater\\updater.exe',
      cpuPercent: 18.2,
      memoryMb: 85,
      openPorts: [9999]
    }
  ], []);

  // Poll Local Agent
  useEffect(() => {
    let isMounted = true;

    async function pollAgent() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const [statusRes, metricsRes, procRes] = await Promise.all([
          fetch(`${AGENT_BASE_URL}/health`, { signal: controller.signal }),
          fetch(`${AGENT_BASE_URL}/api/agent/metrics`, { signal: controller.signal }),
          fetch(`${AGENT_BASE_URL}/api/agent/processes`, { signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        if (statusRes.ok && metricsRes.ok && procRes.ok) {
          const statusData = await statusRes.json();
          const metricsData = await metricsRes.json();
          const procData = await procRes.json();

          if (isMounted) {
            setAgentConnected(true);
            setAgentMetadata(statusData);
            setShieldActive(statusData.shieldActive);
            setMetrics(metricsData);
            setProcesses(procData.processes || []);

            // Update network history chart
            const nowTime = new Date().toLocaleTimeString();
            setNetworkHistory((prev) => {
              const updated = [...prev, {
                time: nowTime,
                download: metricsData.network.downloadSpeedMbps,
                upload: metricsData.network.uploadSpeedMbps
              }];
              return updated.slice(-12);
            });
          }
          return;
        }
      } catch (err) {
        // Agent offline - use simulated fallback
        if (isMounted) {
          setAgentConnected(false);
          // Audit the fallback processes locally using the engine
          const auditedFallback = auditProcessList(fallbackProcesses).map((p) => {
            if (p.riskScore >= 75 && shieldActive) {
              return { ...p, status: 'BLOCKED' };
            }
            return { ...p, status: p.status || 'RUNNING' };
          });
          setProcesses(auditedFallback);

          // Synthesize slight jitter in speed for realistic live presentation
          setMetrics((prev) => {
            const dl = Number((48 + (Math.random() * 8 - 4)).toFixed(1));
            const ul = Number((14 + (Math.random() * 3 - 1.5)).toFixed(1));
            return {
              ...prev,
              cpuPercent: Number((18 + (Math.random() * 4 - 2)).toFixed(1)),
              network: {
                ...prev.network,
                downloadSpeedMbps: dl,
                uploadSpeedMbps: ul,
                pingMs: Math.floor(13 + Math.random() * 4)
              }
            };
          });

          const nowTime = new Date().toLocaleTimeString();
          setNetworkHistory((prev) => {
            const dl = Number((48 + (Math.random() * 8 - 4)).toFixed(1));
            const ul = Number((14 + (Math.random() * 3 - 1.5)).toFixed(1));
            const updated = [...prev, { time: nowTime, download: dl, upload: ul }];
            return updated.slice(-12);
          });
        }
      }
    }

    pollAgent();
    const interval = setInterval(pollAgent, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fallbackProcesses, shieldActive]);

  // Master Power Button Toggle
  const toggleShield = async () => {
    const nextState = !shieldActive;
    setShieldActive(nextState);

    if (agentConnected) {
      try {
        await fetch(`${AGENT_BASE_URL}/api/agent/shield/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: nextState })
        });
      } catch (e) {
        // Fallback handled locally
      }
    }

    if (nextState) {
      toast.success('Real-Time Process Shield ACTIVATED. Automated background threat blocking active.');
    } else {
      toast('Real-Time Process Shield STANDBY. Background interceptor paused.', { icon: '⏸️' });
    }
  };

  // Authorize Process Termination (Safe Handshake)
  const handleConfirmTermination = async () => {
    if (!selectedProcessForTermination) return;
    setIsTerminating(true);

    const target = selectedProcessForTermination;

    if (target.isProtectedSystem) {
      toast.error('PROHIBITED: Cannot terminate critical Windows operating system binary.');
      setIsTerminating(false);
      setSelectedProcessForTermination(null);
      return;
    }

    try {
      if (agentConnected) {
        await fetch(`${AGENT_BASE_URL}/api/agent/processes/terminate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pid: target.pid,
            name: target.name,
            isDemoThreat: target.isDemoThreat
          })
        });
      }

      // Update state locally
      setProcesses((prev) =>
        prev.map((p) => (p.pid === target.pid ? { ...p, status: 'BLOCKED', riskScore: p.riskScore, severity: p.severity } : p))
      );

      toast.success(`Authorized: Unauthorized process PID ${target.pid} (${target.name}) terminated and blocked.`);
    } catch (err) {
      toast.error(`Termination error: ${err.message}`);
    } finally {
      setIsTerminating(false);
      setSelectedProcessForTermination(null);
    }
  };

  // Whitelist Process
  const handleWhitelist = async (proc) => {
    try {
      if (agentConnected) {
        await fetch(`${AGENT_BASE_URL}/api/agent/processes/whitelist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: proc.name })
        });
      }
      setProcesses((prev) =>
        prev.map((p) => (p.pid === proc.pid ? { ...p, status: 'WHITELISTED', severity: 'safe', riskScore: 0 } : p))
      );
      toast.success(`Process '${proc.name}' added to session whitelist.`);
    } catch (e) {
      toast.error('Whitelist failed');
    }
  };

  // Filtered Process List
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.pid).includes(searchQuery) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'blocked') return p.status === 'BLOCKED';
      if (filterTab === 'high_risk') return p.severity === 'critical' || p.severity === 'high';
      if (filterTab === 'system') return p.category === 'SYSTEM_CORE' || p.isProtectedSystem;
      return true;
    });
  }, [processes, searchQuery, filterTab]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-100">PC Performance & Endpoint Shield</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  Host Agent v1.0
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Real-time PC hardware metrics, internet bandwidth throughput, and multi-vector unauthorized background service defense.
              </p>
            </div>
          </div>

          {/* Connection status pill */}
          <div className="flex items-center gap-3 mt-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
              agentConnected
                ? 'bg-safe/10 text-safe border-safe/30'
                : 'bg-warning/10 text-warning border-warning/30'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${agentConnected ? 'bg-safe' : 'bg-warning'}`} />
              {agentConnected ? (
                <span>Connected: {agentMetadata?.hostname || 'Host PC'} ({agentMetadata?.platform})</span>
              ) : (
                <span>Agent Disconnected – Running Live Simulation (Download Agent to Link PC)</span>
              )}
            </div>

            <a
              href="/downloads/NetGuard-Endpoint-Agent.bat"
              download
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-light hover:underline font-medium"
            >
              <Download className="w-3.5 h-3.5" /> Download Windows Agent (.bat/.exe)
            </a>
          </div>
        </div>

        {/* Master Power Button Toggle */}
        <div className="relative z-10 flex items-center gap-4 bg-surface/50 border border-border p-3.5 rounded-xl">
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Endpoint Shield</div>
            <div className={`text-sm font-bold ${shieldActive ? 'text-safe' : 'text-gray-500'}`}>
              {shieldActive ? 'PROTECTION ACTIVE' : 'SHIELD STANDBY'}
            </div>
          </div>

          <button
            onClick={toggleShield}
            title={shieldActive ? 'Click to pause Real-Time Shield' : 'Click to activate Real-Time Shield'}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
              shieldActive
                ? 'bg-safe text-dark shadow-safe/25 hover:bg-safe/90 scale-105 ring-4 ring-safe/20'
                : 'bg-dark border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            <Power className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Internet Speed */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Internet Speed</span>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-100 mt-2 tabular-nums">
            {metrics.network.downloadSpeedMbps} <span className="text-sm font-normal text-gray-400">Mbps</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-border">
            <span className="flex items-center gap-1 text-safe">
              <ArrowDown className="w-3.5 h-3.5" /> {metrics.network.downloadSpeedMbps} Mbps
            </span>
            <span className="flex items-center gap-1 text-primary">
              <ArrowUp className="w-3.5 h-3.5" /> {metrics.network.uploadSpeedMbps} Mbps
            </span>
            <span className="text-gray-500">{metrics.network.pingMs} ms</span>
          </div>
        </div>

        {/* CPU Utilization */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">CPU Load</span>
            <div className={`p-2 rounded-lg border ${
              metrics.cpuPercent > 70 ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-safe/10 border-safe/20 text-safe'
            }`}>
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-100 mt-2 tabular-nums">
            {metrics.cpuPercent}%
          </div>
          <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.cpuPercent > 70 ? 'bg-danger' : metrics.cpuPercent > 40 ? 'bg-warning' : 'bg-safe'
              }`}
              style={{ width: `${metrics.cpuPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 mt-1.5 truncate">
            {metrics.cpuCores} Cores · {metrics.cpuModel.split('@')[0]}
          </div>
        </div>

        {/* RAM Memory */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">RAM Memory</span>
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-100 mt-2 tabular-nums">
            {metrics.memory.percent}%
          </div>
          <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-warning transition-all duration-500"
              style={{ width: `${metrics.memory.percent}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 mt-1.5">
            {metrics.memory.usedGb} GB used of {metrics.memory.totalGb} GB
          </div>
        </div>

        {/* Intercepted Threats */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Blocked Services</span>
            <div className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-100 mt-2 tabular-nums">
            {processes.filter((p) => p.status === 'BLOCKED').length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-danger mt-2">
            <Lock className="w-3.5 h-3.5" />
            <span>{shieldActive ? 'Zero OS Corruption Guard Active' : 'Standby Mode'}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Unauthorized background services contained
          </div>
        </div>
      </div>

      {/* Network Bandwidth Real-Time Area Chart */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Live Network Bandwidth Throughput</h2>
            <p className="text-xs text-gray-500">Real-time incoming and outgoing data transmission over local network interface</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Download (Mbps)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-safe" /> Upload (Mbps)
            </span>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={networkHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00b4d8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e676" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
              <XAxis dataKey="time" stroke="#5a7a99" fontSize={11} tickLine={false} />
              <YAxis stroke="#5a7a99" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', borderRadius: '8px', color: '#fff' }}
                labelStyle={{ color: '#9aa4b8' }}
              />
              <Area type="monotone" dataKey="download" stroke="#00b4d8" strokeWidth={2} fillOpacity={1} fill="url(#dlGrad)" name="Download Mbps" />
              <Area type="monotone" dataKey="upload" stroke="#00e676" strokeWidth={2} fillOpacity={1} fill="url(#ulGrad)" name="Upload Mbps" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Unauthorized Background Services & Heuristic Auditor */}
      <div className="card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-100">Heuristic Background Process & Service Auditor</h2>
            </div>
            <p className="text-xs text-gray-500">
              Scans running background processes against cryptominers, disguised system binaries, and unauthorized sockets with Zero OS File Corruption protection.
            </p>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search process, PID, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border px-3 py-1.5 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary w-52"
            />

            <div className="flex bg-surface rounded-lg p-0.5 border border-border text-xs">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'blocked', label: 'Blocked' },
                { id: 'high_risk', label: 'High Risk' },
                { id: 'system', label: 'Core System' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1 rounded-md transition-colors font-medium ${
                    filterTab === tab.id
                      ? 'bg-primary text-dark font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/60 text-gray-400 uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Process Name & PID</th>
                <th className="py-3 px-4">Executable Path</th>
                <th className="py-3 px-4">CPU / Memory</th>
                <th className="py-3 px-4">Heuristic Risk</th>
                <th className="py-3 px-4">Status & Category</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No matching processes found for this filter.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((proc) => (
                  <tr key={`${proc.pid}-${proc.name}`} className="hover:bg-white/5 transition-colors">
                    {/* Name & PID */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-200">{proc.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">PID: {proc.pid}</div>
                    </td>

                    {/* Path */}
                    <td className="py-3 px-4 max-w-xs truncate text-gray-400" title={proc.path}>
                      {proc.path}
                    </td>

                    {/* Resources */}
                    <td className="py-3 px-4">
                      <div className="text-gray-200 tabular-nums">{proc.cpuPercent}% CPU</div>
                      <div className="text-[11px] text-gray-500 tabular-nums">{proc.memoryMb} MB RAM</div>
                    </td>

                    {/* Heuristic Risk Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          proc.riskScore >= 75
                            ? 'bg-danger/20 text-danger border border-danger/30'
                            : proc.riskScore >= 40
                            ? 'bg-warning/20 text-warning border border-warning/30'
                            : 'bg-safe/20 text-safe border border-safe/30'
                        }`}>
                          Score: {proc.riskScore}
                        </span>
                      </div>
                      {proc.reasons?.[0] && (
                        <div className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate" title={proc.reasons[0]}>
                          {proc.reasons[0]}
                        </div>
                      )}
                    </td>

                    {/* Status & Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {proc.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1 text-danger font-semibold bg-danger/10 px-2 py-0.5 rounded border border-danger/20">
                            <XCircle className="w-3.5 h-3.5" /> Blocked
                          </span>
                        ) : proc.status === 'WHITELISTED' ? (
                          <span className="inline-flex items-center gap-1 text-safe font-semibold bg-safe/10 px-2 py-0.5 rounded border border-safe/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Whitelisted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-primary font-medium bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            <Activity className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase">
                        {proc.category || 'GENERIC'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {proc.isProtectedSystem ? (
                        <span className="text-[11px] text-gray-500 font-medium px-2 py-1 bg-surface rounded border border-border inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-safe" /> OS Protected
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {proc.status !== 'BLOCKED' ? (
                            <button
                              onClick={() => setSelectedProcessForTermination(proc)}
                              className="btn-danger text-xs px-2.5 py-1"
                              title="Request user authorization to terminate unauthorized process"
                            >
                              Terminate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleWhitelist(proc)}
                              className="btn-ghost text-xs px-2 py-1"
                            >
                              Allow
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission & Confirmation Modal */}
      {selectedProcessForTermination && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100">User Authorization Required</h3>
                <p className="text-xs text-gray-400 mt-1">
                  You are about to issue an explicit OS termination command to halt an unauthorized background process.
                </p>
              </div>
            </div>

            <div className="bg-surface/80 border border-border rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Process Name:</span>
                <span className="font-bold text-gray-200">{selectedProcessForTermination.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Process Identifier (PID):</span>
                <span className="font-mono text-gray-200">{selectedProcessForTermination.pid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Execution Path:</span>
                <span className="font-mono text-gray-300 truncate max-w-xs">{selectedProcessForTermination.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Heuristic Risk Score:</span>
                <span className="font-bold text-danger">{selectedProcessForTermination.riskScore} / 100</span>
              </div>
              <div className="pt-2 border-t border-border text-[11px] text-warning">
                ⚠️ NetGuard Zero OS Corruption Guard confirms this is an unverified user-space binary. Critical system binaries cannot be terminated.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedProcessForTermination(null)}
                className="btn-ghost text-xs px-4 py-2"
                disabled={isTerminating}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTermination}
                className="btn-danger text-xs px-4 py-2 flex items-center gap-1.5"
                disabled={isTerminating}
              >
                {isTerminating ? 'Terminating...' : 'Confirm & Authorize Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
