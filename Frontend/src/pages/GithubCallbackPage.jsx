import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

const GithubCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGithub } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const code = searchParams.get('code');

    if (errorParam) {
      setError('GitHub sign-in was canceled.');
      return;
    }

    if (!code) {
      setError('Missing GitHub authorization code.');
      return;
    }

    const exchange = async () => {
      const result = await loginWithGithub(code);
      if (!result?.success) {
        setError(result?.message || 'GitHub sign-in failed.');
        return;
      }
      navigate('/dashboard', { replace: true });
    };

    exchange();
  }, [loginWithGithub, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">GitHub Sign-In</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader size="lg" />
    </div>
  );
};

export default GithubCallbackPage;
