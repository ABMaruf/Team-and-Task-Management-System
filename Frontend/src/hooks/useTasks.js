import { useState, useEffect } from 'react';
import * as taskService from '../services/taskService';
import { toast } from 'react-toastify';

export const useTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(filters);
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully');
      return { success: true, data: newTask };
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
      return { success: false, error: err.message };
    }
  };

  // Update task
  const updateTask = async (taskId, taskData) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData);
      setTasks(prev => 
        prev.map(task => task.id === taskId ? updatedTask : task)
      );
      toast.success('Task updated successfully');
      return { success: true, data: updatedTask };
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      return { success: false, error: err.message };
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
      return { success: true };
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
      return { success: false, error: err.message };
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, status);
      setTasks(prev => 
        prev.map(task => task.id === taskId ? updatedTask : task)
      );
      toast.success('Task status updated');
      return { success: true, data: updatedTask };
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
      return { success: false, error: err.message };
    }
  };

  // Complete task
  const completeTask = async (taskId) => {
    return updateTaskStatus(taskId, 'completed');
  };

  useEffect(() => {
    fetchTasks();
  }, [JSON.stringify(filters)]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask
  };
};
