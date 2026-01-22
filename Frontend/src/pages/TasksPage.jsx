import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  RefreshCcw,
  Tag,
  User,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  MessageCircle
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTasks } from '../hooks/useTasks';
import { useTheme } from '../context/ThemeContext';
import * as userService from '../services/userService';
import * as commentService from '../services/commentService';
import * as projectService from '../services/projectService';
import { useAuth } from '../hooks/useAuth';
import { getTimeAgo } from '../utils/helpers';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';

const columns = [
  { id: 'todo', title: 'To Do', accent: 'from-slate-200 to-slate-100' },
  { id: 'in_progress', title: 'In Progress', accent: 'from-blue-200 to-indigo-100' },
  { id: 'review', title: 'Review', accent: 'from-amber-200 to-orange-100' },
  { id: 'completed', title: 'Completed', accent: 'from-emerald-200 to-emerald-100' }
];

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' }
];

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const priorityBadge = {
  low: 'bg-emerald-100 text-emerald-600',
  medium: 'bg-amber-100 text-amber-600',
  high: 'bg-rose-100 text-rose-600'
};

const emptyTaskState = {
  title: '',
  description: '',
  projectId: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  assigneeId: ''
};

const formatInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  projects = [],
  initialData,
  loading,
  defaultProjectId,
  onProjectChange,
  canEditProject = true,
  canEditAssignee = true,
  canEditStatus = true
}) => {
  const [formState, setFormState] = useState(emptyTaskState);

  useEffect(() => {
    const projectId = initialData?.projectId ?? defaultProjectId ?? '';
    if (initialData) {
      setFormState({
        title: initialData.title || '',
        description: initialData.description || '',
        projectId,
        priority: initialData.priority || 'medium',
        status: initialData.status || 'todo',
        assigneeId: initialData.assigneeId || initialData.assignee?.id || '',
        dueDate: formatInputDate(initialData.dueDate)
      });
    } else {
      setFormState({ ...emptyTaskState, projectId });
    }
    onProjectChange?.(projectId);
  }, [defaultProjectId, initialData, isOpen, onProjectChange]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === 'projectId') {
      onProjectChange?.(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formState);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Task' : 'New Task'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Title</label>
            <input
              type="text"
              name="title"
              value={formState.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="Add a task title"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Project</label>
            <select
              name="projectId"
              value={formState.projectId}
              onChange={handleChange}
              disabled={!canEditProject}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            >
              <option value="">Personal</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
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
            placeholder="Add context or acceptance criteria"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Assignee</label>
            <select
              name="assigneeId"
              value={formState.assigneeId}
              onChange={handleChange}
              disabled={!canEditAssignee}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Priority</label>
            <select
              name="priority"
              value={formState.priority}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
            <select
              name="status"
              value={formState.status}
              onChange={handleChange}
              disabled={!canEditStatus}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">Due date</label>
          <input
            type="date"
            name="dueDate"
            value={formState.dueDate}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark] date-input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const TaskCard = ({
  task,
  darkMode,
  onEdit,
  onDelete,
  onStatusChange,
  onComments,
  canEdit,
  canDelete
}) => (
  <div
    className={`rounded-2xl border p-4 transition-all hover:-translate-y-1 hover:shadow-lg ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{task.title}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.description || 'No description'}</p>
        {task.project?.name ? (
          <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Project: {task.project.name}
          </p>
        ) : null}
      </div>
      <span
        className={`text-xs px-3 py-1 rounded-full font-medium ${
          priorityBadge[task.priority] || priorityBadge.medium
        }`}
      >
        {task.priority.toUpperCase()}
      </span>
    </div>

    <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-xs ${
      darkMode ? 'text-gray-400' : 'text-gray-500'
    }`}>
      <div className="flex items-center gap-2">
        <Calendar size={14} />
        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span>
      </div>
      <div className="flex items-center gap-2">
        <User size={14} />
        <span>{task.assignee?.name || 'Unassigned'}</span>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <select
        value={task.status}
        onChange={(event) => onStatusChange(task.id, event.target.value)}
        disabled={!task.canUpdateStatus}
        className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          icon={<Pencil size={14} />}
          onClick={() => onEdit(task)}
          disabled={!canEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 size={14} />}
          onClick={() => onDelete(task)}
          disabled={!canDelete}
        >
          Delete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<MessageCircle size={14} />}
          onClick={() => onComments(task)}
        >
          Comments
        </Button>
      </div>
    </div>
  </div>
);

const TasksPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [filterProjectMembers, setFilterProjectMembers] = useState([]);
  const [modalProjectMembers, setModalProjectMembers] = useState([]);
  const [modalProjectId, setModalProjectId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    project: '',
    search: ''
  });
  const [commentsTask, setCommentsTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus
  } = useTasks(filters);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await userService.getUsers();
        setAllUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Unable to load users', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const data = await projectService.getProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Unable to load projects', error);
      } finally {
        setProjectsLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingTask(null);
      setIsModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const loadFilterMembers = async () => {
      if (!filters.project) {
        setFilterProjectMembers([]);
        return;
      }
      try {
        const data = await projectService.getProjectMembers(filters.project);
        setFilterProjectMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Unable to load project members', error);
      }
    };
    loadFilterMembers();
  }, [filters.project]);

  useEffect(() => {
    const loadModalMembers = async () => {
      if (!modalProjectId) {
        setModalProjectMembers([]);
        return;
      }
      try {
        const data = await projectService.getProjectMembers(modalProjectId);
        setModalProjectMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Unable to load project members', error);
      }
    };
    loadModalMembers();
  }, [modalProjectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    }, {});
  }, [tasks]);

  const selectedProject = useMemo(() => {
    if (!filters.project) return null;
    return projects.find((project) => String(project.id) === String(filters.project)) || null;
  }, [filters.project, projects]);

  const selectedProjectIsAdmin = ['owner', 'admin'].includes(selectedProject?.my_role);
  const disableNewTask = Boolean(filters.project) && !selectedProjectIsAdmin;

  const assigneeOptions = filters.project ? filterProjectMembers : allUsers;
  const modalAssignees = modalProjectId ? modalProjectMembers : allUsers;
  const editingIsProjectAdmin = editingTask?.projectId
    ? ['owner', 'admin'].includes(editingTask.memberRole)
    : true;
  const canEditProject = editingTask ? editingIsProjectAdmin : true;
  const canEditAssignee = editingTask ? editingIsProjectAdmin : true;
  const canEditStatus = editingTask ? editingTask.canUpdateStatus : true;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'project') {
        next.assignee = '';
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      status: '',
      assignee: '',
      project: '',
      search: ''
    });
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setModalProjectId(filters.project || '');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalProjectId(task.projectId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const canDeleteTask = useCallback(
    (task) => {
      if (!task) return false;
      if (task.projectId) {
        return ['owner', 'admin'].includes(task.memberRole);
      }
      return task.assigneeId === user?.id || task.createdBy === user?.id;
    },
    [user?.id]
  );

  const handleModalSubmit = async (formState) => {
    if (!editingTask && formState.projectId) {
      const targetProject = projects.find((project) => String(project.id) === String(formState.projectId));
      const isAdminForCreate = ['owner', 'admin'].includes(targetProject?.my_role);
      if (!isAdminForCreate) {
        toast.error('Only project admins can create tasks in this project');
        return;
      }
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      projectId: formState.projectId || null,
      priority: formState.priority,
      status: formState.status,
      assigneeId: formState.assigneeId || undefined,
      dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : null
    };

    try {
      setModalLoading(true);
      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save task', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!canDeleteTask(task)) {
      toast.error('You do not have permission to delete this task');
      return;
    }
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
  };

  const handleStatusChange = async (taskId, status) => {
    const task = tasks.find((item) => String(item.id) === String(taskId));
    if (task && !task.canUpdateStatus) {
      toast.error('You do not have permission to move this task');
      return;
    }
    await updateTaskStatus(taskId, status);
  };

  const openCommentsModal = async (task) => {
    setCommentsTask(task);
    setComments([]);
    setNewComment('');
    setCommentsLoading(true);
    try {
      const data = await commentService.getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeCommentsModal = () => {
    setCommentsTask(null);
    setComments([]);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!commentsTask || !newComment.trim()) return;
    try {
      setCommentSubmitting(true);
      const created = await commentService.addComment(commentsTask.id, {
        comment: newComment.trim(),
        authorId: user?.id
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  };

  const handleDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }
      const task = tasks.find((item) => String(item.id) === String(draggableId));
      if (task && !task.canUpdateStatus) {
        toast.error('You do not have permission to move this task');
        return;
      }
      if (destination.droppableId !== source.droppableId) {
        await updateTaskStatus(draggableId, destination.droppableId);
      }
    },
    [tasks, updateTaskStatus]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`pt-20 pb-10 transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'md:pl-20'} px-4`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plan, assign and track work</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={fetchTasks}
                icon={<RefreshCcw size={16} />}
                className="border-gray-200"
              >
                Refresh
              </Button>
              <Button icon={<Plus size={18} />} onClick={openCreateModal} disabled={disableNewTask}>
                New Task
              </Button>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="bg-transparent outline-none text-gray-900 placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                  placeholder="Search tasks"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  name="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  disabled={projectsLoading}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                >
                  <option value="">All projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                >
                  <option value="">All priorities</option>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  name="assignee"
                  value={filters.assignee}
                  onChange={handleFilterChange}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                >
                  <option value="">All assignees</option>
                  {assigneeOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" icon={<Filter size={16} />} onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size="lg" />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {columns.map((column) => (
                  <div key={column.id} className="space-y-4">
                    <div
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 bg-gradient-to-r ${column.accent}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{column.title}</p>
                        <p className="text-xs text-gray-500">{groupedTasks[column.id]?.length || 0} tasks</p>
                      </div>
                      <Tag size={16} className="text-gray-500" />
                    </div>
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-3 rounded-2xl border-2 border-dashed p-3 ${
                            snapshot.isDraggingOver
                              ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-500/10'
                              : 'border-transparent'
                          }`}
                        >
                          {groupedTasks[column.id]?.map((task, index) => (
                            <Draggable
                              draggableId={String(task.id)}
                              index={index}
                              key={task.id}
                              isDragDisabled={!task.canUpdateStatus}
                            >
                              {(dragProvided) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    darkMode={darkMode}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteTask}
                                    onStatusChange={handleStatusChange}
                                    onComments={openCommentsModal}
                                    canEdit={task.canEdit}
                                    canDelete={canDeleteTask(task)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {(groupedTasks[column.id]?.length || 0) === 0 && (
                            <div
                              className={`rounded-2xl border-2 border-dashed p-6 text-center text-sm ${
                                darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
                              }`}
                            >
                              No tasks yet
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </main>

      <Modal
        isOpen={!!commentsTask}
        onClose={closeCommentsModal}
        title={commentsTask ? `Comments - ${commentsTask.title}` : 'Comments'}
        size="md"
      >
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-2xl border p-3 text-sm ${
                      darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{comment.author?.name || 'Unknown user'}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(new Date(comment.created_at))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{comment.body}</p>
                    <div className="mt-2 text-right">
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div>
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                rows={3}
                placeholder="Share an update..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={handleAddComment} disabled={commentSubmitting || !newComment.trim()}>
                  {commentSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        members={modalAssignees}
        projects={projects}
        initialData={editingTask}
        loading={modalLoading}
        defaultProjectId={modalProjectId}
        onProjectChange={setModalProjectId}
        canEditProject={canEditProject}
        canEditAssignee={canEditAssignee}
        canEditStatus={canEditStatus}
      />
    </div>
  );
};

export default TasksPage;
