import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProfilePage from './pages/ProfilePage';
import TeamManagementPage from './pages/TeamManagementPage';
import CalendarPage from './pages/CalendarPage';
import NotFoundPage from './pages/NotFoundPage';
import GithubCallbackPage from './pages/GithubCallbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import InviteAcceptPage from './pages/InviteAcceptPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Loader from './components/common/Loader';

function App() {
  const { user, loading } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();

  const getReturnTo = () => {
    const params = new URLSearchParams(location.search);
    const target = params.get('returnTo');
    return target && target.startsWith('/') ? target : null;
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={getReturnTo() || '/dashboard'} /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} 
        />
        <Route
          path="/oauth/github"
          element={user ? <Navigate to="/dashboard" /> : <GithubCallbackPage />}
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/invites/accept" element={<InviteAcceptPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute adminOnly>
              <TeamManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
