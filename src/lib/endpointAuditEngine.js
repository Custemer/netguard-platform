// ───────────────────────────────────────────────────────────
//  NetGuard Pro – Endpoint Process & Service Auditing Engine
//  Safe Heuristic Multi-Vector Classification (Zero OS Corruption)
// ───────────────────────────────────────────────────────────

/**
 * Core Windows System Whitelist.
 * These binaries located in verified system directories are STRICTLY PROTECTED
 * and will NEVER be terminated or blocked to guarantee zero operating system corruption.
 */
export const CORE_SYSTEM_WHITELIST = new Set([
  'system',
  'system idle process',
  'registry',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'services.exe',
  'lsass.exe',
  'winlogon.exe',
  'svchost.exe',
  'fontdrvhost.exe',
  'dwm.exe',
  'spoolsv.exe',
  'taskhostw.exe',
  'explorer.exe',
  'sihost.exe',
  'ctfmon.exe',
  'shellexperiencehost.exe',
  'searchhost.exe',
  'startmenuexperiencehost.exe',
  'runtimebroker.exe',
  'conhost.exe',
  'dllhost.exe',
  'wlanext.exe',
  'securityhealthservice.exe',
  'securityhealthsystray.exe',
  'mpcmdrun.exe',
  'msmpeng.exe',
  'taskmgr.exe'
]);

/**
 * Standard trusted developer, browser and office productivity binaries.
 */
export const TRUSTED_APPLICATION_WHITELIST = new Set([
  'chrome.exe',
  'msedge.exe',
  'firefox.exe',
  'brave.exe',
  'opera.exe',
  'code.exe',
  'node.exe',
  'git.exe',
  'powershell.exe',
  'cmd.exe',
  'wt.exe',
  'python.exe',
  'python3.exe',
  'slack.exe',
  'discord.exe',
  'spotify.exe',
  'teams.exe',
  'zoom.exe'
]);

/**
 * Known cryptomining and unauthorized process signatures.
 */
const ROGUE_MINER_SIGNATURES = [
  'xmrig',
  'minerd',
  'stratum',
  'ethminer',
  'phoenixminer',
  'nbminer',
  'nicehash',
  'cpuminer',
  'monero',
  'ccminer',
  'cryptonight',
  'xmr-stak',
  'silentminer',
  'coinhive'
];

/**
 * Known disguised system typosquat patterns.
 */
const DISGUISED_SYSTEM_NAMES = [
  'svch0st.exe',
  'scvhost.exe',
  'svhost.exe',
  'csrs.exe',
  'csrss32.exe',
  'exp1orer.exe',
  'explorer32.exe',
  'taskmgr32.exe',
  'winlog0n.exe',
  'lsas.exe',
  'isass.exe'
];

/**
 * Suspicious execution path indicators.
 */
const SUSPICIOUS_PATH_PATTERNS = [
  /\\appdata\\local\\temp\\/i,
  /\\temp\\/i,
  /\\users\\public\\/i,
  /\\\$recycle\.bin\\/i,
  /\\windows\\temp\\/i,
  /\\appdata\\roaming\\[a-z0-9]{8,}\\/i
];

/**
 * Known unauthorized network ports commonly used by cryptominers or C2 reverse shells.
 */
const SUSPICIOUS_PORT_LIST = new Set([3333, 4444, 5555, 6666, 7777, 8332, 8333, 9999, 14444, 18080, 18081]);

/**
 * Compute standard Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Evaluates a single process or service using NetGuard's multi-layered heuristic safety algorithm.
 * 
 * @param {Object} proc
 * @param {string} proc.name - Executable name (e.g., 'xmrig.exe')
 * @param {number} proc.pid - Process Identifier
 * @param {string} proc.path - Full path to executable
 * @param {number} proc.cpuPercent - Instantaneous CPU %
 * @param {number} proc.memoryMb - Memory working set in MB
 * @param {number[]} [proc.openPorts] - Open listening network ports
 * @param {boolean} [proc.isSigned] - Cryptographic digital signature status
 * @returns {Object} Evaluation report containing riskScore, category, status, and verdict
 */
export function auditProcess(proc) {
  const name = String(proc?.name || '').trim().toLowerCase();
  const path = String(proc?.path || '').trim();
  const lowerPath = path.toLowerCase();
  const cpu = Number(proc?.cpuPercent || 0);
  const mem = Number(proc?.memoryMb || 0);
  const openPorts = Array.isArray(proc?.openPorts) ? proc.openPorts : [];
  const isSigned = Boolean(proc?.isSigned);

  // 1. Core System Whitelist Guard (Zero OS File Corruption Guarantee)
  if (CORE_SYSTEM_WHITELIST.has(name)) {
    // If it's a core system process, verify it is located in Windows system directories
    const isStandardWinDir = lowerPath.includes('c:\\windows\\system32') ||
                             lowerPath.includes('c:\\windows\\syswow64') ||
                             lowerPath.includes('c:\\windows\\systemapps') ||
                             path === ''; // Kernel / System virtual processes have empty paths
    
    if (isStandardWinDir) {
      return {
        pid: proc.pid,
        name: proc.name,
        path: proc.path,
        riskScore: 0,
        severity: 'safe',
        category: 'SYSTEM_CORE',
        reasons: ['Verified Windows Kernel / System Core Service'],
        actionRecommended: 'ALLOW_PROTECTED',
        isProtectedSystem: true,
        canTerminate: false
      };
    }
  }

  // 2. Trusted Application Whitelist
  if (TRUSTED_APPLICATION_WHITELIST.has(name)) {
    const isProgramFiles = lowerPath.includes('c:\\program files') ||
                           lowerPath.includes('c:\\program files (x86)') ||
                           lowerPath.includes('c:\\windows');
    if (isProgramFiles || isSigned) {
      return {
        pid: proc.pid,
        name: proc.name,
        path: proc.path,
        riskScore: 5,
        severity: 'safe',
        category: 'TRUSTED_APPLICATION',
        reasons: ['Verified Application in Program Files directory'],
        actionRecommended: 'ALLOW',
        isProtectedSystem: false,
        canTerminate: true
      };
    }
  }

  let riskScore = 0;
  const reasons = [];
  let category = 'UNKNOWN_SERVICE';

  // 3. Vector A: Known Rogue Crypto Miner Signatures (+90)
  const isMiner = ROGUE_MINER_SIGNATURES.some((sig) => name.includes(sig) || lowerPath.includes(sig));
  if (isMiner) {
    riskScore += 90;
    category = 'UNAUTHORIZED_CRYPTOMINER';
    reasons.push('Matched known unauthorized crypto-mining executable pattern (XMR/Stratum)');
  }

  // 4. Vector B: System Process Impersonation / Homoglyphs (+85)
  if (DISGUISED_SYSTEM_NAMES.includes(name)) {
    riskScore += 85;
    category = 'HOMOGLYPH_PROCESS_SPOOF';
    reasons.push(`Process name '${proc.name}' is an intentional typosquat/spoof of a critical Windows system component`);
  } else {
    // Check Levenshtein distance against core system names
    for (const sysName of CORE_SYSTEM_WHITELIST) {
      if (sysName.length > 5) {
        const dist = levenshteinDistance(name, sysName);
        if (dist === 1 && name !== sysName) {
          riskScore += 80;
          category = 'HOMOGLYPH_PROCESS_SPOOF';
          reasons.push(`Suspicious 1-character typo variance from system binary '${sysName}'`);
          break;
        }
      }
    }
  }

  // 5. Vector C: Suspicious Execution Path (+35)
  for (const pattern of SUSPICIOUS_PATH_PATTERNS) {
    if (pattern.test(lowerPath)) {
      riskScore += 35;
      reasons.push('Executable resides in temporary, unverified user or public folder path');
      if (category === 'UNKNOWN_SERVICE') category = 'UNVERIFIED_TEMP_DAEMON';
      break;
    }
  }

  // 6. Vector D: Rogue Network Port Association (+40)
  const hasSuspiciousPort = openPorts.some((port) => SUSPICIOUS_PORT_LIST.has(port));
  if (hasSuspiciousPort) {
    riskScore += 40;
    reasons.push(`Process binds to unauthorized outbound mining or C2 port (${openPorts.join(', ')})`);
    if (category === 'UNKNOWN_SERVICE') category = 'ROGUE_NETWORK_LISTENER';
  }

  // 7. Vector E: Resource Consumption Anomaly (+25)
  if (cpu >= 75) {
    riskScore += 25;
    reasons.push(`Anomalous sustained CPU saturation (${cpu.toFixed(1)}%) in background service`);
  } else if (cpu >= 40) {
    riskScore += 15;
    reasons.push(`Elevated background CPU consumption (${cpu.toFixed(1)}%)`);
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine classification severity
  let severity = 'safe';
  let actionRecommended = 'ALLOW';

  if (riskScore >= 75) {
    severity = 'critical';
    actionRecommended = 'BLOCK_AND_TERMINATE';
  } else if (riskScore >= 50) {
    severity = 'high';
    actionRecommended = 'FLAG_FOR_REVIEW';
  } else if (riskScore >= 30) {
    severity = 'medium';
    actionRecommended = 'MONITOR';
  }

  return {
    pid: proc.pid,
    name: proc.name,
    path: proc.path,
    cpuPercent: cpu,
    memoryMb: mem,
    openPorts,
    riskScore,
    severity,
    category,
    reasons,
    actionRecommended,
    isProtectedSystem: false,
    canTerminate: true
  };
}

/**
 * Filter and batch audit a list of running processes.
 */
export function auditProcessList(processes) {
  if (!Array.isArray(processes)) return [];
  return processes.map(auditProcess);
}
