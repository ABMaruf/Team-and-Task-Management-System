import React, { useState, useEffect } from 'react';
import { Activity, MessageCircle, Shuffle, Wand } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../common/Avatar';
import { getTimeAgo } from '../../utils/helpers';
import * as dashboardService from '../../services/dashboardService';

const ActivityFeed = () => {
  const { darkMode } = useTheme();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await dashboardService.getRecentActivity(15);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const renderDetails = (activity) => {
    if (activity.type === 'comment' && activity.comment) {
      return (
        <p className={`mt-2 text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          "{activity.comment}"
        </p>
      );
    }

    if (activity.type === 'status') {
      return (
        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {activity.meta?.fromStatus} -> {activity.meta?.toStatus}
        </p>
      );
    }

    if (activity.type === 'assignment') {
      return (
        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {activity.meta?.fromAssignee?.name || 'Unassigned'} -> {activity.meta?.toAssignee?.name || 'Unassigned'}
        </p>
      );
    }

    if (activity.type === 'priority') {
      return (
        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {activity.meta?.fromPriority} -> {activity.meta?.toPriority}
        </p>
      );
    }

    if (activity.type === 'team') {
      return (
        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {activity.meta?.description || 'Workspace settings change'}
        </p>
      );
    }
    return null;
  };

  const getIcon = (activity) => {
    switch (activity.type) {
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'status':
        return <Shuffle size={16} className="text-emerald-500" />;
      case 'assignment':
        return <Wand size={16} className="text-amber-500" />;
      case 'team':
        return <Activity size={16} className="text-purple-500" />;
      default:
        return <Activity size={16} className="text-indigo-500" />;
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
      <div className="flex items-center gap-2 mb-6">
        <Activity size={24} className="text-indigo-500" />
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Recent Activity
        </h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar user={activity.user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                <span className="font-semibold">{activity.user?.name || 'Unknown user'}</span>{' '}
                {activity.action}{' '}
                <span className="font-semibold">{activity.task}</span>
              </p>
              {renderDetails(activity)}
              <div className={`mt-2 flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getIcon(activity)}
                <span>{getTimeAgo(new Date(activity.time))}</span>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No activity yet. Your updates will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
