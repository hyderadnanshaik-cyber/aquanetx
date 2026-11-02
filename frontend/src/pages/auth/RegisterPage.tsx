import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, ArrowLeft, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register, loginWithGoogle, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('email-already-in-use')) setError('An account with this email already exists.');
      else if (msg.includes('weak-password')) setError('Password is too weak (min 6 chars).');
      else setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (!msg.includes('popup-closed-by-user')) {
        setError(msg || 'Google registration failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemo = () => {
    demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 260, height: 260, background: '#39D8D0', top: -60, left: -60 }} />
      <div className="auth-bg-orb" style={{ width: 180, height: 180, background: '#0B5C7A', bottom: -40, right: -40 }} />

      <div className="auth-card">
        {/* Header row with Back Button & Logo */}
        <div className="auth-header-row">
          <Link to="/" className="auth-back-btn" title="Return to Landing Page">
            <ArrowLeft size={14} /> Back
          </Link>
          <Link to="/" className="auth-logo">AQUANET <b>X</b></Link>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join AQUANET X — water intelligence for your community.</p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="google-auth-btn"
          disabled={googleLoading || loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>{googleLoading ? 'Connecting…' : 'Sign up with Google'}</span>
        </button>

        <div className="auth-divider">or register with email</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Adnan Shaikh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label className="form-label" htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Create secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div style={{ color: '#FCA5A5', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '7px 10px', fontSize: '0.78rem', margin: '8px 0', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="action-btn primary"
            style={{ width: '100%', marginTop: 10, padding: '9px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            disabled={loading || googleLoading}
          >
            <UserPlus size={15} />
            <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
          </button>
        </form>

        <div className="auth-divider">or explore</div>

        <button
          type="button"
          onClick={handleDemo}
          className="action-btn ghost"
          style={{ width: '100%', padding: '8px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
        >
          <Zap size={14} color="var(--turq)" /> Demo Login (Instant Access)
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.82rem', color: 'rgba(228, 250, 248, 0.65)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
