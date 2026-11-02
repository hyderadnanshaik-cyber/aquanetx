import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, LogOut, CheckCircle2, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Firebase updateProfile would go here with real auth
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const joinedDate = 'November 2026'; // Would come from user metadata

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-desc">Manage your account information.</p>
      </div>

      {/* Avatar section */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(102,232,224,0.2)', display: 'grid', placeItems: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--turq)', flexShrink: 0 }}>
          {displayName?.[0]?.toUpperCase() || <User size={32} />}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dash-text)' }}>{displayName || 'User'}</div>
          <div style={{ color: 'var(--dash-muted)', fontSize: '0.88rem' }}>{user?.email}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user?.isDemo && (
              <span className="demo-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Zap size={11} /> Demo Account
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Joined {joinedDate}</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div style={{ background: '#FFFFFF', boxShadow: 'var(--dash-shadow-sm)', border: '1px solid var(--dash-border)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)' }}>Account Information</h2>

        {user?.isDemo && (
          <div style={{ background: 'rgba(255,180,80,0.1)', border: '1px solid rgba(255,180,80,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} style={{ flexShrink: 0 }} />
            <span>Demo mode — profile changes are not persisted. Configure Firebase to enable account management.</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>Email cannot be changed here.</div>
        </div>

        {saved && (
          <div style={{ color: 'var(--turq)', fontSize: '0.88rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> Profile saved successfully!
          </div>
        )}
        <button className="action-btn primary" onClick={handleSave} disabled={user?.isDemo}>
          Save Changes
        </button>
      </div>

      {/* Danger zone */}
      <div style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: '#DC2626' }}>Sign Out</h2>
        <p style={{ color: 'var(--dash-muted)', fontSize: '0.88rem', marginBottom: 16 }}>
          You will be returned to the landing page. Your offline data remains on this device.
        </p>
        <button className="action-btn danger" onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
