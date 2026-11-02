import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      setError(msg || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 260, height: 260, background: '#39D8D0', top: -60, right: -60 }} />
      <div className="auth-bg-orb" style={{ width: 180, height: 180, background: '#0B5C7A', bottom: -40, left: -40 }} />

      <div className="auth-card">
        <div className="auth-header-row">
          <Link to="/login" className="auth-back-btn" title="Return to Login">
            <ArrowLeft size={14} /> Back
          </Link>
          <Link to="/" className="auth-logo">AQUANET <b>X</b></Link>
        </div>

        <h2 className="auth-title">Reset password</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a password recovery link.</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(57, 216, 208, 0.15)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={24} color="var(--turq)" />
            </div>
            <p style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 6px' }}>Recovery Email Dispatched</p>
            <p style={{ color: 'rgba(228, 250, 248, 0.7)', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 16px' }}>
              We sent password reset instructions to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="action-btn primary" style={{ display: 'inline-block', width: '100%', padding: '9px 16px', fontSize: '0.85rem' }}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
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

            {error && (
              <div style={{ color: '#FCA5A5', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '7px 10px', fontSize: '0.78rem', margin: '8px 0', lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="action-btn primary"
              style={{ width: '100%', marginTop: 8, padding: '9px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              disabled={loading}
            >
              <Mail size={15} />
              <span>{loading ? 'Sending link…' : 'Send Reset Link'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" className="auth-link" style={{ fontSize: '0.82rem' }}>
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
