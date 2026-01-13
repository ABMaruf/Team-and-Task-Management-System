import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Users } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import * as projectService from '../services/projectService';
import { validateProjectForm } from '../utils/validators';
import { formatStatus } from '../utils/helpers';
import { toast } from 'react-toastify';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

const emptyProjectState = {
  name: '',
  description: '',
  status: 'active',
  dueDate: '',
  category: ''
};

const formatInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const ProjectModal = ({ isOpen, onClose, onSubmit, initialData, loading, errors }) => {
  const [formState, setFormState] = useState(emptyProjectState);

  useEffect(() => {
    if (initialData) {
      setFormState({
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
        dueDate: formatInputDate(initialData.dueDate),
        category: initialData.category || ''
      });
    } else {
      setFormState(emptyProjectState);
    }
  }, [initialData, isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formState);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Project' : 'New Project'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Project name</label>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="Give the project a name"
              required
            />
            {errors?.name ? (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
            <input
              type="text"
              name="category"
              value={formState.category}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="Product, Marketing, Mobile..."
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">Description</label>
          <textarea
            name="description"
            value={formState.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="Add context or goals for the project"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
            <select
              name="status"
              value={formState.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Target date</label>
            <input
              type="date"
              name="dueDate"
              value={formState.dueDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark] date-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ProjectsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { darkMode } = useTheme();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjects();
        setProjects(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to load projects', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const openCreateModal = () => {
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleModalSubmit = async (formState) => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      status: formState.status || 'active',
      category: formState.category.trim(),
      dueDate: formState.dueDate || null
    };

    const validation = validateProjectForm(payload);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setModalLoading(true);
      const created = await projectService.createProject(payload);
      const nextProject = {
        ...created,
        name: created?.name || payload.name,
        description: created?.description ?? payload.description,
        status: created?.status || payload.status,
        category: created?.category || formState.category || 'General',
        dueDate: created?.dueDate ?? formState.dueDate ?? null,
        progress: Number.isFinite(Number(created?.progress)) ? Number(created.progress) : 0,
        teamSize: created?.teamSize ?? created?.member_count ?? 1
      };
      setProjects((prev) => [nextProject, ...prev]);
      toast.success('Project created successfully');
      closeModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
    } finally {
      setModalLoading(false);
    }
  };

  const formatDueDate = (value) => {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep your initiatives on track</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            </div>
            <Button icon={<Plus size={18} />} onClick={openCreateModal}>
              New Project
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const progress = Number.isFinite(Number(project.progress)) ? Number(project.progress) : 0;
                const teamSize = Number.isFinite(Number(project.teamSize ?? project.member_count))
                  ? Number(project.teamSize ?? project.member_count)
                  : 0;
                const description = project.description || 'No description';
                const statusLabel = formatStatus(project.status || 'active');
                return (
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
                      <span className="text-sm font-semibold text-indigo-500">{statusLabel}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                    <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        <span>Due {formatDueDate(project.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{teamSize} members</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        loading={modalLoading}
        errors={formErrors}
      />
    </div>
  );
};

export default ProjectsPage;
