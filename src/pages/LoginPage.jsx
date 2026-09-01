import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import './LoginPage.css';

const DISCORD_INVITE_URL =
  'https://discord.com/invite/9FRFae3Bf6';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo =
    location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleDiscordLogin = async () => {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleDiscordInvite = () => {
    window.open(
      DISCORD_INVITE_URL,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-classification">
          S.E.A.F. // L.E.M.E.N
        </div>

        <h1>PERSONNEL AUTHENTICATION</h1>

        <p className="auth-description">
          Authenticate with your Super Earth credentials.
        </p>

        <div className="auth-social-buttons">
          <button
            type="button"
            className="auth-button auth-button-discord"
            onClick={handleDiscordInvite}
          >
            JOIN DISCORD
          </button>

          <button
            type="button"
            className="auth-button auth-button-discord"
            disabled={loading}
            onClick={handleDiscordLogin}
          >
            {loading
              ? 'CONNECTING...'
              : 'CONTINUE WITH DISCORD'}
          </button>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <div className="auth-return">
          <button
            type="button"
            className="auth-return-link"
            onClick={() => navigate('/')}
          >
            RETURN TO MAP
          </button>
        </div>



        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}
