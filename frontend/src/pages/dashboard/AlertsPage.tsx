import { Waves, CloudLightning, Droplets, Wrench, Zap, WifiOff, MapPin, Clock, Radio } from 'lucide-react';
import { useConnectivity } from '../../contexts/ConnectivityContext';

const DEMO_ALERTS = [
  {
    id: 1, severity: 'critical', type: 'Flood', icon: Waves,
    title: 'Critical Flood Alert — Musi River Basin',
    desc: 'Water levels in Musi River have exceeded danger threshold. Immediate evacuation protocol advised for riverside lowlands.',
    location: 'Musi River, Central Hyderabad',
    source: 'NDMA / Hydrological Sensor Network',
    time: '2 hours ago',
    action: 'Evacuate immediately. Move to designated high ground. Do not attempt crossing flooded roadways.',
  },
  {
    id: 2, severity: 'high', type: 'Flood', icon: Waves,
    title: 'High Flood Risk — Mir Alam Tank Inundation',
    desc: 'Mir Alam Tank approaching overflow capacity. Low-lying zones within 2km perimeter are at elevated flood risk.',
    location: 'Mir Alam Tank, Old City',
    source: 'Municipal Lake Protection Committee',
    time: '4 hours ago',
    action: 'Monitor water levels continuously. Prepare emergency kit. Stand by for evacuation alerts.',
  },
  {
    id: 3, severity: 'high', type: 'Weather', icon: CloudLightning,
    title: 'Severe Storm Warning — 48 Hour Window',
    desc: 'IMD has issued an active storm advisory with localized heavy downpours forecasted across Greater Hyderabad.',
    location: 'Greater Hyderabad Metropolitan Area',
    source: 'India Meteorological Department',
    time: '5 hours ago',
    action: 'Remain indoors during torrential spells. Avoid underground parking facilities and basement structures.',
  },
  {
    id: 4, severity: 'moderate', type: 'Water', icon: Droplets,
    title: 'Scheduled Water Supply Disruption',
    desc: 'Main aqueduct maintenance affecting supply in Secunderabad sectors. Estimated maintenance window: 8 hours.',
    location: 'Secunderabad Sector 4 & 5',
    source: 'HMWSSB Operations Division',
    time: '6 hours ago',
    action: 'Reserve necessary potable water before 08:00 hrs. Emergency tanker support available via 1916.',
  },
  {
    id: 5, severity: 'low', type: 'Infrastructure', icon: Wrench,
    title: 'Storm Drainage Clearance Operations',
    desc: 'Preventative culvert and storm channel cleaning scheduled in Banjara Hills. Minor traffic diversion expected.',
    location: 'Banjara Hills Road No. 12',
    source: 'GHMC Engineering Wing',
    time: '1 day ago',
    action: 'Use alternate arterial routes. Report obstructed channels via Citizen Incident portal.',
  },
];

const SEVERITY_BG: Record<string, string> = {
  critical: '#FEF2F2',
  high: '#FFF7ED',
  moderate: '#FEFCE8',
  low: '#ECFDF5',
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: '#FECACA',
  high: '#FED7AA',
  moderate: '#FEF08A',
  low: '#A7F3D0',
};

const SEVERITY_ICON_BG: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  moderate: '#D97706',
  low: '#059669',
};

export default function AlertsPage() {
  const { online } = useConnectivity();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Active Alerts & Advisories</h1>
            <p className="page-desc">Real-time flood warnings, meteorological alerts, and municipal water advisories.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="demo-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Zap size={12} /> Demo Data
            </span>
            {!online && (
              <span className="demo-label" style={{ background: 'rgba(255,140,0,0.12)', color: '#D97706', borderColor: 'rgba(255,140,0,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <WifiOff size={12} /> Cached Telemetry
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Critical', count: 1, color: '#ff4444' },
          { label: 'High', count: 2, color: '#ff7850' },
          { label: 'Moderate', count: 1, color: '#D97706' },
          { label: 'Low', count: 1, color: '#39D8D0' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '0.82rem', color: '#334155' }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--dash-text)', fontSize: '0.95rem' }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEMO_ALERTS.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              style={{ background: SEVERITY_BG[alert.severity], border: `1px solid ${SEVERITY_BORDER[alert.severity]}`, borderRadius: 16, padding: 20 }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: SEVERITY_ICON_BG[alert.severity] || 'var(--dash-aqua)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  <Icon size={20} color="#ffffff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--dash-text)' }}>{alert.title}</h3>
                    <span className={`risk-badge risk-${alert.severity}`}>{alert.severity}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', padding: '2px 8px', borderRadius: 6 }}>{alert.type}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', color: '#334155', fontSize: '0.88rem', lineHeight: 1.55 }}>{alert.desc}</p>

                  <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Action Protocol</div>
                    <div style={{ fontSize: '0.88rem', color: '#334155' }}>{alert.action}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#94A3B8', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {alert.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {alert.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Radio size={12} /> {alert.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', marginTop: 24 }}>
        Simulated advisory feed — in production, feeds directly sync with NDMA and state disaster management channels.
      </p>
    </div>
  );
}
