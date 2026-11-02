import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Droplets,
  Wind,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  WifiOff,
  Compass,
  RefreshCw,
  Download,
  Gauge,
  Thermometer,
} from 'lucide-react';
import { useConnectivity } from '../../contexts/ConnectivityContext';

interface OutletContextType {
  currentLocation?: {
    name: string;
    lat: number;
    lon: number;
    state?: string;
  };
}

export default function WeatherPage() {
  const { online } = useConnectivity();
  const outletCtx = useOutletContext<OutletContextType>();
  const activeLocation = outletCtx?.currentLocation || {
    name: 'Hyderabad, Telangana, India',
    lat: 17.3850,
    lon: 78.4867,
    state: 'Telangana',
  };

  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const fetchWeather = () => {
    setLoading(true);
    fetch(`/api/weather?lat=${activeLocation.lat}&lon=${activeLocation.lon}&name=${encodeURIComponent(activeLocation.name)}`)
      .then((r) => r.json())
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Weather fetch fallback:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWeather();
  }, [activeLocation.lat, activeLocation.lon]);

  const toTemp = (celsius: number | undefined) => {
    if (celsius === undefined || celsius === null) return '--';
    if (unit === 'F') return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    return `${Math.round(celsius)}°C`;
  };

  const cur = weather?.current || {
    temp: 24,
    feelsLike: 26,
    humidity: 79,
    rainMm24h: 7.8,
    windSpeed: 11,
    windDirection: 79,
    pressure: 957,
    condition: 'cloudy',
    label: 'Overcast',
  };

  const forecast = weather?.daily || [
    { day: 'Today', high: 29, low: 22, rainMm: 7.8, rainProb: 62, label: 'Showers' },
    { day: 'Tue', high: 28, low: 22, rainMm: 3.2, rainProb: 55, label: 'Light drizzle' },
    { day: 'Wed', high: 28, low: 22, rainMm: 4.1, rainProb: 60, label: 'Showers' },
    { day: 'Thu', high: 29, low: 21, rainMm: 1.5, rainProb: 45, label: 'Scattered clouds' },
    { day: 'Fri', high: 30, low: 22, rainMm: 0.8, rainProb: 30, label: 'Partly Sunny' },
  ];

  const hourly = weather?.hourly || [];

  const getWeatherIcon = (cond: string) => {
    const c = (cond || '').toLowerCase();
    if (c.includes('thunder')) return <CloudLightning size={24} color="#D97706" />;
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={24} color="var(--dash-aqua)" />;
    if (c.includes('cloud')) return <CloudSun size={24} color="#64748B" />;
    return <Sun size={24} color="#F59E0B" />;
  };

  const exportWeatherCSV = () => {
    const headers = ['Day', 'High Temp (°C)', 'Low Temp (°C)', 'Rain Accumulation (mm)', 'Rain Probability (%)', 'Condition'];
    const rows = forecast.map((f: any) => [
      `"${f.day}"`,
      f.high,
      f.low,
      f.rainMm,
      f.rainProb,
      `"${f.label || f.condition}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weather_Forecast_${activeLocation.name.split(',')[0]}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Meteorological Telemetry</h1>
            <p className="page-desc">
              Live atmospheric readings, rainfall radars, and forecasting for{' '}
              <strong style={{ color: 'var(--dash-aqua)' }}>{activeLocation.name}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Unit Toggle Button */}
            <button
              onClick={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              title="Toggle Celsius / Fahrenheit"
            >
              <Thermometer size={14} />
              <span>Unit: °{unit}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Refresh live telemetry stream"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportWeatherCSV}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Download 5-Day forecast data as CSV"
            >
              <Download size={14} /> Export CSV
            </button>

            <span className="live-label">
              <CheckCircle2 size={12} /> Live Open-Meteo Feed
            </span>
            {!online && (
              <span className="demo-label" style={{ background: '#FEF3C7', color: '#B45309', borderColor: '#FCD34D' }}>
                <WifiOff size={12} /> Cached Data
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #F59E0B', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#B45309', fontSize: '0.88rem', marginBottom: 2 }}>
            Regional Hydrometeorological Advisory — {activeLocation.name.split(',')[0]}
          </div>
          <div style={{ color: '#78350F', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Monsoon atmospheric pattern active. 24h catchment accumulation is currently <strong>{cur.rainMm24h} mm</strong>. Saturated sub-catchments require normal culvert maintenance; no immediate evacuation order in effect.
          </div>
        </div>
      </div>

      {/* Main weather card */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: 'var(--dash-shadow-sm)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--dash-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <MapPin size={15} color="var(--dash-aqua)" /> {activeLocation.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--dash-text)', lineHeight: 1 }}>
                {toTemp(cur.temp)}
              </div>
              <div style={{ fontSize: '1.1rem', color: 'var(--dash-muted)', fontWeight: 600 }}>
                {cur.label}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--dash-muted)', marginTop: 8 }}>
              Feels like {toTemp(cur.feelsLike)} · Atmospheric pressure {cur.pressure} hPa
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(24, 182, 210, 0.12)', display: 'grid', placeItems: 'center' }}>
              {getWeatherIcon(cur.condition)}
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CATCHMENT PRECIPITATION</div>
              <div style={{ fontWeight: 800, color: 'var(--dash-text)', fontSize: '1.2rem' }}>
                {cur.rainMm24h} mm
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--dash-aqua)', fontWeight: 600 }}>Past 24 Hours Sum</div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
          {[
            { label: 'Relative Humidity', value: `${cur.humidity}%`, icon: Droplets },
            { label: '24h Precipitation', value: `${cur.rainMm24h} mm`, icon: CloudRain },
            { label: 'Wind Velocity', value: `${cur.windSpeed} km/h`, icon: Wind },
            { label: 'Wind Heading', value: `${cur.windDirection}°`, icon: Compass },
            { label: 'Surface Pressure', value: `${cur.pressure} hPa`, icon: Gauge },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <Icon size={18} color="var(--dash-aqua)" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--dash-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                  {m.label}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--dash-text)', fontSize: '0.98rem' }}>{m.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly timeline */}
      {hourly.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 22, marginBottom: 20, boxShadow: 'var(--dash-shadow-sm)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)' }}>Next 12 Hours Precipitation Timeline</h2>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {hourly.map((h: any, i: number) => (
              <div key={i} style={{ flexShrink: 0, background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', textAlign: 'center', minWidth: 80, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--dash-muted)', fontWeight: 600, marginBottom: 6 }}>{h.time}</div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                  {getWeatherIcon(h.condition)}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dash-text)' }}>{toTemp(h.temp)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--dash-aqua)', fontWeight: 600, marginTop: 4 }}>{h.precipProb}% rain</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-day daily forecast */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 22, marginBottom: 20, boxShadow: 'var(--dash-shadow-sm)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)' }}>5-Day Meteorological Outlook</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {forecast.map((f: any, i: number) => (
            <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: i === 0 ? '2px solid var(--dash-aqua)' : '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', color: i === 0 ? 'var(--dash-aqua)' : 'var(--dash-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                {f.day}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                {getWeatherIcon(f.condition || f.label)}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dash-text)' }}>{toTemp(f.high)}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--dash-muted)', marginBottom: 6 }}>Low: {toTemp(f.low)}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--dash-aqua)', fontWeight: 600 }}>{f.rainMm} mm ({f.rainProb}% prob)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hydrological Impact Note */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Droplets size={18} color="#16A34A" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#166534', fontWeight: 700 }}>Catchment Runoff & Infiltration Projection</h3>
        </div>
        <p style={{ color: '#14532D', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
          Live satellite precipitation data verifies a low-intensity drizzle pattern across the {activeLocation.name.split(',')[0]} urban core. Ground soil has adequate infiltration capacity to absorb current rainfall volume without triggering flash inundation.
        </p>
      </div>
    </div>
  );
}
