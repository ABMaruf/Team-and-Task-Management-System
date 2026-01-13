import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as authService from '../services/authService';
import { getMockUser } from '../services/mockData';
import {
  clearSession,
  getSession,
  isSessionExpired,
  setSession,
  updateSessionUser
} from '../services/sessionService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';
  const [user, setUser] = useState(mockEnabled ? getMockUser() : null);
  const [loading, setLoading] = useState(!mockEnabled);
  const navigate = useNavigate();
  const refreshTimeoutRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const refreshAccessTokenRef = useRef(null);

  const persistSessionResponse = useCallback((response, overrides = {}) => {
    if (!response && !overrides.accessToken) return null;
    const previous = getSession();
    const expiresInSeconds = response?.expiresIn ?? overrides.expiresIn ?? 15 * 60;
    const nextSession = {
      accessToken: response?.token ?? overrides.accessToken ?? previous?.accessToken ?? null,
      refreshToken: response?.refreshToken ?? overrides.refreshToken ?? previous?.refreshToken ?? null,
      expiresAt: response?.expiresAt ?? Date.now() + expiresInSeconds * 1000,
      user: overrides.user ?? response?.user ?? previous?.user ?? null
    };
    if (!nextSession.accessToken) {
      clearSession();
      return null;
    }
    return setSession(nextSession);
  }, []);

  const scheduleRefresh = useCallback(
    (session) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (
        mockEnabled ||
        typeof window === 'undefined' ||
        !session?.expiresAt ||
        !session?.refreshToken
      ) {
        return;
      }
      const bufferMs = 60 * 1000;
      const delay = Math.max(5000, session.expiresAt - Date.now() - bufferMs);
      refreshTimeoutRef.current = window.setTimeout(() => {
        if (refreshAccessTokenRef.current) {
          refreshAccessTokenRef.current();
        }
      }, delay);
    },
    [mockEnabled]
  );

  const performLogout = useCallback(
    async (showToast = true) => {
      try {
        if (!mockEnabled) {
          await authService.logout();
        }
      } catch (error) {
        console.warn('Logout request failed', error);
      } finally {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        clearSession();
        setUser(null);
        if (showToast) {
          toast.info(mockEnabled ? 'Mock logout successful' : 'Logged out successfully');
        }
        navigate('/login');
      }
    },
    [mockEnabled, navigate]
  );

  const refreshAccessToken = useCallback(async () => {
    if (mockEnabled) return null;
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const session = getSession();
    if (!session?.refreshToken) {
      await performLogout(false);
      return null;
    }
    refreshPromiseRef.current = authService
      .refreshToken(session.refreshToken)
      .then((response) => {
        const updated = persistSessionResponse(response, { user: session.user });
        if (updated) {
          scheduleRefresh(updated);
        }
        return updated;
      })
      .catch((error) => {
        console.error('Token refresh failed', error);
        performLogout(false);
        return null;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });
    return refreshPromiseRef.current;
  }, [mockEnabled, performLogout, persistSessionResponse, scheduleRefresh]);

  useEffect(() => {
    refreshAccessTokenRef.current = refreshAccessToken;
  }, [refreshAccessToken]);

  useEffect(() => {
    if (mockEnabled) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const session = getSession();
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      if (isSessionExpired(session, 60 * 1000)) {
        await refreshAccessToken();
      } else {
        scheduleRefresh(session);
      }

      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        updateSessionUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        await performLogout(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [mockEnabled, refreshAccessToken, scheduleRefresh, performLogout]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const sessionData = persistSessionResponse(response, { user: response.user });
      if (sessionData) {
        scheduleRefresh(sessionData);
      }
      setUser(response.user);
      toast.success('Login successful!');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const response = await authService.loginWithGoogle(credential);
      const sessionData = persistSessionResponse(response, { user: response.user });
      if (sessionData) {
        scheduleRefresh(sessionData);
      }
      setUser(response.user);
      toast.success('Login successful!');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const loginWithGithub = async (code) => {
    try {
      const response = await authService.exchangeGithubCode(code);
      const sessionData = persistSessionResponse(response, { user: response.user });
      if (sessionData) {
        scheduleRefresh(sessionData);
      }
      setUser(response.user);
      toast.success('Login successful!');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'GitHub sign-in failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    performLogout(true);
  };

  const updateUser = (userData) => {
    setUser(userData);
    updateSessionUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    loginWithGithub,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
