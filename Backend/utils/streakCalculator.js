import pool from '../config/db.js';

// Calculate productivity points based on task priority
const calculateProductivityPoints = (priority) => {
  const points = {
    'low': 10,
    'medium': 20,
    'high': 30,
    'urgent': 50
  };
  return points[priority] || 10;
};

// Calculate user's streak
export const calculateUserStreak = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get tasks completed today
    const [tasksToday] = await pool.execute(
      `SELECT COUNT(*) as count, SUM(CASE 
        WHEN priority = 'urgent' THEN 50
        WHEN priority = 'high' THEN 30
        WHEN priority = 'medium' THEN 20
        ELSE 10
      END) as points
      FROM tasks
      WHERE (assigned_to = ? OR (assigned_to IS NULL AND created_by = ?))
      AND status = 'completed' 
      AND DATE(completed_at) = ?`,
      [userId, userId, today]
    );

    const tasksCompletedToday = tasksToday[0].count || 0;
    const productivityPoints = tasksToday[0].points || 0;

    // Get user's current streak info
    const [users] = await pool.execute(
      'SELECT current_streak, longest_streak, last_task_date FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    let newStreak = user.current_streak || 0;
    let newLongestStreak = user.longest_streak || 0;

    if (tasksCompletedToday > 0) {
      const lastTaskDate = user.last_task_date;
      
      if (!lastTaskDate) {
        // First task ever
        newStreak = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastTaskDate === yesterdayStr) {
          // Continuing streak
          newStreak = user.current_streak + 1;
        } else if (lastTaskDate === today) {
          // Already counted today
          newStreak = user.current_streak;
        } else {
          // Streak broken, start new
          newStreak = 1;
        }
      }

      // Update longest streak if necessary
      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak;
      }

      // Update user's streak
      const [existingHistory] = await pool.execute(
        `SELECT tasks_completed, productivity_points
         FROM streak_history
         WHERE user_id = ? AND date = ?`,
        [userId, today]
      );
      const previousPoints = existingHistory[0]?.productivity_points ?? 0;
      const deltaPoints = productivityPoints - previousPoints;

      await pool.execute(
        `UPDATE users 
         SET current_streak = ?, 
             longest_streak = ?, 
             last_task_date = ?,
             productivity_score = productivity_score + ?
         WHERE id = ?`,
        [newStreak, newLongestStreak, today, deltaPoints, userId]
      );

      // Save to streak history
      await pool.execute(
        `INSERT INTO streak_history (user_id, date, tasks_completed, productivity_points)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         tasks_completed = VALUES(tasks_completed),
         productivity_points = VALUES(productivity_points)`,
        [userId, today, tasksCompletedToday, productivityPoints]
      );
    }

    return {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      tasksCompletedToday,
      productivityPoints
    };
  } catch (error) {
    console.error('Calculate streak error:', error);
    throw error;
  }
};

// Check and reset streaks for users who missed a day
export const checkAndResetStreaks = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find users who didn't complete tasks yesterday and have active streaks
    const [users] = await pool.execute(
      `SELECT id, current_streak 
       FROM users 
       WHERE current_streak > 0 
       AND last_task_date < ?`,
      [yesterdayStr]
    );

    for (const user of users) {
      // Reset streak
      await pool.execute(
        'UPDATE users SET current_streak = 0 WHERE id = ?',
        [user.id]
      );

      console.log(`Reset streak for user ${user.id}`);
    }

    return { resetCount: users.length };
  } catch (error) {
    console.error('Reset streaks error:', error);
    throw error;
  }
};
