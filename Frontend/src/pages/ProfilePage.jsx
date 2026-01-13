import React, { useState } from 'react';
import { Mail, Phone, Shield, User, Save } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, updateUser } = useAuth();
  const { darkMode } = useTheme();
  const [formState, setFormState] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    title: user?.title || 'Product Manager'
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateUser({ ...user, ...formState });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage how your teammates see you</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`rounded-2xl border p-6 space-y-6 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Full Name
                <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 dark:border-gray-600">
                  <User size={18} className="text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none"
                    placeholder="Alex Johnson"
                  />
                </div>
              </label>

              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Job Title
                <div className="mt-2 rounded-xl border px-3 py-2 dark:border-gray-600">
                  <input
                    type="text"
                    name="title"
                    value={formState.title}
                    onChange={handleChange}
                    className="w-full bg-transparent text-gray-900 dark:text-white outline-none"
                    placeholder="Product Manager"
                  />
                </div>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Email Address
                <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 dark:border-gray-600">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none"
                    placeholder="alex@example.com"
                  />
                </div>
              </label>

              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Phone
                <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 dark:border-gray-600">
                  <Phone size={18} className="text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </label>
            </div>

            <div className="rounded-2xl border px-4 py-3 text-sm dark:border-gray-700 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 flex items-start gap-3">
              <Shield size={20} className="mt-0.5" />
              <p>All profile changes are stored locally in mock mode so you can preview interactions without a backend.</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" icon={<Save size={18} />}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
