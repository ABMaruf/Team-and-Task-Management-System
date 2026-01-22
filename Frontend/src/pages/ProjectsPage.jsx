import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Users, MessageCircle, UserPlus, Crown, Shield } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
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
  const [detailsProject, setDetailsProject] = useState(null);
  const [detailsTab, setDetailsTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const { darkMode } = useTheme();
  const { user } = useAuth();

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

  useEffect(() => {
    if (!detailsProject) return;
    const projectId = detailsProject.id;
    const loadMembers = async () => {
      try {
        setMembersLoading(true);
        const data = await projectService.getProjectMembers(projectId);
        setMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load project members', error);
        toast.error('Unable to load project members');
      } finally {
        setMembersLoading(false);
      }
    };

    const loadMessages = async () => {
      try {
        setMessagesLoading(true);
        const data = await projectService.getProjectMessages(projectId);
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load project chat', error);
        toast.error('Unable to load project chat');
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMembers();
    loadMessages();
  }, [detailsProject]);

  const openDetailsModal = (project, tab = 'members') => {
    setDetailsProject(project);
    setDetailsTab(tab);
    setMemberForm({ email: '', role: 'member' });
    setMessageText('');
  };

  const closeDetailsModal = () => {
    setDetailsProject(null);
    setMembers([]);
    setMessages([]);
    setMessageText('');
  };

  const handleMemberFormChange = (event) => {
    const { name, value } = event.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!detailsProject) return;
    if (!memberForm.email.trim()) {
      toast.warn('Email is required');
      return;
    }
    try {
      setMemberSubmitting(true);
      await projectService.createProjectInvite(detailsProject.id, {
        email: memberForm.email.trim(),
        role: memberForm.role
      });
      setMemberForm({ email: '', role: 'member' });
      toast.success('Invitation sent');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send invite';
      toast.error(message);
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleMemberRoleChange = async (memberId, role) => {
    if (!detailsProject) return;
    try {
      const updated = await projectService.updateProjectMemberRole(detailsProject.id, memberId, { role });
      setMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role: updated.role } : member)));
      toast.success('Role updated');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update role';
      toast.error(message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!detailsProject) return;
    try {
      await projectService.removeProjectMember(detailsProject.id, memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.info('Member removed');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove member';
      toast.error(message);
    }
  };

  const handleSendMessage = async () => {
    if (!detailsProject || !messageText.trim()) return;
    try {
      setMessageSubmitting(true);
      const created = await projectService.addProjectMessage(detailsProject.id, {
        message: messageText.trim()
      });
      setMessages((prev) => [...prev, created]);
      setMessageText('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setMessageSubmitting(false);
    }
  };

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

  const isOwner = detailsProject?.my_role === 'owner';
  const isAdmin = ['owner', 'admin'].includes(detailsProject?.my_role);

  const getCreatorId = (project) => project?.created_by ?? project?.createdBy ?? null;
  const ownedProjects = user
    ? projects.filter((project) => String(getCreatorId(project)) === String(user.id))
    : projects;
  const otherProjects = user
    ? projects.filter((project) => String(getCreatorId(project)) !== String(user.id))
    : [];

  const renderProjectsGrid = (projectList, emptyMessage) => {
    if (projectList.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {emptyMessage}
        </div>
      );
    }
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projectList.map((project) => {
          const progress = Number.isFinite(Number(project.progress)) ? Number(project.progress) : 0;
          const teamSize = Number.isFinite(Number(project.teamSize ?? project.member_count))
            ? Number(project.teamSize ?? project.member_count)
            : 0;
          const description = project.description || 'No description';
          const statusLabel = formatStatus(project.status || 'active');
          const roleLabel = project.my_role
            ? project.my_role.charAt(0).toUpperCase() + project.my_role.slice(1)
            : null;
          const isOwned = String(getCreatorId(project)) === String(user?.id);
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
                  {!isOwned && project.creator_name ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Owner: {project.creator_name}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-indigo-500">{statusLabel}</span>
                  {roleLabel ? (
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{roleLabel}</p>
                  ) : null}
                </div>
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
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Users size={16} />}
                  onClick={() => openDetailsModal(project, 'members')}
                >
                  Members
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<MessageCircle size={16} />}
                  onClick={() => openDetailsModal(project, 'chat')}
                >
                  Chat
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
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
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Projects</h2>
                </div>
                {renderProjectsGrid(ownedProjects, 'No projects created yet.')}
              </section>
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Other Projects</h2>
                </div>
                {renderProjectsGrid(otherProjects, 'No invited projects yet.')}
              </section>
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

      <Modal
        isOpen={!!detailsProject}
        onClose={closeDetailsModal}
        title={detailsProject ? `Project - ${detailsProject.name}` : 'Project'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {['overview', 'members', 'chat'].map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailsTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  detailsTab === tab
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {detailsTab === 'overview' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  {detailsProject?.description || 'No description'}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                    {formatStatus(detailsProject?.status || 'active')}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">Due date</p>
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                    {formatDueDate(detailsProject?.dueDate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">Your role</p>
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                    {detailsProject?.my_role ? detailsProject.my_role.toUpperCase() : 'Member'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {detailsTab === 'members' ? (
            <div className="space-y-6">
              {membersLoading ? (
                <div className="flex justify-center py-10">
                  <Loader size="lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const isSelf = member.id === user?.id;
                    const canRemove = isOwner && member.role !== 'owner' && !isSelf;
                    const canEditRole = isOwner && member.role !== 'owner';
                    return (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-gray-500 dark:text-gray-400">{member.email}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {member.role === 'owner' ? (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Crown size={14} /> Owner
                              </span>
                            ) : member.role === 'admin' ? (
                              <span className="flex items-center gap-1 text-indigo-500">
                                <Shield size={14} /> Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Users size={14} /> Member
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={member.role}
                            disabled={!canEditRole}
                            onChange={(event) => handleMemberRoleChange(member.id, event.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={!canRemove}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No members yet.</p>
                  ) : null}
                </div>
              )}

              {isOwner ? (
                <form className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" onSubmit={handleAddMember}>
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <UserPlus size={16} />
                    Invite member
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="email"
                      name="email"
                      value={memberForm.email}
                      onChange={handleMemberFormChange}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                      placeholder="member@example.com"
                    />
                    <select
                      name="role"
                      value={memberForm.role}
                      onChange={handleMemberFormChange}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button type="submit" disabled={memberSubmitting}>
                      {memberSubmitting ? 'Sending...' : 'Send Invite'}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only the project owner can invite or promote members.
                </p>
              )}
            </div>
          ) : null}

          {detailsTab === 'chat' ? (
            <div className="space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader size="lg" />
                </div>
              ) : (
                <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{message.name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700 dark:text-gray-200">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <Button onClick={handleSendMessage} disabled={messageSubmitting || !messageText.trim()}>
                  {messageSubmitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
