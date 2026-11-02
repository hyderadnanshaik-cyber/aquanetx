import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ListFilter,
  Plus,
  MapPin,
  Navigation,
  Send,
  CheckCircle2,
  WifiOff,
  Download,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import { db, type CitizenReport } from '../../db';

interface OutletContextType {
  currentLocation?: {
    name: string;
    lat: number;
    lon: number;
    state?: string;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Incidents' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'waterlogging', label: 'Waterlogging' },
  { value: 'drainage', label: 'Blocked Drainage' },
  { value: 'shortage', label: 'Water Shortage' },
  { value: 'contamination', label: 'Contaminated Water' },
  { value: 'infrastructure', label: 'Damaged Pipes' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
  { value: 'critical', label: 'Critical Risk' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_local: { label: 'Saved Locally (IndexedDB)', color: '#D97706' },
  pending_sync: { label: 'Pending Sync', color: '#D97706' },
  received: { label: 'Verified by Server', color: '#16A34A' },
  under_review: { label: 'Under Review', color: '#0284C7' },
  resolved: { label: 'Resolved', color: '#16A34A' },
};

const SEED_REPORTS: CitizenReport[] = [
  {
    userId: 'system-seed-1',
    category: 'waterlogging',
    description: 'Koti Women’s College road waterlogged up to 30 cm after evening rain. Traffic slowed.',
    severity: 'high',
    lat: 17.3854,
    lng: 78.4862,
    address: 'Koti Main Road, Hyderabad',
    status: 'received',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    userId: 'system-seed-2',
    category: 'drainage',
    description: 'Stormwater culvert clogged with silt and debris near Hussain Sagar outflow.',
    severity: 'medium',
    lat: 17.4239,
    lng: 78.4738,
    address: 'Tank Bund Road, Hyderabad',
    status: 'under_review',
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    userId: 'system-seed-3',
    category: 'flooding',
    description: 'Musi riverbed lowlands experiencing standing water accumulation near causeway.',
    severity: 'critical',
    lat: 17.3616,
    lng: 78.4747,
    address: 'Chaderghat Causeway, Hyderabad',
    status: 'received',
    createdAt: Date.now() - 3600000 * 9,
  },
];

export default function CitizenReportsPage() {
  const { user } = useAuth();
  const { online, incrementPending } = useConnectivity();
  const outletCtx = useOutletContext<OutletContextType>();
  const activeLocation = outletCtx?.currentLocation || {
    name: 'Hyderabad, Telangana, India',
    lat: 17.3850,
    lon: 78.4867,
    state: 'Telangana',
  };

  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'submit'>('list');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Form state
  const [category, setCategory] = useState('flooding');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [lat, setLat] = useState<number | undefined>(activeLocation.lat);
  const [lng, setLng] = useState<number | undefined>(activeLocation.lon);
  const [address, setAddress] = useState(activeLocation.name);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    let rows: CitizenReport[] = [];
    if (user) {
      rows = await db.citizenReports.where('userId').equals(user.uid).reverse().sortBy('createdAt');
    }
    if (rows.length === 0) {
      // Seed default reports if IndexedDB is empty
      rows = SEED_REPORTS;
    }
    setReports(rows);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setAddress('GPS not supported on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAddress(`${pos.coords.latitude.toFixed(5)}°N, ${pos.coords.longitude.toFixed(5)}°E (${activeLocation.name.split(',')[0]})`);
        setLocating(false);
      },
      () => {
        setAddress(activeLocation.name);
        setLat(activeLocation.lat);
        setLng(activeLocation.lon);
        setLocating(false);
      }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Please describe the incident.';
    if (description.trim().length < 6) e.description = 'Description must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const reportLat = lat || activeLocation.lat;
    const reportLon = lng || activeLocation.lon;
    const reportAddress = address || activeLocation.name;

    try {
      const report: CitizenReport = {
        userId: user?.uid || 'guest-user',
        category: category as CitizenReport['category'],
        description: description.trim(),
        severity: severity as CitizenReport['severity'],
        lat: reportLat,
        lng: reportLon,
        address: reportAddress,
        status: online ? 'received' : 'pending_local',
        createdAt: Date.now(),
      };

      await db.citizenReports.add(report);
      if (!online) incrementPending();

      // Submit to backend server
      if (online) {
        try {
          const token = user && !user.isDemo ? await (await import('firebase/auth')).getAuth().currentUser?.getIdToken() : 'demo';
          await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              description: report.description,
              category: report.category,
              severity: report.severity,
              location: {
                lat: reportLat,
                lon: reportLon,
                address: reportAddress,
              },
              lat: reportLat,
              lng: reportLon,
              localReportId: `rep-${Date.now()}`,
            }),
          });
        } catch (serverErr) {
          console.warn('[CitizenReports] Server sync error:', serverErr);
        }
      }

      setSuccess(true);
      setDescription('');
      await loadReports();
      setActiveTab('list');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setErrors({ form: err.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (reportItem: CitizenReport, idx: number) => {
    if (reportItem.id) {
      const newStatus = reportItem.status === 'resolved' ? 'received' : 'resolved';
      await db.citizenReports.update(reportItem.id, { status: newStatus });
    }
    setReports((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, status: r.status === 'resolved' ? 'received' : 'resolved' } : r))
    );
  };

  const exportCSV = () => {
    if (!reports.length) return;
    const headers = ['Category', 'Severity', 'Description', 'Address', 'Latitude', 'Longitude', 'Status', 'Timestamp'];
    const rows = reports.map((r) => [
      `"${r.category}"`,
      `"${r.severity}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.address || ''}"`,
      r.lat ?? '',
      r.lng ?? '',
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Citizen_Reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = selectedFilter === 'all'
    ? reports
    : reports.filter((r) => r.category.toLowerCase() === selectedFilter.toLowerCase());

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Citizen Incident Reports</h1>
            <p className="page-desc">
              Crowdsourced flood observations, drainage blockages, and water contamination reports in{' '}
              <strong style={{ color: 'var(--dash-aqua)' }}>{activeLocation.name.split(',')[0]}</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={exportCSV}
              className="action-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Download reports as CSV"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              className="action-btn primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setActiveTab(activeTab === 'list' ? 'submit' : 'list')}
            >
              {activeTab === 'list' ? <><Plus size={15} /> New Incident Report</> : <><ListFilter size={15} /> View All Reports</>}
            </button>
            {!online && (
              <span className="demo-label" style={{ background: '#FEF3C7', color: '#B45309', borderColor: '#FCD34D' }}>
                <WifiOff size={12} /> Offline Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: '0.86rem' }}>
          <CheckCircle2 size={16} />
          <span>Incident report filed successfully! Coordinates and details logged to municipal database.</span>
        </div>
      )}

      {/* Filter Tabs */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedFilter(c.value)}
              className="action-btn"
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedFilter === c.value ? 'var(--dash-aqua)' : '#FFFFFF',
                border: `1px solid ${selectedFilter === c.value ? 'var(--dash-aqua)' : 'var(--dash-border)'}`,
                color: selectedFilter === c.value ? '#FFFFFF' : 'var(--dash-text)',
                boxShadow: 'var(--dash-shadow-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Reports List */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReports.map((r, i) => {
            const statusInfo = STATUS_LABELS[r.status] || { label: r.status, color: '#64748B' };
            const isCritical = r.severity === 'critical';
            const isResolved = r.status === 'resolved';

            return (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: isCritical ? '1px solid #FCA5A5' : '1px solid var(--dash-border)',
                  borderLeft: `5px solid ${isCritical ? '#DC2626' : (r.severity === 'high' ? '#EA580C' : '#18B6D2')}`,
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: 'var(--dash-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--dash-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
                      {r.category}
                    </span>
                    <span className={`risk-badge risk-${r.severity}`}>
                      {r.severity.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                    <button
                      onClick={() => toggleResolved(r, i)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--dash-border)',
                        background: isResolved ? 'rgba(22, 163, 74, 0.1)' : '#F8FAFC',
                        color: isResolved ? '#16A34A' : 'var(--dash-text)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Simulate municipal verification status"
                    >
                      <Check size={12} /> {isResolved ? 'Mark Active' : 'Resolve'}
                    </button>
                  </div>
                </div>

                <p style={{ margin: '0 0 10px', color: 'var(--dash-text)', fontSize: '0.92rem', lineHeight: 1.5, fontWeight: 500 }}>
                  {r.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.78rem', color: 'var(--dash-muted)', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color="var(--dash-aqua)" />
                    <span>{r.address || `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}</span>
                  </div>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}

          {filteredReports.length === 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 30, textAlign: 'center', color: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}>
              No reports in this category. Click "New Incident Report" above to file one.
            </div>
          )}
        </div>
      )}

      {/* New Report Form */}
      {activeTab === 'submit' && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--dash-border)', borderRadius: 16, padding: 24, maxWidth: 620, boxShadow: 'var(--dash-shadow-sm)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: 'var(--dash-text)', fontWeight: 700 }}>
            Submit Field Incident Report
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Classification Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Severity Level</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: `1px solid ${severity === s.value ? 'var(--dash-aqua)' : 'var(--dash-border)'}`,
                      background: severity === s.value ? 'rgba(24, 182, 210, 0.1)' : '#FFFFFF',
                      color: severity === s.value ? 'var(--dash-aqua)' : 'var(--dash-text)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Incident Description & Observations</label>
              <textarea
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Describe water depth, traffic blockage, or affected infrastructure..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              {errors.description && <div className="field-error" style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: 4 }}>{errors.description}</div>}
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Location & Coordinates</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address or locality name"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={getLocation}
                  disabled={locating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Detect Device GPS"
                >
                  <Navigation size={14} color="var(--dash-aqua)" />
                  <span>{locating ? 'Locating…' : 'GPS'}</span>
                </button>
              </div>
              {lat && lng && (
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
                  Coordinates: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="action-btn primary"
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}
              >
                <Send size={14} />
                <span>{loading ? 'Submitting…' : 'Submit Report'}</span>
              </button>
              <button
                type="button"
                className="action-btn ghost"
                onClick={() => setActiveTab('list')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
