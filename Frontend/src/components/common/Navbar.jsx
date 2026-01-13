import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, Settings, LogOut, CheckSquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      darkMode ? 'bg-gray-800/80 backdrop-blur-lg border-gray-700' : 'bg-white/80 backdrop-blur-lg border-gray-200'
    } border-b`}>
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${
              darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            } transition-colors`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="text-white" size={20} />
            </div>
            <span className={`font-bold text-xl hidden sm:block ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>TaskFlow</span>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl w-full ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks, projects..." 
              className={`bg-transparent outline-none w-full ${
                darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl ${
              darkMode ? 'bg-gray-700 text-amber-200' : 'bg-gray-100 text-indigo-600'
            } transition-colors`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings */}
          <button 
            className={`p-2 rounded-xl ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
            onClick={() => navigate('/profile')}
          >
            <Settings size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2">
              <Avatar user={user} size="sm" />
              <span className={`hidden sm:block font-medium ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {user?.name}
              </span>
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute right-0 mt-2 w-48 py-2 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <button
                onClick={() => navigate('/profile')}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Settings size={16} />
                Profile Settings
              </button>
              <button
                onClick={logout}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 text-red-500 ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
