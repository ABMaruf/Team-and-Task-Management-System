import pool from '../config/db.js';
import { calculateUserStreak } from '../utils/streakCalculator.js';
import { getProjectRole, getTaskAccess, isProjectAdmin } from '../utils/projectAccess.js';

// @desc    Get all tasks with filters
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, project, search } = req.query;
    const userId = req.user.id;
    
    let query = `
      SELECT t.*, 
             u1.name as assignee_name,
             u2.name as creator_name,
             p.name as project_name,
             pm.role as member_role,
             (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      WHERE 1=1
      AND (
        (t.project_id IS NOT NULL AND pm.user_id IS NOT NULL)
        OR (t.project_id IS NULL AND (t.assigned_to = ? OR t.created_by = ?))
      )
    `;
    
    const params = [userId, userId, userId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assignee) {
      query += ' AND t.assigned_to = ?';
      params.push(assignee);
    }

    if (project) {
      query += ' AND t.project_id = ?';
      params.push(project);
    }

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute(query, params);
    const tasksWithAccess = tasks.map((task) => {
      const isAssignee = task.assigned_to === userId;
      const isCreator = task.created_by === userId;
      const isAdmin = isProjectAdmin(task.member_role);
      const canUpdateStatus = task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator);
      const canEdit = task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator);
      return {
        ...task,
        can_edit: canEdit,
        can_update_status: canUpdateStatus
      };
    });

    res.json({
      success: true,
      count: tasksWithAccess.length,
      data: tasksWithAccess
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const userId = req.user.id;
    const [tasks] = await pool.execute(
      `SELECT t.*, 
              u1.name as assignee_name,
              u2.name as creator_name,
              p.name as project_name,
              pm.role as member_role
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
       WHERE t.id = ?`,
      [userId, req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = tasks[0];
    const isAssignee = task.assigned_to === userId;
    const isCreator = task.created_by === userId;
    const isMember = task.project_id ? !!task.member_role : (isAssignee || isCreator);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    const isAdmin = isProjectAdmin(task.member_role);
    res.json({
      success: true,
      data: {
        ...task,
        can_edit: task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator),
        can_update_status: task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator)
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, status, deadline, estimated_hours } = req.body;
    const userId = req.user.id;

    if (project_id) {
      const role = await getProjectRole(project_id, userId);
      if (!isProjectAdmin(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only project admins can create tasks'
        });
      }

      if (assigned_to) {
        const [memberRows] = await pool.execute(
          'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
          [project_id, assigned_to]
        );
        if (memberRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Assignee must be a project member'
          });
        }
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, status, deadline, estimated_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, project_id || null, assigned_to || null, req.user.id, priority || 'medium', status || 'todo', deadline || null, estimated_hours || null]
    );

    // Get created task
    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.id = ?`,
      [result.insertId]
    );
    const access = await getTaskAccess(result.insertId, req.user.id);

    // Create activity log
    await pool.execute(
      'INSERT INTO activity_logs (task_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [result.insertId, req.user.id, 'created', `Task created: ${title}`]
    );

    // Send notification if assigned to someone
    if (assigned_to) {
      await pool.execute(
        'INSERT INTO notifications (user_id, task_id, type, message) VALUES (?, ?, ?, ?)',
        [assigned_to, result.insertId, 'task_assigned', `You have been assigned to: ${title}`]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        ...tasks[0],
        can_edit: access?.canEdit ?? false,
        can_update_status: access?.canUpdateStatus ?? false,
        member_role: access?.role ?? null
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, status, deadline, estimated_hours } = req.body;

    // Check if task exists
    const [existingTasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    
    if (existingTasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const existingTask = existingTasks[0];
    const nextTitle = title ?? existingTask.title;
    const nextDescription = description ?? existingTask.description ?? null;
    const nextProjectId = project_id ?? existingTask.project_id ?? null;
    const nextAssignedTo = assigned_to ?? existingTask.assigned_to ?? null;
    const nextPriority = priority ?? existingTask.priority ?? 'medium';
    const nextStatus = status ?? existingTask.status ?? 'todo';
    const nextDeadline = deadline ?? existingTask.deadline ?? null;
    const nextEstimatedHours = estimated_hours ?? existingTask.estimated_hours ?? null;

    const access = await getTaskAccess(req.params.id, req.user.id);
    if (!access?.canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const isAdmin = access.isAdmin;
    const updatedProjectId = isAdmin ? nextProjectId : access.task.project_id;
    const updatedAssignedTo = isAdmin ? nextAssignedTo : access.task.assigned_to;

    if (updatedProjectId && updatedAssignedTo) {
      const [memberRows] = await pool.execute(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [updatedProjectId, updatedAssignedTo]
      );
      if (memberRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member'
        });
      }
    }

    await pool.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, project_id = ?, assigned_to = ?, priority = ?, status = ?, deadline = ?, estimated_hours = ?
       WHERE id = ?`,
      [
        nextTitle,
        nextDescription,
        updatedProjectId,
        updatedAssignedTo,
        nextPriority,
        nextStatus,
        nextDeadline,
        nextEstimatedHours,
        req.params.id
      ]
    );

    // Get updated task
    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.id = ?`,
      [req.params.id]
    );
    const updatedAccess = await getTaskAccess(req.params.id, req.user.id);

    // Create activity log
    await pool.execute(
      'INSERT INTO activity_logs (task_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, 'updated', `Task updated`]
    );

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        ...tasks[0],
        can_edit: updatedAccess?.canEdit ?? false,
        can_update_status: updatedAccess?.canUpdateStatus ?? false,
        member_role: updatedAccess?.role ?? null
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const access = await getTaskAccess(req.params.id, req.user.id);
    
    if (!access?.task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!access.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const access = await getTaskAccess(req.params.id, req.user.id);
    if (!access?.task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!access.canUpdateStatus) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update status'
      });
    }

    if (status === 'completed') {
      await pool.execute(
        'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
        [status, new Date(), req.params.id]
      );
    } else {
      await pool.execute(
        'UPDATE tasks SET status = ? WHERE id = ?',
        [status, req.params.id]
      );
    }

    // Get updated task
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    // If task completed, calculate streak
    if (status === 'completed') {
      const streakUserId = tasks[0]?.assigned_to ?? tasks[0]?.created_by ?? req.user?.id;
      if (streakUserId) {
        try {
          await calculateUserStreak(streakUserId);
        } catch (error) {
          console.error('Streak calculation failed after task completion:', error);
        }
      }
    }

    const updatedAccess = await getTaskAccess(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Task status updated',
      data: {
        ...tasks[0],
        can_edit: updatedAccess?.canEdit ?? false,
        can_update_status: updatedAccess?.canUpdateStatus ?? false,
        member_role: updatedAccess?.role ?? null
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status'
    });
  }
};

// @desc    Get user's tasks
// @route   GET /api/tasks/my-tasks
// @access  Private
export const getMyTasks = async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, 
              p.name as project_name,
              (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

