import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Chrome, Download, ExternalLink, RefreshCw, Shield,
  Activity, Terminal, Power, Lock, Cpu
} from 'lucide-react';

const fallbackRelease = {
  latestVersion: '3.6.5',
  downloadUrl: '/downloads/netguard-pro-extension.zip',
  agentDownloadUrl: '/downloads/NetGuard-Endpoint-Agent.bat',
  publishedAt: '2026-11-23',
  changelog: [
    'PC Endpoint Agent v1.0.0 with Heuristic Background Process Shield',
    'Real-time Internet bandwidth throughput telemetry in Performance Tab',
    'Master Power Switch with Zero OS File Corruption guarantee',
    'User Authorization prompt prior to process termination',
    'Chrome MV3 typosquatting, CSPM, and k-Anonymity checks'
  ],
};

export default function Install() {
  const [release, setRelease] = useState(fallbackRelease);
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' or 'extension'

  useEffect(() => {
    fetch('/release.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Release metadata unavailable');
        return response.json();
      })
      .then((data) => setRelease({ ...fallbackRelease, ...data }))
      .catch(() => setRelease(fallbackRelease));
  }, []);

  const extDownloadUrl = release.downloadUrl || fallbackRelease.downloadUrl;
  const agentDownloadUrl = release.agentDownloadUrl || fallbackRelease.agentDownloadUrl;

  return (
    <div className="min-h-screen bg-dark text-gray-100 pb-20">
      <nav className="border-b border-border bg-dark/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </span>
            <span className="font-bold">NetGuard Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-200">Open Dashboard</Link>
            <Link to="/login" className="btn-primary text-xs px-4 py-2">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-safe/10 border border-safe/20 text-safe text-sm mb-6">
            <CheckCircle className="w-4 h-4" /> Production Release v{release.latestVersion}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Install NetGuard Pro Protection</h1>
          <p className="text-gray-400 leading-relaxed text-sm max-w-2xl mx-auto">
            NetGuard Pro operates across two coordinated tiers: the <strong>Chrome Browser Extension</strong> for web security,
            and the <strong>Windows Endpoint Agent</strong> for host process protection.
          </p>

          {/* Toggle Tab */}
          <div className="inline-flex bg-surface p-1 rounded-xl border border-border mt-8">
            <button
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'agent'
                  ? 'bg-primary text-dark shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" /> Windows Endpoint Agent
            </button>
            <button
              onClick={() => setActiveTab('extension')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'extension'
                  ? 'bg-primary text-dark shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Chrome className="w-4 h-4" /> Chrome Extension (MV3)
            </button>
          </div>
        </section>

        {/* Tab 1: Endpoint Agent Guide */}
        {activeTab === 'agent' && (
          <div className="space-y-10 animate-fade-in">
            <div className="card text-center p-8 bg-surface/30 border-primary/30">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">NetGuard Host Endpoint Agent for Windows</h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto mb-6">
                Monitors host CPU, RAM, and real-time network throughput. Intercepts unauthorized background crypto-miners
                and unverified daemons with zero OS file corruption.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href={agentDownloadUrl}
                  download
                  className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
                >
                  <Download className="w-5 h-5" /> Download Windows Agent (.bat/.exe)
                </a>
                <Link to="/performance" className="btn-ghost text-base px-6 py-3">
                  Open Performance Tab
                </Link>
              </div>
              <p className="mt-3 text-xs text-gray-500 font-mono">
                Port 48123 Loopback Bridge · Windows 10/11 x64 · Zero Rootkit Requirements
              </p>
            </div>

            <section className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: Download,
                  step: 'Step 1',
                  title: 'Download & Save',
                  text: 'Download NetGuard-Endpoint-Agent.bat and save it in your project or tools directory.'
                },
                {
                  icon: Terminal,
                  step: 'Step 2',
                  title: 'Launch Agent',
                  text: 'Double-click to run. It automatically starts the secure local loopback bridge on 127.0.0.1:48123.'
                },
                {
                  icon: Power,
                  step: 'Step 3',
                  title: 'Activate Shield',
                  text: 'Open the Cloud Performance tab. The status turns green! Toggle the Real-Time Shield to ON.'
                },
              ].map(({ icon: Icon, step, title, text }) => (
                <article key={title} className="card relative">
                  <div className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider mb-2">{step}</div>
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
                </article>
              ))}
            </section>
          </div>
        )}

        {/* Tab 2: Chrome Extension Guide */}
        {activeTab === 'extension' && (
          <div className="space-y-10 animate-fade-in">
            <div className="card text-center p-8 bg-surface/30">
              <div className="w-16 h-16 rounded-2xl bg-safe/10 border border-safe/20 text-safe flex items-center justify-center mx-auto mb-4">
                <Chrome className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">NetGuard Pro Manifest V3 Chrome Extension</h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto mb-6">
                Inspects browser tabs in real-time, blocking typosquatting, cryptomining subresources, and credential exposure.
              </p>
              <a href={extDownloadUrl} className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3" download>
                <Download className="w-5 h-5" /> Download Extension ZIP v{release.latestVersion}
              </a>
              {release.sha256 && (
                <p className="mt-3 text-xs text-gray-600 font-mono break-all">SHA-256: {release.sha256}</p>
              )}
            </div>

            <section className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Download, title: '1. Download & extract', text: 'Download the ZIP and extract it to a permanent folder. Do not select the ZIP itself.' },
                { icon: Chrome, title: '2. Open extensions', text: 'Open chrome://extensions, then enable Developer mode in the top-right corner.' },
                { icon: ExternalLink, title: '3. Load unpacked', text: 'Click Load unpacked and select the extracted extension directory containing manifest.json.' },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="card">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
                </article>
              ))}
            </section>
          </div>
        )}

        {/* Changelog & Zero Corruption Guarantee */}
        <section className="grid md:grid-cols-2 gap-6 mt-12">
          <article className="card">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-safe" />
              <h3 className="font-semibold">Zero OS File Corruption Guarantee</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Windows system core binaries (<code>explorer.exe</code>, <code>svchost.exe</code>, <code>csrss.exe</code>)
              are whitelisted and cryptographically quarantined against termination. Only unverified user-space processes
              and rogue miners are flagged, requiring explicit student/admin confirmation.
            </p>
          </article>

          <article className="card">
            <h3 className="font-semibold mb-3">What's Included in v{release.latestVersion}</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              {(release.changelog || []).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-safe font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
