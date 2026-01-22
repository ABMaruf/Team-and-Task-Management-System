import pool from '../config/db.js';

export const getProjectRole = async (projectId, userId) => {
  if (!projectId || !userId) return null;
  const [rows] = await pool.execute(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows[0]?.role || null;
};

export const isProjectAdmin = (role) => role === 'owner' || role === 'admin';

export const getTaskAccess = async (taskId, userId) => {
  const [rows] = await pool.execute(
    `SELECT t.*, pm.role as member_role
     FROM tasks t
     LEFT JOIN project_members pm
       ON pm.project_id = t.project_id AND pm.user_id = ?
     WHERE t.id = ?`,
    [userId, taskId]
  );

  const task = rows[0];
  if (!task) return null;

  const isAssignee = task.assigned_to === userId;
  const isCreator = task.created_by === userId;
  const isMember = task.project_id ? !!task.member_role : (isAssignee || isCreator);
  const isAdmin = isProjectAdmin(task.member_role);
  const canEdit = task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator);
  const canUpdateStatus = task.project_id ? (isAdmin || isAssignee) : (isAssignee || isCreator);

  return {
    task,
    role: task.member_role,
    isMember,
    isAdmin,
    canEdit,
    canUpdateStatus
  };
};
