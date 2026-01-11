import pool from '../config/db.js';

// @desc    Get all tasks with filters
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, project, search } = req.query;
    
    let query = `
      SELECT t.*, 
             u1.name as assignee_name,
             u2.name as creator_name,
             p.name as project_name,
             (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    
    const params = [];

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

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
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
    const [tasks] = await pool.execute(
      `SELECT t.*, 
              u1.name as assignee_name,
              u2.name as creator_name,
              p.name as project_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: tasks[0]
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
      data: tasks[0]
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

    await pool.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, project_id = ?, assigned_to = ?, priority = ?, status = ?, deadline = ?, estimated_hours = ?
       WHERE id = ?`,
      [title, description, project_id, assigned_to, priority, status, deadline, estimated_hours, req.params.id]
    );

    // Get updated task
    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.id = ?`,
      [req.params.id]
    );

    // Create activity log
    await pool.execute(
      'INSERT INTO activity_logs (task_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, 'updated', `Task updated`]
    );

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: tasks[0]
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
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
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
    const completedAt = status === 'completed' ? new Date() : null;

    await pool.execute(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      [status, completedAt, req.params.id]
    );

    // Get updated task
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    // If task completed, calculate streak
    if (status === 'completed' && tasks[0].assigned_to) {
      // Import and call streak calculation
      // This will be handled by streakController
    }

    res.json({
      success: true,
      message: 'Task status updated',
      data: tasks[0]
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

