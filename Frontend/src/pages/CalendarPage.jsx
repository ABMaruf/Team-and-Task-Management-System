import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCcw,
  Tag,
  User
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../hooks/useTasks';
import * as userService from '../services/userService';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityStyles = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
};

const statusStyles = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800/70 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
};

const pad = (value) => String(value).padStart(2, '0');
const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const createToday = () => normalizeDate(new Date());
const getDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildCalendarDays = (anchorDate) => {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1;
    const date = new Date(year, month, dayNumber);
    return {
      date,
      isCurrentMonth: date.getMonth() === month
    };
  });
};

const CalendarPage = () => {
  const initialToday = createToday();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    search: ''
  });
  const [members, setMembers] = useState([]);
  const [currentDate, setCurrentDate] = useState(() => new Date(initialToday.getFullYear(), initialToday.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const { darkMode } = useTheme();
  const { tasks, loading, fetchTasks } = useTasks(filters);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await userService.getUsers();
        setMembers(data);
      } catch (error) {
        console.error('Failed to load members', error);
      }
    };
    loadMembers();
  }, []);

  const monthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      startTime: start.getTime(),
      endTime: end.getTime()
    };
  }, [currentDate]);

  const today = createToday();
  const todayKey = getDateKey(today);
  const todayTime = today.getTime();
  const nextWeekTime = todayTime + 7 * 24 * 60 * 60 * 1000;

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = getDateKey(new Date(task.dueDate));
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(task);
    });
    Object.values(map).forEach((dailyTasks) => {
      dailyTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    });
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => buildCalendarDays(currentDate), [currentDate]);
  const selectedKey = selectedDate ? getDateKey(selectedDate) : null;
  const selectedTasks = selectedKey ? tasksByDate[selectedKey] || [] : [];

  const monthTaskCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueDate) return false;
        const dueTime = new Date(task.dueDate).getTime();
        return dueTime >= monthRange.startTime && dueTime <= monthRange.endTime;
      }).length,
    [tasks, monthRange.startTime, monthRange.endTime]
  );

  const overdueCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate).getTime() < todayTime;
      }).length,
    [tasks, todayTime]
  );

  const upcomingCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueTime = new Date(task.dueDate).getTime();
        return dueTime >= todayTime && dueTime <= nextWeekTime;
      }).length,
    [tasks, todayTime, nextWeekTime]
  );

  const handleMonthChange = (offset) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleSelectDay = (day) => {
    const normalized = normalizeDate(day);
    setSelectedDate(normalized);
    if (normalized.getMonth() !== currentDate.getMonth() || normalized.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      status: '',
      assignee: '',
      search: ''
    });
  };

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const jumpToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Visualize deadlines and plan the week</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                icon={<RefreshCcw size={16} />}
                onClick={fetchTasks}
                className="border-gray-200"
              >
                Refresh
              </Button>
              <Button onClick={jumpToToday}>
                Today
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">Due this month</p>
              <p className="mt-2 text-3xl font-semibold text-indigo-500">{monthTaskCount}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="mt-2 text-3xl font-semibold text-rose-500">{overdueCount}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">Next 7 days</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-500">{upcomingCount}</p>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="bg-transparent outline-none text-gray-900 placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                  placeholder="Search tasks"
                />
              </div>
              <select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
              >
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
              >
                <option value="">All statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
              <select
                name="assignee"
                value={filters.assignee}
                onChange={handleFilterChange}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
              >
                <option value="">All assignees</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-indigo-500" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{monthLabel}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click a date to view due tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronLeft size={16} />}
                  onClick={() => handleMonthChange(-1)}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ChevronRight size={16} />}
                  onClick={() => handleMonthChange(1)}
                >
                  Next
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader size="lg" />
              </div>
            ) : (
              <div className="mt-6">
                <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {weekdayLabels.map((day) => (
                    <div key={day} className="py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {calendarDays.map(({ date, isCurrentMonth }) => {
                    const key = getDateKey(date);
                    const dayTasks = tasksByDate[key] || [];
                    const isSelected = selectedKey === key;
                    const isToday = todayKey === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleSelectDay(date)}
                        className={`flex flex-col rounded-2xl border p-2 text-left transition-all ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        } ${!isCurrentMonth ? 'opacity-50' : ''} ${
                          isSelected ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''
                        } ${isToday ? 'bg-indigo-50/80 dark:bg-indigo-500/10' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {date.getDate()}
                          </span>
                          <span className="text-[11px] text-gray-400">{dayTasks.length || ''}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className={`truncate rounded-lg px-2 py-1 text-[11px] font-medium ${
                                priorityStyles[task.priority] || priorityStyles.medium
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                              +{dayTasks.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tasks due on</p>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                </h2>
              </div>
              <span className="text-sm font-semibold text-indigo-500">{selectedTasks.length} tasks</span>
            </div>
            <div className="mt-4 space-y-4">
              {selectedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks due on this day.</p>
              ) : (
                selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{task.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.description || 'No description provided.'}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status] || statusStyles.todo}`}>
                        {task.status ? task.status.replace(/_/g, ' ') : 'Unknown'}
                      </span>
                    </div>
                    <div className={`mt-3 flex flex-wrap items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          priorityStyles[task.priority] || priorityStyles.medium
                        }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
