import { useState } from 'react';
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      navigate('/', { replace: true });
      return;
    }

    setMessage(
      'Account created. Check your email to verify your account.',
    );
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-classification">
          S.E.A.F. // L.E.M.O.N
        </div>

        <h1>CREATE PERSONNEL ACCOUNT</h1>

        <p className="auth-description">
          Register a new Super Earth personnel account.
        </p>

        <form
          className="auth-form"
          onSubmit={handleRegister}
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="confirm-password">
            CONFIRM PASSWORD
          </label>

          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
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
            disabled={loading}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">
            ALREADY HAVE AN ACCOUNT?
          </Link>
        </div>
      </section>
    </main>
  );
}
