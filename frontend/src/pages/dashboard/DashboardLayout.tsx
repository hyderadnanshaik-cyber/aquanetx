import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Waves,
  Droplets,
  RotateCcw,
  FileText,
  Bell,
  CloudSun,
  Bot,
  AlertOctagon,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Zap,
  Menu,
  MapPin,
  ChevronDown,
  Navigation,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import OnboardingMascot from '../../components/OnboardingMascot';
import { db } from '../../db';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/floodsense', label: 'FloodSense', icon: Waves },
  { to: '/dashboard/water-stress', label: 'Water Stress', icon: Droplets },
  { to: '/dashboard/recovery', label: 'Smart Recovery', icon: RotateCcw },
  { to: '/dashboard/reports', label: 'Citizen Reports', icon: FileText },
  { to: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { to: '/dashboard/weather', label: 'Weather', icon: CloudSun },
  { to: '/dashboard/aqua-ai', label: 'AQUA AI', icon: Bot },
  { to: '/dashboard/emergency', label: 'Emergency SOS', icon: AlertOctagon },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/floodsense': 'FloodSense',
  '/dashboard/water-stress': 'Water Stress',
  '/dashboard/recovery': 'Smart Recovery',
  '/dashboard/smart-recovery': 'Smart Recovery',
  '/dashboard/reports': 'Citizen Reports',
  '/dashboard/citizen-reports': 'Citizen Reports',
  '/dashboard/alerts': 'Alerts',
  '/dashboard/weather': 'Weather',
  '/dashboard/aqua-ai': 'AQUA AI',
  '/dashboard/emergency': 'Emergency SOS',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'Settings',
};

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
  state?: string;
}

const DEFAULT_LOCATION: LocationInfo = {
  name: 'Hyderabad, Telangana, India',
  lat: 17.3850,
  lon: 78.4867,
  state: 'Telangana',
};

// Major Indian cities quick presets
const CITY_PRESETS: LocationInfo[] = [
  { name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
  { name: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lon: 80.6480, state: 'Andhra Pradesh' },
  { name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  { name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  { name: 'Delhi, NCR', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  { name: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { online } = useConnectivity();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locInput, setLocInput] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchingCity, setSearchingCity] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    // 1. Check saved location preference
    const savedLoc = localStorage.getItem('aquanetx_location');
    if (savedLoc) {
      try {
        setCurrentLocation(JSON.parse(savedLoc));
      } catch { /* use default */ }
    } else if (navigator.geolocation) {
      // 2. Auto-detect user's real location on first visit
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            // Free client reverse geocoding via Open-Meteo
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (res.ok) {
              const data = await res.json();
              const city = data.city || data.locality || data.principalSubdivision || 'Detected Location';
              const state = data.principalSubdivision || '';
              const detectedLoc: LocationInfo = {
                name: `${city}${state ? `, ${state}` : ''}, India`,
                lat,
                lon,
                state,
              };
              setCurrentLocation(detectedLoc);
              localStorage.setItem('aquanetx_location', JSON.stringify(detectedLoc));
              return;
            }
          } catch { /* fallback to coords */ }
          const simpleLoc: LocationInfo = {
            name: `My Location (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
            lat,
            lon,
          };
          setCurrentLocation(simpleLoc);
          localStorage.setItem('aquanetx_location', JSON.stringify(simpleLoc));
        },
        () => { /* user denied, keep Hyderabad default */ },
        { timeout: 8000 }
      );
    }

    if (!user) return;
    db.userPreferences.where({ userId: user.uid, key: 'onboarding_complete' }).first().then((pref) => {
      if (!pref) setShowOnboarding(true);
    });
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleOnboardingComplete = async () => {
    if (!user) return;
    await db.userPreferences.add({ userId: user.uid, key: 'onboarding_complete', value: true });
    setShowOnboarding(false);
  };

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let detectedName = `GPS (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
        let detectedState = '';

        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Detected Area';
            detectedState = data.principalSubdivision || '';
            detectedName = `${city}${detectedState ? `, ${detectedState}` : ''}`;
          }
        } catch { /* use coords */ }

        const newLoc: LocationInfo = {
          name: detectedName,
          lat,
          lon,
          state: detectedState,
        };
        setCurrentLocation(newLoc);
        localStorage.setItem('aquanetx_location', JSON.stringify(newLoc));
        setGpsLoading(false);
        setShowLocationModal(false);
      },
      (err) => {
        setGpsLoading(false);
        alert(`Location permission denied or unavailable (${err.message}). Defaulting to current selection.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const selectPreset = (preset: LocationInfo) => {
    setCurrentLocation(preset);
    localStorage.setItem('aquanetx_location', JSON.stringify(preset));
    setShowLocationModal(false);
  };

  const handleManualLocationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = locInput.trim();
    if (!query) return;

    setSearchingCity(true);
    try {
      // Use Open-Meteo free geocoding API to find exact lat/lon for any Indian city
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          const newLoc: LocationInfo = {
            name: `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country || 'India'}`,
            lat: r.latitude,
            lon: r.longitude,
            state: r.admin1 || '',
          };
          setCurrentLocation(newLoc);
          localStorage.setItem('aquanetx_location', JSON.stringify(newLoc));
          setSearchingCity(false);
          setShowLocationModal(false);
          return;
        }
      }
    } catch { /* fallback */ }

    // Fallback if geocoding fails
    const fallbackLoc: LocationInfo = {
      name: query,
      lat: DEFAULT_LOCATION.lat,
      lon: DEFAULT_LOCATION.lon,
      state: DEFAULT_LOCATION.state,
    };
    setCurrentLocation(fallbackLoc);
    localStorage.setItem('aquanetx_location', JSON.stringify(fallbackLoc));
    setSearchingCity(false);
    setShowLocationModal(false);
  };

  const initials = user?.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'AX';

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="AQUANET X" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            <span>AQUANET</span>
            <b>X</b>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section-label">NAVIGATION</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="sidebar-icon" size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: 20 }}>ACCOUNT</div>
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <UserIcon className="sidebar-icon" size={18} />
            <span>Profile</span>
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <SettingsIcon className="sidebar-icon" size={18} />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', color: '#94A3B8' }}>
            <LogOut className="sidebar-icon" size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>

          <div className="topbar-right">
            {/* Live Location Pill Button */}
            <button
              className="topbar-location-btn"
              onClick={() => { setLocInput(currentLocation.name); setShowLocationModal(true); }}
              title="Click to change monitoring location"
            >
              <MapPin size={13} color="var(--dash-aqua)" />
              <span className="location-name">
                {currentLocation.name.split(',')[0]}
              </span>
              <ChevronDown size={11} color="#94A3B8" />
            </button>

            <div className={`status-badge ${online ? 'online' : 'offline'}`}>
              <div className="status-dot" />
              <span className="status-label">{online ? 'Online' : 'Offline'}</span>
            </div>

            {user?.isDemo && (
              <div className="demo-label">
                <Zap size={11} /> <span className="demo-text">Demo</span>
              </div>
            )}

            <div
              className="topbar-avatar"
              onClick={() => navigate('/dashboard/profile')}
              title="Profile"
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet context={{ currentLocation }} />
        </main>

        {/* Mobile Bottom Navigation Bar (Active on phones & tablets <= 768px) */}
        <nav className="mobile-bottom-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/dashboard/floodsense" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Waves size={18} />
            <span>FloodSense</span>
          </NavLink>
          <NavLink to="/dashboard/aqua-ai" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Bot size={18} />
            <span>AQUA AI</span>
          </NavLink>
          <NavLink to="/dashboard/weather" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <CloudSun size={18} />
            <span>Weather</span>
          </NavLink>
          <NavLink to="/dashboard/emergency" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <AlertOctagon size={18} color="#DC2626" />
            <span style={{ color: '#DC2626', fontWeight: 700 }}>SOS</span>
          </NavLink>
        </nav>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--dash-border)', padding: 24, width: 'min(460px, 100%)', boxShadow: 'var(--dash-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dash-text)' }}>Active Catchment Location</h3>
              <button onClick={() => setShowLocationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--dash-muted)', fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.5 }}>
              All dashboard tabs (Weather, FloodSense, Water Stress, AI) stream live telemetry for this location.
            </p>

            <button
              onClick={requestGpsLocation}
              disabled={gpsLoading}
              className="action-btn ghost"
              style={{ width: '100%', marginBottom: 16, gap: 8, justifyContent: 'center', padding: '10px 14px', border: '1px solid var(--dash-aqua)', color: 'var(--dash-aqua)', fontWeight: 600 }}
            >
              <Navigation size={15} />
              {gpsLoading ? 'Acquiring High-Accuracy GPS…' : 'Use Current Device GPS Location'}
            </button>

            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 12 }}>
              QUICK CITY PRESETS
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {CITY_PRESETS.map((p) => {
                const isSelected = currentLocation.name.includes(p.name.split(',')[0]);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => selectPreset(p)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--dash-aqua)' : '1px solid var(--dash-border)',
                      background: isSelected ? 'rgba(24, 182, 210, 0.12)' : '#F8FAFC',
                      color: isSelected ? 'var(--dash-aqua)' : 'var(--dash-text)',
                    }}
                  >
                    {p.name.split(',')[0]}
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10 }}>
              OR SEARCH ANY CITY IN INDIA
            </div>

            <form onSubmit={handleManualLocationSave}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  className="form-input"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder="e.g. Hyderabad, Mumbai, Warangal, Nizamabad..."
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="action-btn primary"
                  disabled={searchingCity || !locInput.trim()}
                  style={{ flexShrink: 0, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Search size={14} />
                  <span>{searchingCity ? 'Locating…' : 'Search'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingMascot onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />
      )}
    </div>
  );
}
