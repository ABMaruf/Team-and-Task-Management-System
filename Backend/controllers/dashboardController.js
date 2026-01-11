import pool from '../config/db.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStatistics = async (req, res) => {
  try {
    // Get task statistics
    const [taskStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks
       FROM tasks`
    );

    // Get user statistics
    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_users,
        AVG(current_streak) as avg_streak,
        AVG(productivity_score) as avg_productivity
       FROM users`
    );

    // Get project statistics
    const [projectStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects
       FROM projects`
    );

    res.json({
      success: true,
      data: {
        tasks: taskStats[0],
        users: userStats[0],
        projects: projectStats[0]
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// @desc    Get chart data
// @route   GET /api/dashboard/charts
// @access  Private
export const getChartData = async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    let days = 7;
    if (period === '30days') days = 30;
    if (period === '3months') days = 90;

    // Get daily task completion data
    const [completionData] = await pool.execute(
      `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completed,
        AVG(CASE WHEN priority = 'urgent' THEN 50
                 WHEN priority = 'high' THEN 30
                 WHEN priority = 'medium' THEN 20
                 ELSE 10 END) as avg_score
       FROM tasks
       WHERE status = 'completed' 
       AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [days]
    );

    // Get productivity trend
    const [productivityData] = await pool.execute(
      `SELECT 
        date,
        SUM(productivity_points) as total_points
       FROM streak_history
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY date
       ORDER BY date`,
      [days]
    );

    res.json({
      success: true,
      data: {
        completion: completionData,
        productivity: productivityData
      }
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/dashboard/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [users] = await pool.execute(
      `SELECT 
        id, name, profile_picture, 
        productivity_score, current_streak,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = users.id AND status = 'completed') as completed_tasks
       FROM users
       ORDER BY productivity_score DESC, current_streak DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
};

// @desc    Get personal analytics
// @route   GET /api/dashboard/my-analytics
// @access  Private
export const getMyAnalytics = async (req, res) => {
  try {
    // Get user's task statistics
    const [taskStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks
       FROM tasks
       WHERE assigned_to = ?`,
      [req.user.id]
    );

    // Get streak info
    const [streakInfo] = await pool.execute(
      'SELECT current_streak, longest_streak, productivity_score FROM users WHERE id = ?',
      [req.user.id]
    );

    // Get recent activity
    const [recentActivity] = await pool.execute(
      `SELECT 
        date, tasks_completed, productivity_points
       FROM streak_history
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 30`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        tasks: taskStats[0],
        streak: streakInfo[0],
        activity: recentActivity
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [activities] = await pool.execute(
      `SELECT 
        al.*, 
        u.name as user_name,
        u.profile_picture,
        t.title as task_title
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       JOIN tasks t ON al.task_id = t.id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity'
    });
  }
};