import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Loader from '../common/Loader';
import * as dashboardService from '../../services/dashboardService';

const heatClass = (value, dark) => {
  if (value >= 1) {
    return dark ? 'bg-orange-500/70 border-orange-400' : 'bg-orange-200 border-orange-300';
  }
  if (value > 0) {
    return dark ? 'bg-emerald-500/60 border-emerald-400' : 'bg-emerald-100 border-emerald-200';
  }
  return dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
};

const ProductivityChart = () => {
  const { darkMode } = useTheme();
  const [period, setPeriod] = useState('7days');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getChartData(period);
      setChartData(data);
    } catch (error) {
      console.error('Error fetching productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border`}>
        <Loader />
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  const { summary, labels, productivity, streakHistory } = chartData;
  const trend = productivity.length
    ? Math.round(((productivity[productivity.length - 1] - productivity[0]) / (productivity[0] || 1)) * 100)
    : 0;

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Productivity & Flow
        </h3>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="3months">Last 3 months</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className={`${darkMode ? 'bg-gray-900/40' : 'bg-gray-100'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp size={16} className="text-indigo-500" />
            Productivity score
          </div>
          <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.productivityScore}
          </p>
          <p className="text-xs text-green-500">{trend >= 0 ? '+' : ''}{trend}% vs first day</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-900/40' : 'bg-gray-100'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle size={16} className="text-emerald-500" />
            Tasks completed
          </div>
          <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.completed}
          </p>
          <p className="text-xs text-gray-500">within selected range</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-900/40' : 'bg-gray-100'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} className="text-amber-500" />
            Avg completion time
          </div>
          <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.averageCompletionHours}h
          </p>
          <p className="text-xs text-gray-500">from start to done</p>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <div className="h-48 min-w-[560px] flex items-end justify-between gap-2">
          {productivity.map((value, index) => (
            <div key={labels[index]} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-indigo-500 to-purple-500 transition-all duration-300 group-hover:opacity-80"
                  style={{ height: `${Math.max(4, value * 1.2)}px` }}
                >
                  <div
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                    }`}
                  >
                    {value.toFixed(0)}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Streak heatmap
          </p>
          <p className="text-xs text-gray-500">Goal hits over last two weeks</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[560px] grid grid-cols-14 gap-1">
            {streakHistory.map((entry) => (
              <div key={entry.date} className="flex flex-col items-center gap-1">
                <div
                  className={`h-8 w-full rounded-lg border text-xs flex items-center justify-center ${heatClass(
                    entry.completed,
                    darkMode
                  )}`}
                >
                  {entry.completed > 0 ? entry.completed : ''}
                </div>
                <span className="text-[10px] text-gray-500">
                  {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityChart;
