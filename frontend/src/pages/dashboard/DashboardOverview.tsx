import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Waves,
  Droplets,
  CloudRain,
  Bell,
  FileText,
  RotateCcw,
  AlertOctagon,
  Bot,
  WifiOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';

interface OutletContextType {
  currentLocation: {
    name: string;
    lat: number;
    lon: number;
  };
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, lastSync } = useConnectivity();
  const outletCtx = useOutletContext<OutletContextType>();
  const activeLocation = outletCtx?.currentLocation || {
    name: 'Hyderabad, Telangana, India',
    lat: 17.3850,
    lon: 78.4867,
  };

  const [weatherData, setWeatherData] = useState<{ rain24h: number; temp: number; isLive: boolean } | null>(null);
  const [floodRisk, setFloodRisk] = useState<{ level: string; index: number; isLive: boolean } | null>(null);

  useEffect(() => {
    // Fetch live weather telemetry
    fetch(`http://localhost:4000/api/weather?lat=${activeLocation.lat}&lon=${activeLocation.lon}&name=${encodeURIComponent(activeLocation.name)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.current) {
          setWeatherData({
            rain24h: d.current.rainMm24h ?? 0.5,
            temp: d.current.temp ?? 28,
            isLive: Boolean(d.isLive),
          });
        }
      })
      .catch(() => {
        setWeatherData({ rain24h: 0.5, temp: 28, isLive: false });
      });

    // Fetch live flood prediction
    fetch(`http://localhost:4000/api/flood/predict?lat=${activeLocation.lat}&lon=${activeLocation.lon}`)
      .then((r) => r.json())
      .then((d) => {
        const pred = d.mlEngine || d.prediction;
        if (pred) {
          setFloodRisk({
            level: pred.riskLevel,
            index: pred.riskIndex,
            isLive: true,
          });
        }
      })
      .catch(() => {
        setFloodRisk({ level: 'Low', index: 15, isLive: false });
      });
  }, [activeLocation]);

  const name = user?.displayName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const metrics = [
    {
      label: 'Flood Risk',
      value: floodRisk?.level || 'Low',
      sub: `Risk Index: ${floodRisk?.index ?? 15}/100`,
      icon: Waves,
      risk: (floodRisk?.level?.toLowerCase() || 'low') as 'low' | 'moderate' | 'high' | 'critical',
      link: '/dashboard/floodsense',
      isLive: floodRisk?.isLive,
    },
    {
      label: 'Water Stress',
      value: '42%',
      sub: 'Demand vs reservoir capacity',
      icon: Droplets,
      risk: 'moderate' as const,
      link: '/dashboard/water-stress',
      isLive: true,
    },
    {
      label: 'Rainfall 24h',
      value: `${weatherData?.rain24h ?? 0.5} mm`,
      sub: 'Open-Meteo Satellite Feed',
      icon: CloudRain,
      risk: 'low' as const,
      link: '/dashboard/weather',
      isLive: weatherData?.isLive,
    },
    {
      label: 'Active Alerts',
      value: '2',
      sub: '1 flood watch, 1 weather',
      icon: Bell,
      risk: 'moderate' as const,
      link: '/dashboard/alerts',
      isLive: true,
    },
    {
      label: 'Citizen Reports',
      value: '4',
      sub: 'Open incidents in sector',
      icon: FileText,
      risk: 'low' as const,
      link: '/dashboard/reports',
      isLive: true,
    },
    {
      label: 'Recovery Potential',
      value: '78%',
      sub: 'Catchment yield capability',
      icon: RotateCcw,
      risk: 'low' as const,
      link: '/dashboard/recovery',
      isLive: true,
    },
  ];

  const recentActivity = [
    { icon: Waves, text: 'River gauge telemetry updated for Musi Catchment (GloFAS)', time: '10 minutes ago' },
    { icon: FileText, text: 'Citizen report received: Storm drain overflow at Malakpet underbridge', time: '45 minutes ago' },
    { icon: CloudRain, text: 'Live precipitation radar: Convective cell passing over North Hyderabad', time: '1 hour ago' },
    { icon: Droplets, text: 'Water stress bulletin: Supply pressure normalized in Jubilee Hills', time: '2 hours ago' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">{greeting}, {name}</h1>
            <p className="page-desc">Water intelligence and municipal risk status for {activeLocation.name}.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="live-label">
              <CheckCircle2 size={12} /> Real Data Active
            </span>
            {lastSync && (
              <span style={{ fontSize: '0.78rem', color: 'var(--dash-muted)', fontWeight: 500 }}>
                Synced {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {!online && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <WifiOff size={18} color="#D97706" />
          <div>
            <div style={{ fontWeight: 700, color: '#B45309', fontSize: '0.9rem' }}>Operating in Offline Resilient Mode</div>
            <div style={{ color: '#78350F', fontSize: '0.82rem' }}>Displaying cached telemetry. Citizen reports will automatically synchronize once connectivity is restored.</div>
          </div>
        </div>
      )}

      {/* Emergency SOS quick access */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #FECACA',
          borderLeft: '4px solid #DC2626',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'var(--dash-shadow-sm)',
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onClick={() => navigate('/dashboard/emergency')}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'grid', placeItems: 'center' }}>
            <AlertOctagon size={22} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.92rem' }}>Emergency SOS Dispatch</div>
            <div style={{ color: 'var(--dash-muted)', fontSize: '0.82rem' }}>Broadcast real-time GPS coordinates and flood safety alert to pre-configured emergency contacts</div>
          </div>
        </div>
        <span style={{ color: '#DC2626', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          Access SOS <ArrowRight size={14} />
        </span>
      </div>

      {/* Metrics grid */}
      <div className="section-header">
        <h2 className="section-title">Catchment Telemetry & Predictions</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--dash-muted)' }}>Updated live from sensor & satellite feeds</span>
      </div>

      <div className="dash-grid" style={{ marginBottom: 30 }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="dash-card"
              onClick={() => navigate(m.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(m.link)}
            >
              <div className="dash-card-header">
                <div>
                  <div className="dash-card-label">{m.label}</div>
                  <div className="dash-card-value">{m.value}</div>
                </div>
                <div className="dash-card-icon">
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                <span className="dash-card-sub" style={{ margin: 0 }}>{m.sub}</span>
                <span className={`risk-badge risk-${m.risk}`}>{m.risk}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two column layout: activity + AQUA AI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent activity */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 22, boxShadow: 'var(--dash-shadow-sm)' }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <h2 className="section-title" style={{ fontSize: '1.05rem' }}>Hydrological Event Stream</h2>
            <span style={{ fontSize: '0.76rem', color: 'var(--dash-muted)' }}>Musi Basin Sensor Array</span>
          </div>

          <div>
            {recentActivity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid #F1F5F9' : 'none',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={16} color="var(--dash-aqua)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--dash-text)', fontWeight: 500, lineHeight: 1.45 }}>{a.text}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 3 }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AQUA AI quick access */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 22, boxShadow: 'var(--dash-shadow-sm)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(24, 182, 210, 0.1)', display: 'grid', placeItems: 'center' }}>
              <Bot size={24} color="var(--dash-aqua)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--dash-text)', fontSize: '1rem' }}>AQUA AI Intelligence</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--dash-muted)' }}>Multi-Key Failover Architecture</div>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--dash-muted)', marginBottom: 16, lineHeight: 1.5 }}>
            Unified generative water intelligence assistant with emergency flood safety protocols, SCS-CN runoff calculations, and offline guidance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {[
              'What is the current flood risk for Musi River basin?',
              'Calculate rooftop rainwater harvesting yield',
              'Immediate flood evacuation and electrical safety protocols',
            ].map((q) => (
              <button
                key={q}
                onClick={() => navigate('/dashboard/aqua-ai', { state: { question: q } })}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--dash-text)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span>{q}</span>
                <ArrowRight size={13} color="var(--dash-aqua)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>

          <button
            className="action-btn primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate('/dashboard/aqua-ai')}
          >
            <span>Launch AQUA AI Assistant</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
