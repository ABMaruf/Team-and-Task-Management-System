import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import * as dashboardService from '../../services/dashboardService';
import StreakCard from './StreakCard';
import ProductivityChart from './ProductivityChart';
import TaskSummary from './TaskSummary';
import Leaderboard from './Leaderboard';
import ActivityFeed from './ActivityFeed';
import Button from '../common/Button';
import Loader from '../common/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Here's what's happening with your tasks today.
          </p>
        </div>
        <Button icon={<Plus size={20} />} onClick={() => navigate('/tasks?new=1')}>
          New Task
        </Button>
      </div>

      {/* Stats Cards - Streak & Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StreakCard />
        <TaskSummary stats={stats} />
      </div>

      {/* Charts and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart />
        </div>
        <Leaderboard />
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
};

export default Dashboard;
