import {
  Shield, Globe, Lock, Zap, Eye, Brain, Cloud, Download, Activity,
  Cpu, CheckCircle, Terminal, Power, HardDrive, Wifi, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const features = [
  { icon: Activity, title: 'PC Endpoint Shield & Performance', desc: 'Real-time PC hardware monitoring, internet speed telemetry, and multi-vector unauthorized background service defense' },
  { icon: Shield, title: 'Defense-in-Depth', desc: '5-layer security with behavioral analysis, threat intelligence, and Zero Trust enforcement' },
  { icon: Brain, title: 'AI & Heuristic Detection', desc: 'Multi-vector heuristic process classification with Zero Operating System File Corruption guarantee' },
  { icon: Lock, title: 'Zero Trust Architecture', desc: 'Never trust, always verify. All connections and background daemons validated in real-time' },
  { icon: Eye, title: 'Real-Time Monitoring', desc: 'SIEM-style threat logging with severity levels and instant background process authorization' },
  { icon: Globe, title: 'Site Protection', desc: 'Generate unique protection codes to secure your websites and external endpoints' },
];

const stats = [
  { label: 'Chrome Standard', value: 'MV3' },
  { label: 'Defense Layers', value: '5 + Host' },
  { label: 'PC Agent Link', value: 'Real-Time' },
  { label: 'Cloud Dashboard', value: 'Live' },
];

const agentSteps = [
  {
    step: '01',
    title: 'Download Endpoint Agent',
    desc: 'Download the lightweight NetGuard Endpoint Agent executable or batch launcher for Windows x64.',
    file: 'NetGuard-Endpoint-Agent.bat',
    icon: Download
  },
  {
    step: '02',
    title: 'Launch on Windows PC',
    desc: 'Double-click to start the local loopback bridge on 127.0.0.1:48123. Zero registry changes or rootkit drivers needed.',
    file: 'node netguard-agent.js',
    icon: Terminal
  },
  {
    step: '03',
    title: 'Real-Time Performance Link',
    desc: 'The Cloud Performance tab automatically synchronizes live CPU, RAM, and Internet upload/download speeds.',
    file: 'Live Loopback Bridge',
    icon: Activity
  },
  {
    step: '04',
    title: 'Master Shield & Authorization',
    desc: 'Turn ON the master power switch to intercept unauthorized crypto-miners. System core binaries are 100% protected.',
    file: 'Zero OS Corruption Guard',
    icon: Power
  }
];

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-dark">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-gray-100">NetGuard Pro</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">v3.6.5</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/install" className="text-xs text-gray-400 hover:text-gray-200">
              Downloads
            </Link>
            <Link to="/login" className="btn-primary text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">BEng (Hons) Final Year Project – Network & Cloud Security</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-100 leading-tight mb-6">
              Multi-Layered Browser &
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> PC Endpoint Security </span>
              Platform
            </h1>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Unified defense across Chrome Manifest V3 and host Windows PC. Combines real-time browser threat blocking,
              live PC hardware & network performance telemetry, and heuristic background service interception.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/install" className="btn-primary text-base px-8 py-3">
                <span className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Install Chrome Extension
                </span>
              </Link>
              <a
                href="/downloads/NetGuard-Endpoint-Agent.bat"
                download
                className="btn-ghost text-base px-8 py-3 flex items-center gap-2 border border-primary/30 text-primary hover:bg-primary/10"
              >
                <Activity className="w-5 h-5" />
                Download Windows PC Agent
              </a>
              <button onClick={login} className="btn-ghost text-base px-6 py-3">Sign in with Google</button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-100">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New: Endpoint Agent Step-by-Step Installation Section */}
      <section className="py-20 px-6 border-t border-border bg-surface/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safe/10 border border-safe/20 text-safe text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Endpoint Host Defense Layer
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
              How to Install & Link the NetGuard PC Agent
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Browser extensions cannot inspect operating system processes. The NetGuard Endpoint Agent links your Windows PC
              with your cloud dashboard to terminate unauthorized background miners and rogue daemons safely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card relative flex flex-col justify-between group hover:border-primary/40 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-gray-600 font-mono group-hover:text-primary transition-colors">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <s.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-100 mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{s.desc}</p>
                </div>
                <div className="pt-3 border-t border-border text-[11px] font-mono text-gray-500 truncate">
                  {s.file}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-safe/10 border border-safe/20 text-safe flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-100">Zero Operating System File Corruption Guarantee</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Core Windows binaries (svchost, csrss, explorer, services) are strictly protected. The heuristic engine only intercepts verified rogue miners and disguised binaries.
                </p>
              </div>
            </div>

            <a
              href="/downloads/NetGuard-Endpoint-Agent.bat"
              download
              className="btn-primary text-sm px-6 py-2.5 whitespace-nowrap flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Agent Bundle
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Advanced Security Architecture</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Built with industry frameworks including NIST CSF, Zero Trust, and Multi-Vector Defense-in-Depth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card group hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Technology Stack</h2>
          <p className="text-gray-500 mb-12 text-sm">Built with modern, production-grade technologies</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'React 18', 'Node.js', 'Express', 'MongoDB Atlas', 'Chrome MV3', 'Windows Loopback Host Bridge',
              'Heuristic Process Engine', 'OAuth 2.0', 'JWT Authentication', 'TLS Inspection', 'Zero Trust Heuristics'
            ].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-card border border-border rounded-full text-xs font-medium text-gray-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Secure Your Browsing & PC?</h2>
          <p className="text-gray-500 mb-8 text-sm">Get started with NetGuard Cloud Platform and Host Agent – it's free.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/install" className="btn-primary text-base px-8 py-3">Install Chrome Extension</Link>
            <Link to="/dashboard" className="btn-ghost text-base px-8 py-3">Open Cloud Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border text-center">
        <p className="text-sm text-gray-600">
          🛡️ NetGuard Pro v3.6.5 – Final Year Project | Network & Cloud Security | 2026
        </p>
      </footer>
    </div>
  );
}
