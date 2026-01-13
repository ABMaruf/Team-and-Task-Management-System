import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const loadGoogleScript = () => {
  if (document.getElementById('google-identity-script')) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.body.appendChild(script);
  });
};

const GoogleAuthButton = ({ label = 'Continue with Google', align = 'center' }) => {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let isMounted = true;
    loadGoogleScript()
      .then(() => {
        if (!isMounted || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) {
              setError('Google sign-in failed. Please try again.');
              return;
            }
            setError('');
            await loginWithGoogle(response.credential);
          }
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
          locale: 'en'
        });
      })
      .catch(() => {
        if (isMounted) {
          setError('Google sign-in is unavailable right now.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, loginWithGoogle]);

  if (!clientId) {
    return (
      <div className="text-center text-xs text-gray-500">
        Add `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-${align}`}>
      <div ref={buttonRef} />
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
      {!error && label ? (
        <p className="mt-2 text-xs text-gray-500">{label}</p>
      ) : null}
    </div>
  );
};

export default GoogleAuthButton;
