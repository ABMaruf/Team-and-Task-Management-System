import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, profile_picture, current_streak, longest_streak, productivity_score, created_at FROM users'
    );

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, profile_picture, current_streak, longest_streak, productivity_score, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    let updateQuery = 'UPDATE users SET name = ?, email = ?';
    let params = [name, email];

    // If password is being updated
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await pool.execute(updateQuery, params);

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, name, email, role, profile_picture, current_streak, longest_streak, productivity_score FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// @desc    Get user streak info
// @route   GET /api/users/:id/streak
// @access  Private
export const getUserStreak = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT current_streak, longest_streak, last_task_date, productivity_score FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching streak data'
    });
  }
};

// @desc    Get user productivity stats
// @route   GET /api/users/:id/productivity
// @access  Private
export const getUserProductivity = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        AVG(CASE WHEN status = 'completed' AND estimated_hours IS NOT NULL 
            THEN actual_hours / estimated_hours ELSE NULL END) as avg_efficiency
       FROM tasks 
       WHERE assigned_to = ?`,
      [req.params.id]
    );

    const [user] = await pool.execute(
      'SELECT productivity_score, current_streak FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        productivity_score: user[0].productivity_score,
        current_streak: user[0].current_streak
      }
    });
  } catch (error) {
    console.error('Get productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching productivity stats'
    });
  }
};