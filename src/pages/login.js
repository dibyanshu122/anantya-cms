import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data?.session) {
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .login-bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(1, 142, 158, 0.12) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .login-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 48px 44px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(1, 142, 158, 0.08);
        }

        .login-logo-wrap {
          text-align: center;
          margin-bottom: 36px;
        }

        .login-logo-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .login-logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--primary), #015f6b);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          box-shadow: 0 4px 16px rgba(1, 142, 158, 0.4);
        }

        .login-logo-text {
          font-size: 26px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.5px;
        }

        .login-logo-text span {
          color: var(--primary);
        }

        .login-badge {
          display: inline-block;
          background: rgba(1, 142, 158, 0.15);
          border: 1px solid rgba(1, 142, 158, 0.35);
          color: var(--primary);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 4px;
        }

        .login-subtitle {
          color: var(--muted);
          font-size: 14px;
          margin-top: 10px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: 0.3px;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 16px;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.8);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 13px 14px 13px 44px;
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          box-sizing: border-box;
        }

        .login-input::placeholder {
          color: #475569;
        }

        .login-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(1, 142, 158, 0.15);
        }

        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 12px 14px;
          color: #FCA5A5;
          font-size: 13px;
          line-height: 1.5;
        }

        .login-error-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--primary), #015f6b);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 16px rgba(1, 142, 158, 0.35);
          margin-top: 4px;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(1, 142, 158, 0.45);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          color: var(--muted);
          font-size: 12px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .login-footer strong {
          color: var(--primary);
        }
      `}</style>

      <div className="login-page">
        <div className="login-bg-glow" />
        <div className="login-card">
          <div className="login-logo-wrap">
            <div className="login-logo-brand">
              <div className="login-logo-icon">A</div>
              <div className="login-logo-text">
                Anantya<span>.ai</span>
              </div>
            </div>
            <div>
              <span className="login-badge">CMS Admin</span>
            </div>
            <p className="login-subtitle">Sign in to manage your content</p>
          </div>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            {error && (
              <div className="login-error">
                <span className="login-error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="login-form-group">
              <label className="login-label" htmlFor="email">
                Email Address
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="admin@anantya.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <strong>Anantya.ai</strong> — Internal CMS &bull; Admin access only
          </div>
        </div>
      </div>
    </>
  );
}
