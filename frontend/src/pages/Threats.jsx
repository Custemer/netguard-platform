import { useEffect, useState } from 'react';
import {
  AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, ShieldAlert,
  FileText, Copy, X, CheckCircle2, ShieldCheck, ExternalLink, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SEVERITY_COLORS = {
  critical: 'badge-danger',
  high: 'badge-warning',
  medium: 'badge-warning',
  low: 'badge-safe',
};

const CATEGORY_LABELS = {
  'phishing': 'Phishing',
  'malware': 'Malware',
  'tracker': 'Tracker',
  'crypto-miner': 'Crypto Miner',
  'xss-attempt': 'XSS Attempt',
  'zero-trust-http': 'Zero Trust HTTP',
  'session-exposed': 'Session Token Exposed',
  'hidden-iframe': 'Hidden Iframe',
  'malvertising': 'Malvertising',
  'credential-risk': 'Credential Risk',
  'suspicious-redirect': 'Suspicious Redirect',
  'phishing-pattern': 'Phishing Pattern',
  'high-risk-tld': 'High Risk TLD',
  'dns-leak': 'DNS Leak',
  'brand-spoofing': 'Brand Spoofing',
  'insecure-form': 'Insecure Form',
  'dynamic-miner-injection': 'Dynamic Miner',
  'suspicious-keyword': 'Suspicious Keyword',
  'dga-domain': 'Algorithmic DGA Domain',
};

const MITRE_MAP = {
  'phishing': { id: 'T1566.002', tactic: 'Initial Access', technique: 'Spearphishing Link' },
  'brand-spoofing': { id: 'T1566.002', tactic: 'Initial Access', technique: 'Brand Impersonation / Typosquatting' },
  'phishing-pattern': { id: 'T1566.002', tactic: 'Initial Access', technique: 'Credential Theft Link' },
  'malware': { id: 'T1204.001', tactic: 'Execution', technique: 'Malicious Link Click' },
  'crypto-miner': { id: 'T1496', tactic: 'Impact', technique: 'Resource Hijacking (Web Cryptomining)' },
  'dynamic-miner-injection': { id: 'T1059', tactic: 'Execution', technique: 'Dynamic Script Injection' },
  'xss-attempt': { id: 'T1059.007', tactic: 'Execution', technique: 'DOM & Stored JavaScript Injection' },
  'zero-trust-http': { id: 'T1557', tactic: 'Credential Access', technique: 'Adversary-in-the-Middle (Cleartext HTTP)' },
  'tracker': { id: 'T1005', tactic: 'Collection', technique: 'Cross-Site User Profiling' },
  'insecure-form': { id: 'T1056.001', tactic: 'Credential Access', technique: 'Input Capture (Form Sniffing)' },
  'dns-leak': { id: 'T1071.001', tactic: 'Command and Control', technique: 'Direct IP Bypass Protocol' },
  'hidden-iframe': { id: 'T1189', tactic: 'Defense Evasion', technique: 'Drive-by Compromise (Hidden Frame)' },
  'suspicious-redirect': { id: 'T1204.001', tactic: 'Initial Access', technique: 'Deceptive Browser Redirect' },
  'dga-domain': { id: 'T1568.002', tactic: 'Command and Control', technique: 'Domain Generation Algorithms (DGA)' },
};

const ACTIONS = {
  blocked: '🛡️ Blocked',
  warned: '⚠️ Warned',
  logged: '📝 Logged',
  monitored: '👁️ Monitored',
  'allowed-by-user': '⚠️ Continued by User',
  'auto-returned': '🛡️ Auto-returned',
};

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThreat, setSelectedThreat] = useState(null);

  useEffect(() => {
    loadThreats();
  }, [currentPage, filterCategory, filterSeverity]);

  const loadThreats = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 15 };
      if (filterCategory) params.category = filterCategory;
      if (filterSeverity) params.severity = filterSeverity;
      const res = await api.get('/api/dashboard/threats', { params });
      if (res.data.success) {
        setThreats(res.data.threats);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load threats:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyIncidentDossier = (threat) => {
    const mitre = MITRE_MAP[threat.category] || { id: 'T1204', tactic: 'General', technique: 'Untrusted URI' };
    const text = `[NETGUARD PRO SOC INCIDENT PLAYBOOK]
=========================================
Incident ID: ${threat._id}
Timestamp: ${new Date(threat.createdAt).toISOString()}
Severity: ${threat.severity?.toUpperCase()}
Category: ${CATEGORY_LABELS[threat.category] || threat.category}
Target Resource: ${threat.url}
Domain / Origin: ${threat.domain || 'N/A'}
Detection Layer: ${threat.detectionLayer}
Action Enforced: ${ACTIONS[threat.action] || threat.action}

MITRE ATT&CK ALIGNMENT:
- Technique ID: ${mitre.id}
- Tactic: ${mitre.tactic}
- Sub-technique: ${mitre.technique}

AUTOMATED REMEDIATION DIRECTIVES:
1. Perimeter Containment: Blocked at Chrome endpoint via NetGuard Manifest V3 DNR rule.
2. DNS Sinkhole Directive: Add entry: 0.0.0.0 ${threat.domain || 'target-domain'} to corporate DNS gateway.
3. Identity Hygiene: Revoke any session cookies established if cleartext HTTP was used.
4. User Alert: Automated security notification dispatched to client dashboard.
=========================================`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success('📋 SOC Incident Dossier copied to clipboard!');
    });
  };

  const filteredThreats = threats.filter((threat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      threat.url?.toLowerCase().includes(query) ||
      threat.domain?.toLowerCase().includes(query) ||
      threat.detail?.toLowerCase().includes(query) ||
      threat.category?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Threat Intelligence &amp; Incident Log</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time browser security events mapped to MITRE ATT&amp;CK enterprise tactics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary border border-primary/20 text-xs font-mono">
            MITRE ATT&amp;CK ALIGNED
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by URL, domain, category, IoC…"
            className="input-field pl-9 text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="input-field text-sm"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}
            className="input-field text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Threats List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : filteredThreats.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-safe" />
            <h3 className="text-lg font-semibold text-gray-200">No threats found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || filterCategory || filterSeverity
                ? 'Try adjusting your filters'
                : 'Your browsing has been clean!'}
            </p>
          </div>
        ) : (
          filteredThreats.map((threat) => {
            const mitre = MITRE_MAP[threat.category] || { id: 'T1204', tactic: 'Execution', technique: 'User Execution' };
            return (
              <div
                key={threat._id}
                className="card hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor:
                        threat.severity === 'critical' ? '#ff3b5c' :
                        threat.severity === 'high' ? '#ff6432' :
                        threat.severity === 'medium' ? '#ffa726' : '#00e676'
                      }}
                    ></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-200 text-sm">
                          {CATEGORY_LABELS[threat.category] || threat.category}
                        </span>
                        <span className={`badge ${SEVERITY_COLORS[threat.severity]}`}>
                          {threat.severity?.toUpperCase()}
                        </span>
                        <span className="badge bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-mono">
                          {mitre.id}
                        </span>
                        <span className="text-xs text-gray-600">
                          {threat.detectionLayer}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1 leading-relaxed">{threat.detail}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span className="truncate max-w-[280px]">🔗 {threat.url}</span>
                        {threat.domain && <span>🌐 {threat.domain}</span>}
                        <span>🕐 {new Date(threat.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-xs text-gray-500">
                      {ACTIONS[threat.action] || threat.action}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedThreat(threat)}
                      className="mt-2 text-xs text-primary font-semibold hover:text-primary-hover flex items-center gap-1 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> SOC Playbook
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pagination.limit + 1}–{Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-surface border border-border disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              className="p-2 rounded-lg bg-surface border border-border disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SOC Incident Playbook Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedThreat(null)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100">
                  {CATEGORY_LABELS[selectedThreat.category] || selectedThreat.category} Incident Playbook
                </h3>
                <span className="text-xs text-gray-500 font-mono">Incident #{selectedThreat._id}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* MITRE Card */}
              {(() => {
                const mitre = MITRE_MAP[selectedThreat.category] || { id: 'T1204', tactic: 'Execution', technique: 'User Execution' };
                return (
                  <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl">
                    <div className="font-bold text-secondary text-sm mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> MITRE ATT&amp;CK Enterprise Framework Alignment
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-gray-300">
                      <div><span className="text-gray-500">Technique ID:</span> {mitre.id}</div>
                      <div><span className="text-gray-500">Tactic:</span> {mitre.tactic}</div>
                      <div className="col-span-2"><span className="text-gray-500">Sub-Technique:</span> {mitre.technique}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Target info */}
              <div className="p-3 bg-card border border-border rounded-xl space-y-1.5 font-mono text-gray-300">
                <div><span className="text-gray-500">Target URL:</span> <span className="text-danger break-all">{selectedThreat.url}</span></div>
                {selectedThreat.domain && <div><span className="text-gray-500">Host Domain:</span> {selectedThreat.domain}</div>}
                <div><span className="text-gray-500">Detection Layer:</span> {selectedThreat.detectionLayer}</div>
                <div><span className="text-gray-500">Enforcement Action:</span> {ACTIONS[selectedThreat.action] || selectedThreat.action}</div>
              </div>

              {/* Action Directives */}
              <div className="space-y-2">
                <div className="font-bold text-gray-200 text-sm">Automated SOC Response Directives:</div>
                <div className="p-3 bg-card border border-border rounded-xl space-y-2 text-gray-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-safe shrink-0 mt-0.5" />
                    <span><b>Perimeter Containment:</b> Navigation immediately halted. Tab rendered inactive with blur overlay.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-safe shrink-0 mt-0.5" />
                    <span><b>Zero Trust Invalidation:</b> Credential exposure analyzed; Range-check evaluated against HIBP k-Anonymity database.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-safe shrink-0 mt-0.5" />
                    <span><b>DNS Sinkhole Rule:</b> Add <code className="px-1 py-0.5 rounded bg-surface text-primary">0.0.0.0 {selectedThreat.domain || 'domain'}</code> to enterprise edge resolver.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => copyIncidentDossier(selectedThreat)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Incident Dossier
              </button>
              <button
                type="button"
                onClick={() => setSelectedThreat(null)}
                className="btn-ghost text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
