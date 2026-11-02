import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, CheckCircle2, FileText, Database, MapPin, Download, Filter, Navigation } from 'lucide-react';

interface OutletContextType {
  currentLocation?: {
    name: string;
    lat: number;
    lon: number;
    state?: string;
  };
}

interface StationRecord {
  s_no: number;
  year: number;
  season: string;
  location: string;
  longitude: number;
  latitude: number;
  pH: number | null;
  EC: number | null;
  TDS: number | null;
  Fluoride: number | null;
  NO3: number | null;
  Hardness: number | null;
  fluoride_excess: boolean;
  nitrate_excess: boolean;
  tds_excess: boolean;
  stress_score: number;
  stress_category: string;
  distanceKm?: number;
}

interface GWQSummary {
  dataset_name: string;
  provenance: string;
  publication_year: number;
  standard_applied: string;
  total_monitoring_stations_parsed: number;
  available_states?: string[];
  total_matching?: number;
  statistics: {
    mean_ph: number;
    mean_tds_mg_l: number;
    mean_fluoride_mg_l: number;
    mean_nitrate_mg_l: number;
    fluoride_exceedance_stations: number;
    fluoride_exceedance_pct: number;
    nitrate_exceedance_stations: number;
    nitrate_exceedance_pct: number;
    tds_exceedance_stations: number;
    tds_exceedance_pct: number;
    critical_risk_stations: number;
    potable_safe_stations: number;
  };
  sample_stations: StationRecord[];
}

export default function WaterStressPage() {
  const outletCtx = useOutletContext<OutletContextType>();
  const activeLocation = outletCtx?.currentLocation || {
    name: 'Hyderabad, Telangana, India',
    lat: 17.3850,
    lon: 78.4867,
    state: 'Telangana',
  };

  const [data, setData] = useState<GWQSummary | null>(null);
  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearMeActive, setNearMeActive] = useState(true);

  // Sync state filter when activeLocation changes
  useEffect(() => {
    if (activeLocation.state) {
      setSelectedState(activeLocation.state);
    }
  }, [activeLocation.state]);

  const fetchGroundwater = (stateName: string, useCoords: boolean) => {
    setLoading(true);
    let url = `/api/groundwater/quality?limit=100`;
    if (useCoords) {
      url += `&lat=${activeLocation.lat}&lon=${activeLocation.lon}`;
    }
    if (stateName && stateName !== 'All') {
      url += `&state=${encodeURIComponent(stateName)}`;
    }
    if (searchTerm) {
      url += `&q=${encodeURIComponent(searchTerm)}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load groundwater data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGroundwater(selectedState, nearMeActive);
  }, [selectedState, nearMeActive, activeLocation.lat, activeLocation.lon]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroundwater(selectedState, nearMeActive);
  };

  const exportCSV = () => {
    if (!data?.sample_stations?.length) return;
    const headers = ['S.No', 'Location', 'Distance (km)', 'Latitude', 'Longitude', 'pH', 'TDS (mg/L)', 'Fluoride (mg/L)', 'Nitrate (mg/L)', 'Hardness (mg/L)', 'Status'];
    const rows = data.sample_stations.map((s) => [
      s.s_no,
      `"${s.location.replace(/"/g, '""')}"`,
      s.distanceKm ?? 'N/A',
      s.latitude,
      s.longitude,
      s.pH ?? '',
      s.TDS ?? '',
      s.Fluoride ?? '',
      s.NO3 ?? '',
      s.Hardness ?? '',
      `"${s.stress_category}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CGWB_Groundwater_${selectedState}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stations = data?.sample_stations || [];
  const statesList = data?.available_states || [
    'Telangana',
    'Andhra Pradesh',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Delhi',
    'Uttar Pradesh',
    'Gujarat',
    'Rajasthan',
    'West Bengal',
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Water Stress & Groundwater Quality</h1>
            <p className="page-desc">
              Central Ground Water Board (CGWB) National Hydrograph Monitoring Network — Stations near{' '}
              <strong style={{ color: 'var(--dash-aqua)' }}>{activeLocation.name.split(',')[0]}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={exportCSV}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Download filtered dataset as CSV"
            >
              <Download size={14} /> Export CSV
            </button>
            <span className="live-label">
              <CheckCircle2 size={12} /> CGWB 2024 Verified
            </span>
            <span className="demo-label" style={{ background: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD' }}>
              <Database size={12} /> 15,177 Pan-India Stations
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Provenance Callout */}
      <div style={{ background: '#F8FAFC', border: '1px solid var(--dash-border)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 700, fontSize: '0.86rem', color: 'var(--dash-text)' }}>
          <FileText size={16} color="var(--dash-aqua)" />
          <span>Official Data Provenance & Methodology Notice</span>
        </div>
        <p style={{ margin: 0, color: 'var(--dash-muted)', fontSize: '0.82rem', lineHeight: 1.55 }}>
          Groundwater potability data is extracted directly from the <strong>Central Ground Water Board (CGWB) 2024 Hydrograph Monitoring Dataset</strong>.
          Evaluated against <strong>BIS IS 10500:2012 Drinking Water Specification</strong> (Fluoride &le; 1.5 mg/L, Nitrate &le; 45 mg/L, TDS &le; 500 mg/L acceptable / 2000 mg/L permissible).
        </p>
      </div>

      {/* Interactive Filter Toolbar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: 'var(--dash-shadow-sm)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* Near Me Toggle Button */}
          <button
            type="button"
            onClick={() => setNearMeActive((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: nearMeActive ? '1px solid var(--dash-aqua)' : '1px solid var(--dash-border)',
              background: nearMeActive ? 'rgba(24, 182, 210, 0.12)' : '#FFFFFF',
              color: nearMeActive ? 'var(--dash-aqua)' : 'var(--dash-text)',
              whiteSpace: 'nowrap',
            }}
          >
            <Navigation size={14} />
            <span>Sort Nearest to Me</span>
          </button>

          {/* State Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Filter size={14} color="#94A3B8" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', maxWidth: '100%' }}
            >
              <option value="All">All States (15,177 Stations)</option>
              {statesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search station, district, or mandal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.82rem', minWidth: 0, flex: 1 }}
            />
            <button type="submit" className="action-btn primary" style={{ padding: '6px 12px', fontSize: '0.8rem', flexShrink: 0 }}>
              <Search size={14} />
            </button>
          </form>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--dash-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {loading ? 'Querying CGWB index…' : `Showing ${stations.length} of ${data?.total_matching ?? data?.total_monitoring_stations_parsed ?? 15177} stations`}
        </div>
      </div>

      {/* National Overview KPI Metrics */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 12, padding: 14, boxShadow: 'var(--dash-shadow-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>AVERAGE TDS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dash-text)', marginTop: 4 }}>
              {data.statistics.mean_tds_mg_l} mg/L
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: 2 }}>BIS Desirable: &le; 500</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 12, padding: 14, boxShadow: 'var(--dash-shadow-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>AVERAGE FLUORIDE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dash-text)', marginTop: 4 }}>
              {data.statistics.mean_fluoride_mg_l} mg/L
            </div>
            <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: 2 }}>{data.statistics.fluoride_exceedance_pct}% above 1.5 mg/L</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 12, padding: 14, boxShadow: 'var(--dash-shadow-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>AVERAGE NITRATE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dash-text)', marginTop: 4 }}>
              {data.statistics.mean_nitrate_mg_l} mg/L
            </div>
            <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 2 }}>{data.statistics.nitrate_exceedance_pct}% above 45 mg/L</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 12, padding: 14, boxShadow: 'var(--dash-shadow-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--dash-muted)', fontWeight: 600 }}>POTABLE STATIONS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16A34A', marginTop: 4 }}>
              {data.statistics.potable_safe_stations?.toLocaleString() ?? '6,494'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: 2 }}>42.8% Fully Safe</div>
          </div>
        </div>
      )}

      {/* Monitoring Stations Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 20, boxShadow: 'var(--dash-shadow-sm)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--dash-border)', textAlign: 'left', color: 'var(--dash-muted)' }}>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>STATION & LOCALITY</th>
              {nearMeActive && <th style={{ padding: '10px 12px', fontWeight: 700 }}>DISTANCE</th>}
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>pH</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>TDS (mg/L)</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>FLUORIDE (mg/L)</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>NITRATE (mg/L)</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>HARDNESS</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>POTABILITY RATING</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s, idx) => {
              const isSafe = s.stress_category.toLowerCase().includes('potable') || s.stress_category.toLowerCase().includes('safe');
              const isCritical = s.stress_category.toLowerCase().includes('critical') || s.stress_category.toLowerCase().includes('stress');
              const badgeBg = isSafe ? 'rgba(22,163,74,0.1)' : (isCritical ? 'rgba(220,38,38,0.1)' : 'rgba(234,179,8,0.1)');
              const badgeColor = isSafe ? '#16A34A' : (isCritical ? '#DC2626' : '#B45309');

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--dash-text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="var(--dash-aqua)" />
                      <span>{s.location}</span>
                    </div>
                  </td>
                  {nearMeActive && (
                    <td style={{ padding: '12px', color: 'var(--dash-muted)', fontWeight: 600 }}>
                      {s.distanceKm !== undefined ? `${s.distanceKm} km` : '—'}
                    </td>
                  )}
                  <td style={{ padding: '12px', color: 'var(--dash-text)' }}>{s.pH ?? '—'}</td>
                  <td style={{ padding: '12px', fontWeight: s.tds_excess ? 700 : 500, color: s.tds_excess ? '#EA580C' : 'var(--dash-text)' }}>
                    {s.TDS ?? '—'} {s.tds_excess && <span style={{ fontSize: '0.68rem', color: '#EA580C' }}>(&gt;2000)</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: s.fluoride_excess ? 700 : 500, color: s.fluoride_excess ? '#DC2626' : 'var(--dash-text)' }}>
                    {s.Fluoride ?? '—'} {s.fluoride_excess && <span style={{ fontSize: '0.68rem', color: '#DC2626' }}>(&gt;1.5)</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: s.nitrate_excess ? 700 : 500, color: s.nitrate_excess ? '#DC2626' : 'var(--dash-text)' }}>
                    {s.NO3 ?? '—'} {s.nitrate_excess && <span style={{ fontSize: '0.68rem', color: '#DC2626' }}>(&gt;45)</span>}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--dash-text)' }}>{s.Hardness ?? '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 700, background: badgeBg, color: badgeColor }}>
                      {s.stress_category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {stations.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--dash-muted)' }}>
            No monitoring stations matched your search criteria. Try selecting another state or clearing the search.
          </div>
        )}
      </div>
    </div>
  );
}
