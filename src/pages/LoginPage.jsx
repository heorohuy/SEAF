import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const redirectTo =
    location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleEmailLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-classification">
          S.E.A.F. // L.E.M.O.N
        </div>

        <h1>PERSONNEL AUTHENTICATION</h1>

        <p className="auth-description">
          Authenticate with your Super Earth credentials.
        </p>

        <div className="auth-social-buttons">
          <button
            type="button"
            className="auth-button auth-button-google"
            disabled={loading || oauthLoading}
            onClick={() => handleOAuthLogin('google')}
          >
            {oauthLoading === 'google'
              ? 'CONNECTING...'
              : 'CONTINUE WITH GOOGLE'}
          </button>

          <button
            type="button"
            className="auth-button auth-button-discord"
            disabled={loading || oauthLoading}
            onClick={() => handleOAuthLogin('discord')}
          >
            {oauthLoading === 'discord'
              ? 'CONNECTING...'
              : 'CONTINUE WITH DISCORD'}
          </button>
        </div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <form
          className="auth-form"
          onSubmit={handleEmailLogin}
        >
          <label htmlFor="email">
            EMAIL
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">
            PASSWORD
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-button auth-button-primary"
            disabled={loading || oauthLoading}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">
            CREATE ACCOUNT
          </Link>

          <Link to="/forgot-password">
            FORGOT PASSWORD?
          </Link>
        </div>
      </section>
    </main>
  );
}
