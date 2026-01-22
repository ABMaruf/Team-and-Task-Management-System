import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import * as projectService from '../services/projectService';
import { useAuth } from '../hooks/useAuth';

const InviteAcceptPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Loading invite...');
  const [invite, setInvite] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoAccepted, setAutoAccepted] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invite token is missing.');
      return;
    }

    const loadInvite = async () => {
      try {
        const data = await projectService.getProjectInviteInfo(token);
        setInvite(data);
        setStatus('ready');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Invite is invalid or expired.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    loadInvite();
  }, [token]);

  useEffect(() => {
    if (!user || status !== 'ready' || autoAccepted) return;
    setAutoAccepted(true);
    handleAccept();
  }, [user, status, autoAccepted, token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setSubmitting(true);
      const response = await projectService.acceptProjectInvite(token);
      setStatus('success');
      setMessage(response?.message || 'Invite accepted.');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept invite.';
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center space-y-4">
        {status === 'loading' ? (
          <>
            <Loader size="lg" />
            <p className="text-gray-600">{message}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              {status === 'success' ? 'Invite Accepted' : 'Project Invite'}
            </h1>
            {invite ? (
              <div className="text-sm text-gray-600">
                <p>
                  Project: <span className="font-semibold text-gray-900">{invite.project_name}</span>
                </p>
                <p>
                  Role: <span className="font-semibold text-gray-900">{invite.role}</span>
                </p>
              </div>
            ) : null}
            <p className="text-gray-600">{message}</p>

            {status === 'ready' && !user ? (
              <Button
                onClick={() => {
                  const returnTo = `${location.pathname}${location.search}`;
                  sessionStorage.setItem('post_login_redirect', returnTo);
                  navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                }}
              >
                Log in to accept
              </Button>
            ) : null}

            {status === 'ready' && user ? (
              <Button onClick={handleAccept} disabled={submitting}>
                {submitting ? 'Accepting...' : 'Accept Invite'}
              </Button>
            ) : null}

            {status === 'success' ? (
              <Button onClick={() => navigate('/projects')}>Go to Projects</Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default InviteAcceptPage;
