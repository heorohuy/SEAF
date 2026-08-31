import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(
        window.location.search,
      ).get('code');

      if (!code) {
        return;
      }

      const { error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error(
          'Authentication callback failed:',
          error,
        );

        setError(error.message);
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        '/auth/callback',
      );
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>AUTHENTICATION FAILED</h1>

          <div className="auth-error">
            {error}
          </div>

          <a href="/login">
            RETURN TO LOGIN
          </a>
        </section>
      </main>
    );
  }

  return <Navigate to="/" replace />;
}
