import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'gigshield-google-identity';

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  const existing = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, text = 'continue_with', disabled = false }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !google?.accounts?.id || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = '';
        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (!disabled && credential) {
              onCredential(credential);
            }
          },
        });
        google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: 320,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError('Google sign-in could not be loaded right now.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onCredential, text]);

  if (!clientId) {
    return <div className="alert alert--info">Google sign-in is not configured yet. Add `VITE_GOOGLE_CLIENT_ID` to enable it.</div>;
  }

  return (
    <div className="google-auth">
      <div ref={containerRef} style={{ minHeight: 44, opacity: disabled ? 0.65 : 1 }} />
      {error ? <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
