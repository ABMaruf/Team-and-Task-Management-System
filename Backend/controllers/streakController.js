import pool from '../config/db.js';
import { calculateUserStreak } from '../utils/streakCalculator.js';

// @desc    Get user streak data
// @route   GET /api/streaks/user/:userId
// @access  Private
export const getUserStreak = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT current_streak, longest_streak, last_task_date, productivity_score FROM users WHERE id = ?',
      [req.params.userId]
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

// @desc    Get streak history
// @route   GET /api/streaks/history/:userId
// @access  Private
export const getStreakHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [history] = await pool.execute(
      `SELECT date, tasks_completed, productivity_points
       FROM streak_history
       WHERE user_id = ?
       AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY date DESC`,
      [req.params.userId, parseInt(days)]
    );

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get streak history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching streak history'
    });
  }
};

// @desc    Calculate streak (manual trigger or cron job)
// @route   POST /api/streaks/calculate
// @access  Private/Admin
export const calculateStreak = async (req, res) => {
  try {
    // Get all users
    const [users] = await pool.execute('SELECT id FROM users');

    const results = [];
    for (const user of users) {
      const streakData = await calculateUserStreak(user.id);
      results.push({ userId: user.id, ...streakData });
    }

    res.json({
      success: true,
      message: 'Streak calculation completed',
      data: results
    });
  } catch (error) {
    console.error('Calculate streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating streaks'
    });
  }
};
