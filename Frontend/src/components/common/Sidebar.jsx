import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Folder, UserCircle, Shield, CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { isAdmin } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <CheckSquare size={20} />, label: 'Tasks', path: '/tasks' },
    { icon: <CalendarDays size={20} />, label: 'Calendar', path: '/calendar' },
    { icon: <Folder size={20} />, label: 'Projects', path: '/projects' },
    { icon: <UserCircle size={20} />, label: 'Profile', path: '/profile' }
  ];

  if (isAdmin) {
    menuItems.push({
      icon: <Shield size={20} />,
      label: 'Team',
      path: '/admin/team'
    });
  }

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${
      isOpen ? 'w-64' : 'w-0'
    } transition-all duration-300 overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border-r z-40`}>
      <div className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
