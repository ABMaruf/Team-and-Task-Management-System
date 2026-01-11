import pool from '../config/db.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT p.*, 
              u.name as creator_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(DISTINCT assigned_to) FROM tasks WHERE project_id = p.id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT p.*, u.name as creator_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: projects[0]
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO projects (name, description, created_by, status) VALUES (?, ?, ?, ?)',
      [name, description || null, req.user.id, status || 'active']
    );

    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: projects[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const [existingProjects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    
    if (existingProjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await pool.execute(
      'UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, req.params.id]
    );

    const [projects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: projects[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = async (req, res) => {
  try {
    const [projects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await pool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

// @desc    Get project tasks
// @route   GET /api/projects/:id/tasks
// @access  Private
export const getProjectTasks = async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, u.name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project tasks'
    });
  }
};
