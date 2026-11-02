import { useState, useEffect } from 'react';
import { Bell, MapPin, Sliders, Database, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? 'var(--dash-aqua)' : '#CBD5E1',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

const DEFAULT_SETTINGS = {
  floodAlerts: true,
  weatherAlerts: true,
  emergencyAlerts: true,
  waterAlerts: false,
  location: 'Hyderabad, Telangana, India',
  units: 'metric',
  dataRefresh: '15',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('aquanetx_settings');
    if (stored) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }); } catch { /* use defaults */ }
    }
  }, []);

  const save = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('aquanetx_settings', JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggle = (key: keyof typeof settings) =>
    save({ ...settings, [key]: !settings[key as keyof typeof settings] });

  const clearCache = async () => {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-desc">Configure notifications, location, and app behavior.</p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(57,216,208,0.12)', border: '1px solid rgba(57,216,208,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: 'var(--turq)', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> Settings saved
        </div>
      )}

      {/* Notifications */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="var(--turq)" /> Alert Notifications
        </h2>
        {([
          { key: 'floodAlerts', label: 'Flood Alerts', desc: 'Get notified of flood risk changes' },
          { key: 'weatherAlerts', label: 'Weather Alerts', desc: 'Severe weather and storm warnings' },
          { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Critical safety notifications (always recommended)' },
          { key: 'waterAlerts', label: 'Water Supply Alerts', desc: 'Scheduled disruptions and shortages' },
        ] as const).map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dash-border)' }}>
            <div>
              <div style={{ fontSize: '0.92rem', color: 'var(--dash-text)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--dash-muted)', marginTop: 2 }}>{item.desc}</div>
            </div>
            <Toggle checked={!!settings[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>

      {/* Location */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="var(--turq)" /> Location
        </h2>
        <div className="form-group">
          <label className="form-label">Default Monitoring Location</label>
          <input
            className="form-input"
            value={settings.location}
            onChange={(e) => setSettings((s) => ({ ...s, location: e.target.value }))}
            onBlur={() => save(settings)}
            placeholder="City, State, Country"
          />
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>
            Used when GPS is unavailable or denied. Default: Hyderabad, Telangana, India.
          </div>
        </div>
      </div>

      {/* Units & Data */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} color="var(--turq)" /> Data & Display
        </h2>
        <div className="form-group">
          <label className="form-label">Units</label>
          <select className="form-select" value={settings.units} onChange={(e) => save({ ...settings, units: e.target.value })}>
            <option value="metric">Metric (°C, mm, km/h)</option>
            <option value="imperial">Imperial (°F, in, mph)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Data Refresh Interval</label>
          <select className="form-select" value={settings.dataRefresh} onChange={(e) => save({ ...settings, dataRefresh: e.target.value })}>
            <option value="5">Every 5 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="60">Every hour</option>
          </select>
        </div>
      </div>

      {/* Storage */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} color="var(--turq)" /> Storage & Sync
        </h2>
        {cacheCleared && (
          <div style={{ color: 'var(--turq)', fontSize: '0.88rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> Cache cleared successfully.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="action-btn ghost" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={clearCache}>
            <Trash2 size={14} /> Clear Cache
          </button>
          <button className="action-btn ghost" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Sync Now
          </button>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: 12 }}>
          Clearing cache will remove offline data. Your submitted reports are stored separately and won't be affected.
        </p>
      </div>
    </div>
  );
}
