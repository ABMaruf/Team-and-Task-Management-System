import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import * as authService from '../services/authService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response?.message || 'Email verified successfully.');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Verification failed.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <Loader size="lg" />
            <p className="text-gray-600">{message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {status === 'success' ? 'Email Verified' : 'Verification Failed'}
            </h1>
            <p className="text-gray-600">{message}</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
