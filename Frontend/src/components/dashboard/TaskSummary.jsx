import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import * as taskService from '../../services/taskService';

const TaskSummary = ({ stats }) => {
  const { darkMode } = useTheme();
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });

  useEffect(() => {
    if (stats) {
      const completed = Number(stats.completed || 0);
      const inProgress = Number(stats.inProgress || 0);
      const pending = Number(stats.pending || 0);
      setSummary({
        total: completed + inProgress + pending,
        completed,
        inProgress,
        pending
      });
      return;
    }
    fetchTaskSummary();
  }, [stats]);

  const fetchTaskSummary = async () => {
    try {
      const tasks = await taskService.getMyTasks();
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const pending = tasks.filter(t => t.status === 'todo').length;
      
      setSummary({
        total: tasks.length,
        completed,
        inProgress,
        pending
      });
    } catch (error) {
      console.error('Error fetching task summary:', error);
    }
  };

  const productivityValue = stats?.productivity != null ? stats.productivity : '0';
  const cards = [
    {
      icon: <CheckSquare className="text-white" size={24} />,
      title: 'Completed',
      value: summary.completed,
      bgGradient: 'from-green-500 to-emerald-500',
      trend: '+12% from last week'
    },
    {
      icon: <Clock className="text-white" size={24} />,
      title: 'In Progress',
      value: summary.inProgress,
      bgGradient: 'from-blue-500 to-indigo-500',
      trend: `${summary.inProgress} active tasks`
    },
    {
      icon: <AlertCircle className="text-white" size={24} />,
      title: 'Pending',
      value: summary.pending,
      bgGradient: 'from-orange-500 to-red-500',
      trend: `${summary.pending} waiting`
    },
    {
      icon: <TrendingUp className="text-white" size={24} />,
      title: 'Productivity',
      value: productivityValue,
      bgGradient: 'from-purple-500 to-pink-500',
      trend: '+15% this month'
    }
  ];

  return (
    <>
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.bgGradient} rounded-xl flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {card.title}
            </h3>
            <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {card.value}
            </p>
            <p className="text-sm text-green-500 mt-2">{card.trend}</p>
          </div>
        </div>
      ))}
    </>
  );
};

export default TaskSummary;
