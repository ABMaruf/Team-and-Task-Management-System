import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 px-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">Error 404</p>
      <h1 className="mt-6 text-4xl font-bold text-gray-900">This page is taking a break</h1>
      <p className="mt-4 max-w-xl text-gray-600">
        The screen you're looking for doesn't exist or has been moved. In the meantime you can head back to the
        dashboard and keep conquering your tasks.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
