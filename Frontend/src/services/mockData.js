const structuredClone = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const delay = (result, timeout = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(result)), timeout));

const mockUser = {
  id: 'user-1',
  name: 'Sabbir Ahmed',
  email: 'sabbirahmed@gmail.com',
  role: 'admin',
  title: 'Product Manager',
  phone: '+880178945612',
  avatar: '',
  current_streak: 6,
  longest_streak: 14,
  productivity_score: 820
};

let teamMembers = [
  mockUser,
  {
    id: 'user-2',
    name: 'Tabeeb',
    email: 'tabeeb@gmail.com',
    role: 'member',
    title: 'UX Designer',
    phone: '+88017569823',
    current_streak: 3,
    longest_streak: 9,
    productivity_score: 710
  },
  {
    id: 'user-3',
    name: 'MD.Akib',
    email: 'akib@gmail.com',
    role: 'member',
    title: 'Frontend Developer',
    phone: '+880174598756',
    current_streak: 4,
    longest_streak: 8,
    productivity_score: 680
  },
  {
    id: 'user-4',
    name: 'MD.Mahee',
    email: 'mahee@gmail.com',
    role: 'member',
    title: 'Project Manager',
    phone: '+880154896321',
    current_streak: 6,
    longest_streak: 11,
    productivity_score: 760
  }
];

const getMemberSummary = (memberId) => {
  const member = teamMembers.find((m) => m.id === memberId);
  return member ? { id: member.id, name: member.name } : null;
};

const formatDateKey = (date = new Date()) => new Date(date).toISOString().split('T')[0];

const createHistorySeed = (days = 14) => {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const key = formatDateKey(date);
    const completed = Math.random() > 0.4 ? Math.floor(Math.random() * 3) : 0;
    return { date: key, completed };
  });
};

let streakMeta = {
  current: mockUser.current_streak,
  longest: mockUser.longest_streak,
  lastCompletedDate: formatDateKey(new Date(Date.now() - 86400000)),
  history: createHistorySeed()
};

const getTaskById = (taskId) => mockTasks.find((task) => task.id === taskId);

const dueDateNotifications = new Set();

const pushNotification = ({ title, message, meta = {} }) => {
  notifications = [
    {
      id: nextId('notif'),
      title,
      message,
      meta: structuredClone(meta),
      taskId: meta.taskId,
      is_read: false,
      created_at: new Date().toISOString()
    },
    ...notifications
  ].slice(0, 50);
};

const logActivity = ({ type = 'task', action, taskId, userId, meta = {} }) => {
  const userSummary = userId ? getMemberSummary(userId) : null;
  const task = taskId ? getTaskById(taskId) : null;
  activityFeed = [
    {
      id: nextId('activity'),
      type,
      action,
      task: task?.title || meta.taskTitle || 'Task',
      user: userSummary || { name: 'System' },
      time: new Date().toISOString(),
      meta: structuredClone(meta),
      ...meta
    },
    ...activityFeed
  ].slice(0, 40);
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed'
};

const getStatusLabel = (status) => statusLabels[status] || status || 'Unknown';

const truncate = (text = '', limit = 80) => {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
};

const notifyTaskCreated = (task) => {
  pushNotification({
    title: 'Task created',
    message: `${task.title} was added to the roadmap.`,
    meta: {
      type: 'task',
      taskId: task.id,
      assigneeId: task.assigneeId
    }
  });
};

const notifyTaskAssignment = (task, assigneeId, { isNew = false, previousAssignee } = {}) => {
  const assignee = assigneeId ? getMemberSummary(assigneeId) : null;
  let title = isNew ? 'New assignment' : 'Assignment updated';
  if (!assigneeId) {
    title = 'Assignment removed';
  }

  let message;
  if (assigneeId) {
    const prefix = isNew ? 'was assigned to' : 'is now responsible for';
    message = `${assignee?.name || 'Unassigned'} ${prefix} ${task.title}`;
  } else {
    message = `${task.title} no longer has an assignee`;
  }

  if (previousAssignee && previousAssignee !== assigneeId) {
    const prev = getMemberSummary(previousAssignee);
    message += ` (previously ${prev?.name || 'Unassigned'})`;
  }

  pushNotification({
    title,
    message,
    meta: {
      type: 'assignment',
      taskId: task.id,
      assigneeId,
      previousAssignee
    }
  });
};

const notifyStatusChange = (task, fromStatus, toStatus) => {
  if (!toStatus || toStatus === fromStatus) return;
  const title = toStatus === 'completed' ? 'Task completed' : 'Status updated';
  pushNotification({
    title,
    message: `${task.title} moved from ${getStatusLabel(fromStatus)} to ${getStatusLabel(toStatus)}`,
    meta: {
      type: 'status',
      taskId: task.id,
      fromStatus,
      toStatus
    }
  });
};

const notifyCommentAdded = (task, commentText, authorId) => {
  const author = authorId ? getMemberSummary(authorId) : null;
  pushNotification({
    title: 'New comment',
    message: `${author?.name || 'A teammate'} commented on ${task?.title || 'a task'}: "${truncate(commentText, 90)}"`,
    meta: {
      type: 'comment',
      taskId: task?.id,
      authorId
    }
  });
};

const notifyTeamChange = ({ title, message, meta = {} }) =>
  pushNotification({
    title,
    message,
    meta: {
      type: 'team',
      ...meta
    }
  });

const logTeamEvent = ({ action, memberId, meta = {} }) => {
  const summary = memberId ? getMemberSummary(memberId) : null;
  logActivity({
    type: 'team',
    action,
    taskId: null,
    userId: mockUser.id,
    meta: {
      taskTitle: summary?.name || meta.description || 'Team update',
      member: summary,
      ...meta
    }
  });
};

const triggerDeadlineNotifications = () => {
  const now = Date.now();
  const soon = now + 24 * 60 * 60 * 1000;
  mockTasks.forEach((task) => {
    if (!task.dueDate || task.status === 'completed') return;
    const dueTime = new Date(task.dueDate).getTime();
    if (dueTime >= now && dueTime <= soon) {
      const key = `${task.id}:${formatDateKey(task.dueDate)}`;
      if (!dueDateNotifications.has(key)) {
        dueDateNotifications.add(key);
        pushNotification({
          title: 'Upcoming deadline',
          message: `${task.title} is due ${new Date(task.dueDate).toLocaleDateString()}`,
          meta: {
            type: 'deadline',
            taskId: task.id,
            dueDate: task.dueDate
          }
        });
      }
    }
  });
};

const normalizeTaskPayload = (taskData = {}) => {
  const payload = { ...taskData };
  const hasAssigneeField = Object.prototype.hasOwnProperty.call(payload, 'assigneeId');

  if (hasAssigneeField) {
    if (payload.assigneeId) {
      payload.assignee = getMemberSummary(payload.assigneeId);
    } else {
      payload.assignee = null;
    }
  } else if (payload.assignee?.id) {
    payload.assigneeId = payload.assignee.id;
    payload.assignee = getMemberSummary(payload.assignee.id) || payload.assignee;
  }

  if (payload.createdAt) {
    payload.createdAt = new Date(payload.createdAt).toISOString();
  }

  if (payload.dueDate) {
    payload.dueDate = new Date(payload.dueDate).toISOString();
  }

  if (payload.completedAt) {
    payload.completedAt = new Date(payload.completedAt).toISOString();
  }

  return payload;
};

const ensureHistoryEntry = (dateKey) => {
  let entry = streakMeta.history.find((item) => item.date === dateKey);
  if (!entry) {
    entry = { date: dateKey, completed: 0 };
    streakMeta.history.push(entry);
    streakMeta.history.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (streakMeta.history.length > 60) {
      streakMeta.history = streakMeta.history.slice(-60);
    }
  }
  return entry;
};

const refreshStreakFreshness = () => {
  if (!streakMeta.lastCompletedDate) {
    streakMeta.current = 0;
  } else {
    const todayKey = formatDateKey();
    const diffDays =
      (new Date(todayKey).setHours(0, 0, 0, 0) -
        new Date(streakMeta.lastCompletedDate).setHours(0, 0, 0, 0)) /
      86400000;
    if (diffDays > (teamSettings.resetGracePeriod || 0) + 1) {
      streakMeta.current = 0;
    }
  }
  mockUser.current_streak = streakMeta.current;
  mockUser.longest_streak = streakMeta.longest;
};

const recordStreakCompletion = (userId = mockUser.id, date = new Date()) => {
  const dayKey = formatDateKey(date);
  const existingEntry = ensureHistoryEntry(dayKey);
  existingEntry.completed += 1;

  if (!streakMeta.lastCompletedDate) {
    streakMeta.current = 1;
  } else {
    const lastDate = new Date(streakMeta.lastCompletedDate);
    const currentDate = new Date(dayKey);
    const diff =
      (currentDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) /
      86400000;
    if (diff === 0) {
      // same day - no change
    } else if (diff === 1) {
      streakMeta.current += 1;
    } else {
      streakMeta.current = 1;
    }
  }

  streakMeta.lastCompletedDate = dayKey;
  streakMeta.longest = Math.max(streakMeta.longest, streakMeta.current);
  mockUser.current_streak = streakMeta.current;
  mockUser.longest_streak = streakMeta.longest;
};

const computeTaskScore = (task) => {
  if (!task.completedAt) return 0;
  const weights = teamSettings.productivityWeights || { high: 3, medium: 2, low: 1 };
  const priorityWeight = weights[task.priority] || 1;
  const created = new Date(task.createdAt || task.completedAt);
  const completed = new Date(task.completedAt);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const hoursToComplete = Math.max(1, (completed - created) / (1000 * 60 * 60));
  let speedBonus = 1;
  if (due) {
    const diffDays = (due - completed) / 86400000;
    speedBonus += Math.min(0.5, Math.max(-0.5, diffDays / 5));
  }
  const focusMultiplier = Math.min(2, 24 / hoursToComplete);
  return priorityWeight * focusMultiplier * Math.max(0.5, speedBonus);
};

let mockTasks = [
  {
    id: 'task-1',
    title: 'Design landing page hero',
    description: 'Refresh hero section with new messaging and illustrations.',
    status: 'todo',
    priority: 'high',
    projectId: 'project-1',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    assigneeId: mockUser.id,
    assignee: getMemberSummary(mockUser.id)
  },
  {
    id: 'task-2',
    title: 'Integrate payment gateway',
    description: 'Wire Stripe test environment to staging build.',
    status: 'review',
    priority: 'medium',
    projectId: 'project-2',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    assigneeId: 'user-3',
    assignee: getMemberSummary('user-3')
  },
  {
    id: 'task-3',
    title: 'QA regression',
    description: 'Smoke test the new analytics widgets before release.',
    status: 'completed',
    priority: 'low',
    projectId: 'project-3',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    assigneeId: 'user-2',
    assignee: getMemberSummary('user-2')
  }
];

let mockProjects = [
  {
    id: 'project-1',
    name: 'Website Refresh',
    category: 'Product',
    description: 'Modernize key customer journeys with a new component system.',
    status: 'Active',
    progress: 72,
    dueDate: new Date().setDate(new Date().getDate() + 15),
    teamSize: 6
  },
  {
    id: 'project-2',
    name: 'Mobile Revamp',
    category: 'Mobile',
    description: 'Rebuild onboarding flow using new brand guidelines.',
    status: 'Planning',
    progress: 38,
    dueDate: new Date().setDate(new Date().getDate() + 30),
    teamSize: 4
  },
   {
    id: 'project-3',
    name: 'Test',
    category: 'demo',
    description: 'we are testing.',
    status: 'Planning',
    progress: 10,
    dueDate: new Date().setDate(new Date().getDate() + 30),
    teamSize: 5
  },
  {
    id: 'project-4',
    name: 'Analytics Dashboard',
    category: 'Data',
    description: 'Ship the second version of executive analytics.',
    status: 'In Review',
    progress: 90,
    dueDate: new Date().setDate(new Date().getDate() + 7),
    teamSize: 5
  }
];

let teamSettings = {
  streakGoal: 5,
  resetGracePeriod: 1,
  productivityWeights: {
    high: 3,
    medium: 2,
    low: 1
  },
  allowManualAdjustments: true
};

let notifications = [
  {
    id: 'notif-1',
    title: 'Task completed',
    message: 'MD.Mahee marked “QA regression” as done.',
    is_read: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'notif-2',
    title: 'New comment',
    message: 'Md.AKib left a note on “Payment gateway integration”.',
    is_read: false,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

let comments = [
  {
    id: 'comment-1',
    taskId: 'task-1',
    body: 'Initial hero draft looks solid. Let’s simplify the CTA copy.',
    author: getMemberSummary('user-2'),
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'comment-2',
    taskId: 'task-1',
    body: 'Agree on the copy change. Will update the design mockups tonight.',
    author: getMemberSummary('user-3'),
    created_at: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'comment-3',
    taskId: 'task-2',
    body: 'Waiting on the credentials from finance before deploying.',
    author: getMemberSummary('user-4'),
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

let activityFeed = [
  {
    id: 'activity-1',
    user: { name: 'Sabbir Ahmed' },
    action: 'created task',
    task: 'Mobile Revamp project brief',
    time: new Date().toISOString(),
    type: 'task'
  },
  {
    id: 'activity-2',
    user: { name: 'Tabeeb' },
    action: 'commented',
    task: 'Payment gateway integration',
    time: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    type: 'comment',
    comment: 'Following up on API response handling.'
  },
  {
    id: 'activity-3',
    user: { name: 'MD.Akib' },
    action: 'moved to completed',
    task: 'User interviews',
    time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: 'status',
    fromStatus: 'review',
    toStatus: 'completed'
  }
];

const chartSnapshots = {
  '7days': [65, 82, 74, 88, 91, 79, 86],
  '30days': [55, 60, 65, 70, 77, 82, 80],
  '3months': [48, 52, 60, 62, 69, 73, 78]
};

const nextId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const createToken = (prefix) => `${prefix}-${Math.random().toString(36).slice(2)}`;
const ACCESS_TTL_SECONDS = 15 * 60;

export const mockAuthApi = {
  login: async () =>
    delay({
      token: createToken('access'),
      refreshToken: createToken('refresh'),
      expiresIn: ACCESS_TTL_SECONDS,
      user: mockUser
    }),
  register: async (payload) =>
    delay({
      message: 'Mock registration successful',
      user: { ...mockUser, ...payload, id: nextId('user') }
    }),
  logout: async () => delay({ success: true }),
  getCurrentUser: async () => delay(mockUser),
  refreshToken: async () =>
    delay({
      token: createToken('access'),
      refreshToken: createToken('refresh'),
      expiresIn: ACCESS_TTL_SECONDS
    })
};

export const mockTaskApi = {
  getTasks: async (filters = {}) => {
    triggerDeadlineNotifications();
    let filtered = [...mockTasks];
    if (filters.status) filtered = filtered.filter((task) => task.status === filters.status);
    if (filters.priority) filtered = filtered.filter((task) => task.priority === filters.priority);
    if (filters.project) filtered = filtered.filter((task) => task.projectId === filters.project);
    if (filters.assignee) filtered = filtered.filter((task) => task.assigneeId === filters.assignee);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) => task.title.toLowerCase().includes(search) || task.description.toLowerCase().includes(search)
      );
    }
    return delay(filtered);
  },
  getTaskById: async (taskId) => delay(mockTasks.find((task) => task.id === taskId)),
  createTask: async (taskData) => {
    const task = {
      id: nextId('task'),
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...normalizeTaskPayload(taskData)
    };
    task.status = task.status || 'todo';
    task.priority = task.priority || 'medium';
    mockTasks = [task, ...mockTasks];
    logActivity({
      type: 'task',
      action: 'created task',
      taskId: task.id,
      userId: task.assigneeId || mockUser.id
    });
    notifyTaskCreated(task);
    if (task.assigneeId) {
      notifyTaskAssignment(task, task.assigneeId, { isNew: true });
    }
    if (task.status === 'completed') {
      task.completedAt = task.completedAt || new Date().toISOString();
      recordStreakCompletion(task.assigneeId || mockUser.id, task.completedAt);
      logActivity({
        type: 'status',
        action: 'completed task',
        taskId: task.id,
        userId: task.assigneeId || mockUser.id,
        meta: { toStatus: 'completed' }
      });
    }
    return delay(task);
  },
  updateTask: async (taskId, taskData) => {
    const existing = mockTasks.find((task) => task.id === taskId);
    if (!existing) return delay(null);
    const normalized = normalizeTaskPayload(taskData);
    const updated = { ...existing, ...normalized };
    mockTasks = mockTasks.map((task) => (task.id === taskId ? updated : task));
    const statusChanged = normalized.status && normalized.status !== existing.status;
    const assigneeChanged =
      Object.prototype.hasOwnProperty.call(normalized, 'assigneeId') &&
      normalized.assigneeId !== existing.assigneeId;

    if (normalized.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = updated.completedAt || new Date().toISOString();
      recordStreakCompletion(updated.assigneeId || mockUser.id, updated.completedAt);
    }

    if (statusChanged) {
      logActivity({
        type: 'status',
        action: `moved to ${normalized.status}`,
        taskId,
        userId: updated.assigneeId || mockUser.id,
        meta: { fromStatus: existing.status, toStatus: normalized.status }
      });
      notifyStatusChange(updated, existing.status, normalized.status);
    }

    if (assigneeChanged) {
      logActivity({
        type: 'assignment',
        action: 'changed assignee',
        taskId,
        userId: normalized.assigneeId || mockUser.id,
        meta: {
          fromAssignee: getMemberSummary(existing.assigneeId),
          toAssignee: getMemberSummary(normalized.assigneeId)
        }
      });
      notifyTaskAssignment(updated, normalized.assigneeId, {
        previousAssignee: existing.assigneeId
      });
    }

    if (normalized.priority && normalized.priority !== existing.priority) {
      logActivity({
        type: 'priority',
        action: 'updated priority',
        taskId,
        userId: updated.assigneeId || mockUser.id,
        meta: {
          fromPriority: existing.priority,
          toPriority: normalized.priority
        }
      });
    }

    return delay(updated);
  },
  deleteTask: async (taskId) => {
    const task = getTaskById(taskId);
    mockTasks = mockTasks.filter((task) => task.id !== taskId);
    if (task) {
      logActivity({
        type: 'task',
        action: 'deleted task',
        taskId,
        userId: task.assigneeId || mockUser.id
      });
    }
    return delay({ success: true });
  },
  updateTaskStatus: async (taskId, status) => mockTaskApi.updateTask(taskId, { status }),
  assignTask: async (taskId, userId) => mockTaskApi.updateTask(taskId, { assigneeId: userId }),
  completeTask: async (taskId) => mockTaskApi.updateTask(taskId, { status: 'completed' }),
  getMyTasks: async () => delay(mockTasks.filter((task) => task.assignee?.id === mockUser.id))
};

export const mockProjectApi = {
  getProjects: async () => delay(mockProjects),
  getProjectById: async (projectId) => delay(mockProjects.find((project) => project.id === projectId)),
  createProject: async (projectData) => {
    const project = { id: nextId('project'), progress: 0, teamSize: 1, ...projectData };
    mockProjects = [project, ...mockProjects];
    return delay(project);
  },
  updateProject: async (projectId, projectData) => {
    mockProjects = mockProjects.map((project) => (project.id === projectId ? { ...project, ...projectData } : project));
    return delay(mockProjects.find((project) => project.id === projectId));
  },
  deleteProject: async (projectId) => {
    mockProjects = mockProjects.filter((project) => project.id !== projectId);
    return delay({ success: true });
  },
  getProjectTasks: async (projectId) => delay(mockTasks.filter((task) => task.projectId === projectId))
};

export const mockDashboardApi = {
  getStatistics: async () => {
    const completed = mockTasks.filter((task) => task.status === 'completed').length;
    const inProgress = mockTasks.filter((task) => task.status === 'in_progress').length;
    const pending = mockTasks.filter((task) => task.status === 'todo').length;
    return delay({
      completed,
      inProgress,
      pending,
      activeProjects: mockProjects.length,
      productivity: mockUser.productivity_score
    });
  },
  getChartData: async (period = '7days') => {
    const periodMap = {
      '7days': 7,
      '30days': 30,
      '3months': 90
    };
    const days = periodMap[period] || 7;
    const labels = [];
    let productivity = [];
    let totalScore = 0;
    let totalHours = 0;
    let completedCount = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      labels.push(date.toLocaleDateString(undefined, { weekday: 'short' }));

      const dayTasks = mockTasks.filter(
        (task) => task.completedAt && formatDateKey(task.completedAt) === dateKey
      );

      const dayScore = dayTasks.reduce((sum, task) => sum + computeTaskScore(task), 0);
      productivity.push(Math.round(dayScore));

      dayTasks.forEach((task) => {
        const created = new Date(task.createdAt || task.completedAt);
        const completed = new Date(task.completedAt);
        const durationHours = Math.max(1, (completed - created) / (1000 * 60 * 60));
        totalHours += durationHours;
        completedCount += 1;
        totalScore += computeTaskScore(task);
      });
    }

    let summary = {
      productivityScore: completedCount ? Number((totalScore / completedCount).toFixed(1)) : 0,
      completed: completedCount,
      averageCompletionHours: completedCount ? Number((totalHours / completedCount).toFixed(1)) : 0
    };

    if (productivity.every((value) => value === 0)) {
      const snapshot = chartSnapshots[period] || chartSnapshots['7days'];
      productivity = labels.map((_, index) => snapshot[index % snapshot.length]);
      const avgProductivity =
        productivity.reduce((sum, value) => sum + value, 0) / (productivity.length || 1);
      summary = {
        productivityScore: Number(avgProductivity.toFixed(1)),
        completed: Math.round(productivity.length * 0.75),
        averageCompletionHours: 6
      };
    }

    return delay({
      labels,
      productivity,
      summary,
      streakHistory: getStreakHistoryWindow(Math.min(days, 14))
    });
  },
  getLeaderboard: async () =>
    delay([
      { id: mockUser.id, name: mockUser.name, productivity_score: 950, streak: mockUser.current_streak },
      { id: 'user-2', name: 'Sabbir Ahmed', productivity_score: 900, streak: 12 },
      { id: 'user-3', name: 'Tabeeb', productivity_score: 870, streak: 10 },
      { id: 'user-4', name: 'MD.Akib', productivity_score: 820, streak: 9 },
      { id: 'user-5', name: 'MD.Mahee', productivity_score: 790, streak: 7 }
    ]),
  getMyAnalytics: async () =>
    delay({
      tasksCompleted: mockTasks.filter((task) => task.status === 'completed').length,
      focusTime: 32,
      flowStreak: mockUser.current_streak
    }),
  getRecentActivity: async (limit = 10) => delay(activityFeed.slice(0, limit))
};

export const mockUserApi = {
  getUsers: async () => delay(teamMembers),
  getUserById: async (userId) =>
    delay(teamMembers.find((member) => member.id === userId) || { id: userId, name: 'Guest User' }),
  updateUserProfile: async (userId, payload) => {
    teamMembers = teamMembers.map((member) =>
      member.id === userId ? { ...member, ...structuredClone(payload) } : member
    );
    if (userId === mockUser.id) {
      Object.assign(mockUser, payload);
    }
    return delay(teamMembers.find((member) => member.id === userId));
  },
  deleteUser: async (userId) => {
    teamMembers = teamMembers.filter((member) => member.id !== userId);
    return delay({ success: true });
  },
  getUserStreak: async () =>
    delay({
      current_streak: mockUser.current_streak,
      longest_streak: mockUser.longest_streak,
      productivity_score: mockUser.productivity_score
    }),
  getUserProductivity: async () =>
    delay({
      tasksCompleted: mockTasks.filter((task) => task.status === 'completed').length,
      focusMinutes: 1260
    })
};

export const mockNotificationApi = {
  getNotifications: async () => {
    triggerDeadlineNotifications();
    return delay(notifications);
  },
  getUnreadNotifications: async () => {
    triggerDeadlineNotifications();
    return delay(notifications.filter((notif) => !notif.is_read));
  },
  markAsRead: async (notificationId) => {
    notifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, is_read: true } : notif
    );
    return delay({ success: true });
  },
  markAllAsRead: async () => {
    notifications = notifications.map((notif) => ({ ...notif, is_read: true }));
    return delay({ success: true });
  },
  deleteNotification: async (notificationId) => {
    notifications = notifications.filter((notif) => notif.id !== notificationId);
    return delay({ success: true });
  }
};

export const mockCommentApi = {
  getTaskComments: async (taskId) =>
    delay(comments.filter((comment) => comment.taskId === taskId).sort((a, b) =>
      a.created_at < b.created_at ? -1 : 1
    )),
  addComment: async (taskId, payload = {}) => {
    const text = payload.comment || payload.body || '';
    const authorId = payload.authorId || mockUser.id;
    const task = getTaskById(taskId);
    const newComment = {
      id: nextId('comment'),
      taskId,
      body: text,
      author: getMemberSummary(authorId),
      created_at: new Date().toISOString()
    };
    comments = [...comments, newComment];
    logActivity({
      type: 'comment',
      action: 'commented',
      taskId,
      userId: authorId,
      meta: { comment: text }
    });
    notifyCommentAdded(task, text, authorId);
    return delay(newComment);
  },
  updateComment: async (commentId, payload = {}) => {
    const text = payload.comment || payload.body || '';
    comments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, body: text, updated_at: new Date().toISOString() } : comment
    );
    return delay(comments.find((comment) => comment.id === commentId));
  },
  deleteComment: async (commentId) => {
    comments = comments.filter((comment) => comment.id !== commentId);
    return delay({ success: true });
  }
};

const getStreakHistoryWindow = (days = 14) => {
  const sorted = [...streakMeta.history].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.slice(-days).map((entry) => ({
    ...entry,
    hitGoal: entry.completed > 0
  }));
};

const recalculateStreakFromHistory = () => {
  const sorted = [...streakMeta.history].sort((a, b) => (a.date < b.date ? -1 : 1));
  streakMeta.current = 0;
  streakMeta.longest = 0;
  streakMeta.lastCompletedDate = null;

  sorted.forEach((entry) => {
    if (entry.completed > 0) {
      const completionDate = entry.date;
      if (!streakMeta.lastCompletedDate) {
        streakMeta.current = 1;
      } else {
        const lastDate = new Date(streakMeta.lastCompletedDate);
        const currentDate = new Date(completionDate);
        const diff =
          (currentDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) /
          86400000;
        if (diff === 0) {
          // same day, ignore
        } else if (diff === 1) {
          streakMeta.current += 1;
        } else {
          streakMeta.current = 1;
        }
      }
      streakMeta.lastCompletedDate = completionDate;
      streakMeta.longest = Math.max(streakMeta.longest, streakMeta.current);
    }
  });

  mockUser.current_streak = streakMeta.current;
  mockUser.longest_streak = streakMeta.longest;
};

export const mockStreakApi = {
  getSummary: async () => {
    refreshStreakFreshness();
    const lastDate = streakMeta.lastCompletedDate ? new Date(streakMeta.lastCompletedDate) : null;
    const today = new Date(formatDateKey());
    const diff =
      lastDate !== null ? (today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / 86400000 : null;
    const resetIn =
      diff !== null ? Math.max(0, (teamSettings.resetGracePeriod || 0) - Math.max(0, diff - 1)) : null;
    return delay({
      current_streak: mockUser.current_streak,
      longest_streak: mockUser.longest_streak,
      goal: teamSettings.streakGoal,
      goalProgress: Math.min(1, mockUser.current_streak / (teamSettings.streakGoal || 1)),
      lastCompletedDate: streakMeta.lastCompletedDate,
      daysSinceCompletion: diff,
      resetIn
    });
  },
  getHistory: async (days = 14) => delay(getStreakHistoryWindow(days)),
  calculateStreak: async () => {
    recalculateStreakFromHistory();
    return delay({
      current_streak: mockUser.current_streak,
      longest_streak: mockUser.longest_streak
    });
  },
  recordCompletion: async (userId, date) => {
    recordStreakCompletion(userId, date ? new Date(date) : new Date());
    return delay({ success: true });
  }
};

export const mockTeamApi = {
  getTeamMembers: async () => delay(teamMembers),
  inviteMember: async ({ name, email, role = 'member' }) => {
    const newMember = {
      id: nextId('user'),
      name,
      email,
      role,
      title: 'Team Member',
      phone: '',
      current_streak: 0,
      longest_streak: 0,
      productivity_score: 0
    };
    teamMembers = [...teamMembers, newMember];
    logTeamEvent({
      action: 'invited new member',
      memberId: newMember.id,
      meta: { email: newMember.email, description: newMember.email }
    });
    notifyTeamChange({
      title: 'New teammate',
      message: `${newMember.name} joined as ${role === 'admin' ? 'Admin' : 'Member'}`,
      meta: { memberId: newMember.id }
    });
    return delay(newMember);
  },
  updateUserRole: async (userId, role) => {
    teamMembers = teamMembers.map((member) =>
      member.id === userId ? { ...member, role } : member
    );
    if (userId === mockUser.id) {
      mockUser.role = role;
    }
    const updated = teamMembers.find((member) => member.id === userId);
    logTeamEvent({
      action: `changed role to ${role}`,
      memberId: userId,
      meta: { description: `Role set to ${role}` }
    });
    notifyTeamChange({
      title: 'Role updated',
      message: `${updated?.name || 'Team member'} is now ${role}`,
      meta: { memberId: userId, role }
    });
    return delay(updated);
  },
  removeTeamMember: async (userId) => {
    const removed = teamMembers.find((member) => member.id === userId);
    teamMembers = teamMembers.filter((member) => member.id !== userId);
    logTeamEvent({
      action: 'removed member',
      memberId: userId,
      meta: { description: removed?.name || userId }
    });
    notifyTeamChange({
      title: 'Member removed',
      message: `Access revoked for ${removed?.name || 'a member'}`,
      meta: { memberId: userId }
    });
    return delay({ success: true });
  },
  getTeamSettings: async () => delay(teamSettings),
  updateTeamSettings: async (settings) => {
    teamSettings = {
      ...teamSettings,
      ...structuredClone(settings),
      productivityWeights: {
        ...teamSettings.productivityWeights,
        ...structuredClone(settings.productivityWeights)
      }
    };
    logTeamEvent({
      action: 'updated team settings',
      meta: { description: 'Team configuration' }
    });
    notifyTeamChange({
      title: 'Team settings updated',
      message: 'Streak and productivity rules were changed',
      meta: { settings: structuredClone(teamSettings) }
    });
    return delay(teamSettings);
  },
  adjustMemberStats: async (userId, payload = {}) => {
    const updates = {
      current_streak: Number(payload.current_streak ?? payload.currentStreak),
      longest_streak: Number(payload.longest_streak ?? payload.longestStreak),
      productivity_score: Number(payload.productivity_score ?? payload.productivityScore)
    };
    teamMembers = teamMembers.map((member) =>
      member.id === userId
        ? {
            ...member,
            current_streak: Number.isFinite(updates.current_streak) ? updates.current_streak : member.current_streak || 0,
            longest_streak: Number.isFinite(updates.longest_streak)
              ? updates.longest_streak
              : member.longest_streak || member.current_streak || 0,
            productivity_score: Number.isFinite(updates.productivity_score)
              ? updates.productivity_score
              : member.productivity_score || 0
          }
        : member
    );
    const updated = teamMembers.find((member) => member.id === userId);
    if (userId === mockUser.id && updated) {
      mockUser.current_streak = updated.current_streak;
      mockUser.longest_streak = updated.longest_streak;
      mockUser.productivity_score = updated.productivity_score;
    }
    logTeamEvent({
      action: 'adjusted stats',
      memberId: userId,
      meta: {
        current_streak: updated?.current_streak,
        productivity_score: updated?.productivity_score,
        description: `Streak ${updated?.current_streak ?? 0}, productivity ${updated?.productivity_score ?? 0}`
      }
    });
    notifyTeamChange({
      title: 'Member stats adjusted',
      message: `${updated?.name || 'Team member'} streak/productivity was updated`,
      meta: { memberId: userId }
    });
    return delay(updated);
  }
};

export const getMockUser = () => structuredClone(mockUser);
