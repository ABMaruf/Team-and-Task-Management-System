import pool from '../config/db.js';
import { getTaskAccess } from '../utils/projectAccess.js';

// @desc    Get task comments
// @route   GET /api/comments/task/:taskId
// @access  Private
export const getTaskComments = async (req, res) => {
  try {
    const access = await getTaskAccess(req.params.taskId, req.user.id);
    if (!access?.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view comments'
      });
    }

    const [comments] = await pool.execute(
      `SELECT c.*, u.name as user_name, u.profile_picture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.taskId]
    );

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/comments/task/:taskId
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const taskId = req.params.taskId;

    const access = await getTaskAccess(taskId, req.user.id);
    if (!access?.task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!access.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this task'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (task_id, user_id, comment) VALUES (?, ?, ?)',
      [taskId, req.user.id, comment]
    );

    // Get created comment
    const [comments] = await pool.execute(
      `SELECT c.*, u.name as user_name, u.profile_picture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    // Create activity log
    await pool.execute(
      'INSERT INTO activity_logs (task_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [taskId, req.user.id, 'commented', `Added a comment`]
    );

    // Notify task owner/assignee
    const task = access.task;
    if (task.assigned_to && task.assigned_to !== req.user.id) {
      await pool.execute(
        'INSERT INTO notifications (user_id, task_id, type, message) VALUES (?, ?, ?, ?)',
        [task.assigned_to, taskId, 'new_comment', `${req.user.name} commented on: ${task.title}`]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comments[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const { comment } = req.body;

    // Check if comment exists and belongs to user
    const [comments] = await pool.execute(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or unauthorized'
      });
    }

    const access = await getTaskAccess(comments[0].task_id, req.user.id);
    if (!access?.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    await pool.execute(
      'UPDATE comments SET comment = ? WHERE id = ?',
      [comment, req.params.id]
    );

    const [updatedComments] = await pool.execute(
      `SELECT c.*, u.name as user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComments[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    // Check if comment exists and belongs to user or user is admin
    const [comments] = await pool.execute(
      'SELECT * FROM comments WHERE id = ?',
      [req.params.id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const access = await getTaskAccess(comments[0].task_id, req.user.id);
    if (!access?.isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    if (comments[0].user_id !== req.user.id && !access.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await pool.execute('DELETE FROM comments WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};
