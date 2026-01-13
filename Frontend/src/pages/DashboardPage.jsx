import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Dashboard from '../components/dashboard/Dashboard';

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="max-w-7xl mx-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
