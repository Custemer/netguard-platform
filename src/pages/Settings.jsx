import { useEffect, useState } from 'react';
import { Shield, Eye, Brain, Lock, Bell, Save, Radio, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { notifyApiError } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    zeroTrustMode: true,
    behavioralDetection: true,
    threatIntelEnabled: true,
    sessionMonitoring: true,
    notifications: true,
    autoBlock: true,
    webhookUrl: '',
    webhookAlerts: false,
  });
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSettings(prev => ({
        ...prev,
        ...user.settings,
        webhookUrl: user.settings.webhookUrl || '',
        webhookAlerts: Boolean(user.settings.webhookAlerts),
      }));
    }
  }, [user]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/dashboard/settings', settings);
      if (res.data.success) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
        toast.success('Security settings & SIEM configuration saved!');
      }
    } catch (err) {
      notifyApiError(err, 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    const url = settings.webhookUrl?.trim();
    if (!url) {
      toast.error('Please enter a Discord, Slack, or SIEM Webhook URL first');
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await api.post('/api/dashboard/test-webhook', { webhookUrl: url });
      if (res.data.success) {
        toast.success('🚨 Incident alert dispatched successfully to your webhook!');
      }
    } catch (err) {
      notifyApiError(err, 'Failed to send test alert');
    } finally {
      setTestingWebhook(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ icon: Icon, label, desc, value, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          value ? 'bg-primary/10' : 'bg-gray-800'
        }`}>
          <Icon className={`w-4 h-4 ${value ? 'text-primary' : 'text-gray-600'}`} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200">{label}</div>
          <div className="text-xs text-gray-500">{desc}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your NetGuard security parameters, Zero Trust boundaries, and SIEM forwarders</p>
      </div>

      {/* Zero Trust */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Zero Trust Architecture
        </h3>
        <div className="space-y-3">
          <SettingRow
            icon={Shield}
            label="Zero Trust Mode"
            desc="Enforce strict transport checks & flag all unencrypted HTTP connections"
            value={settings.zeroTrustMode}
            onChange={() => toggleSetting('zeroTrustMode')}
          />
          <SettingRow
            icon={Lock}
            label="Session Monitoring"
            desc="Detect long-lived cloud session cookies and abnormal session token lifecycles"
            value={settings.sessionMonitoring}
            onChange={() => toggleSetting('sessionMonitoring')}
          />
        </div>
      </div>

      {/* Detection */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-secondary" />
          Detection Layers
        </h3>
        <div className="space-y-3">
          <SettingRow
            icon={Eye}
            label="Behavioral Detection"
            desc="Track third-party tracking scripts and fingerprinting vectors across sites"
            value={settings.behavioralDetection}
            onChange={() => toggleSetting('behavioralDetection')}
          />
          <SettingRow
            icon={Shield}
            label="Threat Intelligence & Heuristics"
            desc="IoC matching, Levenshtein typosquatting detection, and punycode phishing heuristics"
            value={settings.threatIntelEnabled}
            onChange={() => toggleSetting('threatIntelEnabled')}
          />
          <SettingRow
            icon={Bell}
            label="Browser Notifications"
            desc="Show instant Chrome notifications when threats are isolated or blocked"
            value={settings.notifications}
            onChange={() => toggleSetting('notifications')}
          />
          <SettingRow
            icon={Shield}
            label="Auto-Block High-Risk Threats"
            desc="Automatically redirect high-confidence phishing & malware to safety"
            value={settings.autoBlock}
            onChange={() => toggleSetting('autoBlock')}
          />
        </div>
      </div>

      {/* SIEM & Webhook Alerting (SOC Integration) */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-warning" />
          SIEM &amp; Incident Webhook Forwarder (SOC Integration)
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Forward high-severity security incidents, brute-force triggers, and intercepted phishing attempts directly to a Discord channel, Slack workspace, or enterprise SIEM webhook endpoint.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Webhook Endpoint URL (Discord / Slack / Generic HTTP POST)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
                className="input-field flex-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={testWebhook}
                disabled={testingWebhook}
                className="px-4 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs font-bold hover:bg-warning/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {testingWebhook ? 'Sending...' : 'Test Webhook'}
              </button>
            </div>
          </div>

          <SettingRow
            icon={Radio}
            label="Enable Automated Incident Dispatch"
            desc="Automatically push high-severity threat alerts to this webhook in real-time"
            value={settings.webhookAlerts}
            onChange={() => toggleSetting('webhookAlerts')}
          />

          <div className="p-3 bg-surface/50 border border-border/50 rounded-lg text-xs font-mono text-gray-400">
            <span className="text-gray-500">// Sample Dispatch Payload:</span>
            <div className="text-primary mt-1">{`{ "source": "NetGuard Pro SOC", "severity": "CRITICAL", "action": "BLOCKED & ISOLATED", "domain": "arnazon-security.xyz" }`}</div>
          </div>
        </div>
      </div>

      {/* Extension Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-safe" />
          Extension Telemetry &amp; Account
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-gray-500">Platform Build</span>
            <span className="text-gray-200 font-mono">v3.6.3 (Production)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-gray-500">Protection Code</span>
            <span className="text-primary font-mono">{user?.protectionCode || 'Not generated'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-gray-500">Member Since</span>
            <span className="text-gray-200">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role / Clearance</span>
            <span className={`font-medium ${user?.role === 'admin' ? 'text-warning' : 'text-primary'}`}>
              {user?.role === 'admin' ? 'System Administrator' : 'Standard User'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={saveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
