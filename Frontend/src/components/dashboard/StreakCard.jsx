import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, Calendar, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import Loader from '../common/Loader';
import AnimatedCard from '../common/AnimatedCard';
import * as streakService from '../../services/streakService';

const dayLabel = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
};

const StreakCard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStreakInfo();
    }
  }, [user]);

  const fetchStreakInfo = async () => {
    try {
      setLoading(true);
      const [streakSummary, streakHistory] = await Promise.all([
        streakService.getUserStreak(user.id),
        streakService.getStreakHistory(user.id, 14)
      ]);
      setSummary(streakSummary);
      setHistory(streakHistory);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
      >
        <Loader />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const goal = summary.goal || 1;
  const progressPercent = Math.min(100, Math.round((summary.current_streak / goal) * 100));

  return (
    <AnimatedCard
      className={`rounded-2xl border p-6 shadow-sm transition-all ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current streak</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {summary.current_streak}
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>days</span>
          </div>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Goal: {goal} days - {progressPercent}% complete
          </p>
          <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <button
          className={`rounded-full p-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
          onClick={fetchStreakInfo}
          title="Refresh streak data"
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last completion</span>
          </div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.lastCompletedDate
              ? new Date(summary.lastCompletedDate).toLocaleDateString()
              : 'No data'}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-500" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Longest streak</span>
          </div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.longest_streak} days
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-500" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Grace period</span>
          </div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.resetIn != null ? `${summary.resetIn} days left` : 'On track'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className={`text-xs uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Last 14 days
        </p>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {history.map((entry) => (
            <div key={entry.date} className="flex flex-col items-center gap-1 text-xs">
              <div
                className={`h-10 w-full rounded-xl border ${
                  entry.completed > 0
                    ? 'border-orange-400 bg-orange-100 dark:border-orange-500 dark:bg-orange-500/20'
                    : darkMode
                    ? 'border-gray-700'
                    : 'border-gray-200'
                } flex items-center justify-center`}
              >
                <span className={darkMode ? 'text-white' : 'text-gray-800'}>{entry.completed}</span>
              </div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{dayLabel(entry.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default StreakCard;
