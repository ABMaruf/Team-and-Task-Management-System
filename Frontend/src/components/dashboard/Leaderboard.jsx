import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AnimatedCard from '../common/AnimatedCard';
import Avatar from '../common/Avatar';
import * as dashboardService from '../../services/dashboardService';

const Leaderboard = () => {
  const { darkMode } = useTheme();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await dashboardService.getLeaderboard(5);
      setLeaders(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback data
      setLeaders([
        { id: 1, name: 'Sarah Miller', productivity_score: 950, streak: 15 },
        { id: 2, name: 'Mike Johnson', productivity_score: 890, streak: 12 },
        { id: 3, name: 'Emily Davis', productivity_score: 850, streak: 10 },
        { id: 4, name: 'John Smith', productivity_score: 820, streak: 8 },
        { id: 5, name: 'Lisa Brown', productivity_score: 780, streak: 7 }
      ]);
    }
  };

  const getRankColor = (index) => {
    if (index === 0) return 'from-yellow-400 to-yellow-600';
    if (index === 1) return 'from-gray-300 to-gray-500';
    if (index === 2) return 'from-orange-400 to-orange-600';
    return 'from-indigo-400 to-purple-600';
  };

  return (
    <AnimatedCard className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`} variant="glow">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="text-yellow-500" size={24} />
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Top Performers
        </h3>
      </div>

      <div className="space-y-4">
        {leaders.map((leader, index) => (
          <div
            key={leader.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            {/* Rank Badge */}
            <div className={`w-8 h-8 bg-gradient-to-br ${getRankColor(index)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {index + 1}
            </div>

            {/* Avatar */}
            <Avatar user={leader} size="sm" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {leader.name}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {leader.streak} day streak
              </p>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {leader.productivity_score}
              </p>
              <div className="flex items-center gap-1 text-green-500 text-xs">
                <TrendingUp size={12} />
                <span>+12%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button className={`w-full mt-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
        darkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-400' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
      }`}>
        View Full Leaderboard
      </button>
    </AnimatedCard>
  );
};

export default Leaderboard;