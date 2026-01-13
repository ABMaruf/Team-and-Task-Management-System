import api from './api';
import { mockDashboardApi } from './mockData';
import { unwrapResponse } from './unwrapResponse';

const mapStatistics = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if ('completed' in payload || 'inProgress' in payload) {
    return payload;
  }

  const tasks = payload.tasks || {};
  const projects = payload.projects || {};
  const users = payload.users || {};

  return {
    completed: tasks.completed_tasks || 0,
    inProgress: tasks.in_progress_tasks || 0,
    pending: tasks.todo_tasks || 0,
    activeProjects: projects.active_projects || 0,
    productivity: Math.round(users.avg_productivity || 0)
  };
};

const mapChartData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (payload.labels && payload.productivity && payload.summary && payload.streakHistory) {
    return payload;
  }

  const completion = payload.completion || [];
  const productivityRaw = payload.productivity || [];

  const completionByDate = new Map();
  completion.forEach((entry) => {
    if (entry?.date) completionByDate.set(entry.date, entry);
  });

  const productivityByDate = new Map();
  productivityRaw.forEach((entry) => {
    if (entry?.date) {
      productivityByDate.set(entry.date, entry.total_points ?? entry.points ?? 0);
    }
  });

  const dates = Array.from(new Set([...completionByDate.keys(), ...productivityByDate.keys()])).sort();
  const labels = dates.map((date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short' }));
  const productivity = dates.map((date) => {
    const points = productivityByDate.get(date);
    if (points != null) return Number(points);
    const completionEntry = completionByDate.get(date);
    if (completionEntry?.avg_score != null) return Number(completionEntry.avg_score);
    return 0;
  });

  const completedCount = completion.reduce((sum, entry) => sum + (entry?.completed ?? 0), 0);
  const totalScore = productivity.reduce((sum, value) => sum + value, 0);

  return {
    labels,
    productivity,
    summary: {
      productivityScore: dates.length ? Number((totalScore / dates.length).toFixed(1)) : 0,
      completed: completedCount,
      averageCompletionHours: 0
    },
    streakHistory: dates.slice(-14).map((date) => ({
      date,
      completed: completionByDate.get(date)?.completed ?? 0
    }))
  };
};

const mapLeaderboard = (payload) => {
  if (!Array.isArray(payload)) {
    return payload;
  }
  return payload.map((entry) => ({
    ...entry,
    streak: entry.streak ?? entry.current_streak ?? 0
  }));
};

const mapActivity = (payload) => {
  if (!Array.isArray(payload)) {
    return payload;
  }

  return payload.map((entry) => ({
    id: entry.id,
    type: entry.action === 'commented' ? 'comment' : 'task',
    action: entry.action === 'commented' ? 'commented on' : entry.action,
    task: entry.task_title || 'task',
    time: entry.created_at || entry.createdAt,
    user: {
      id: entry.user_id,
      name: entry.user_name,
      profile_picture: entry.profile_picture
    },
    comment: entry.action === 'commented' ? entry.details : undefined
  }));
};

const mapAnalytics = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if ('tasksCompleted' in payload || 'flowStreak' in payload) {
    return payload;
  }

  const tasks = payload.tasks || {};
  const streak = payload.streak || {};

  return {
    tasksCompleted: tasks.completed_tasks ?? 0,
    focusTime: Math.round((streak.productivity_score ?? 0) / 10),
    flowStreak: streak.current_streak ?? 0
  };
};

const mockEnabled = import.meta.env.VITE_USE_MOCK === 'true';

// Get overall statistics
export const getStatistics = async () => {
  if (mockEnabled) {
    return mockDashboardApi.getStatistics();
  }
  const response = await api.get('/dashboard/stats');
  return mapStatistics(unwrapResponse(response.data));
};

// Get chart data
export const getChartData = async (period = '7days') => {
  if (mockEnabled) {
    return mockDashboardApi.getChartData(period);
  }
  const response = await api.get(`/dashboard/charts?period=${period}`);
  return mapChartData(unwrapResponse(response.data));
};

// Get leaderboard
export const getLeaderboard = async (limit = 10) => {
  if (mockEnabled) {
    return mockDashboardApi.getLeaderboard(limit);
  }
  const response = await api.get(`/dashboard/leaderboard?limit=${limit}`);
  return mapLeaderboard(unwrapResponse(response.data));
};

// Get personal analytics
export const getMyAnalytics = async () => {
  if (mockEnabled) {
    return mockDashboardApi.getMyAnalytics();
  }
  const response = await api.get('/dashboard/my-analytics');
  return mapAnalytics(unwrapResponse(response.data));
};

// Get recent activity
export const getRecentActivity = async (limit = 10) => {
  if (mockEnabled) {
    return mockDashboardApi.getRecentActivity(limit);
  }
  const response = await api.get(`/dashboard/activity?limit=${limit}`);
  return mapActivity(unwrapResponse(response.data));
};
