import React, { useEffect, useState } from 'react';
import { CalendarDays, FolderKanban, Users } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import * as projectService from '../services/projectService';

const ProjectsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjects();
        setProjects(response);
      } catch (error) {
        console.error('Failed to load projects', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep your initiatives on track</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            </div>
            <Button icon={<FolderKanban size={18} />}>New Project</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-indigo-500">{project.category || 'General'}</p>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                    </div>
                    <span className="text-sm font-semibold text-indigo-500">{project.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                  <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{project.teamSize} members</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
