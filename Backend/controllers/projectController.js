import crypto from 'crypto';
import pool from '../config/db.js';
import { getProjectRole, isProjectAdmin } from '../utils/projectAccess.js';
import { isAllowedEmailDomain } from '../utils/emailValidation.js';
import { sendProjectInviteEmail } from '../utils/emailService.js';
import { getClientUrls } from '../utils/clientUrls.js';

const ensureProjectMember = async (projectId, userId) => {
  const role = await getProjectRole(projectId, userId);
  return role;
};

const ensureProjectOwner = async (projectId, userId) => {
  const role = await getProjectRole(projectId, userId);
  return role === 'owner' ? role : null;
};

const createInviteToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const [projects] = await pool.execute(
      `SELECT p.*, 
              u.name as creator_name,
              pm.role as my_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
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
    const role = await ensureProjectMember(req.params.id, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project'
      });
    }

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

    await pool.execute(
      'INSERT INTO project_members (project_id, user_id, role, added_by) VALUES (?, ?, ?, ?)',
      [result.insertId, req.user.id, 'owner', req.user.id]
    );

    const [projects] = await pool.execute(
      'SELECT *, ? as my_role FROM projects WHERE id = ?',
      ['owner', result.insertId]
    );

    const [projectData] = await pool.execute(
      `SELECT p.*, u.name as creator_name, ? as my_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      ['owner', result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: projectData[0]
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
// @access  Private (Owner)
export const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const role = await ensureProjectMember(req.params.id, req.user.id);
    if (!isProjectAdmin(role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

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

    const [projects] = await pool.execute(
      `SELECT p.*, u.name as creator_name, ? as my_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [role, req.params.id]
    );

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
// @access  Private (Owner)
export const deleteProject = async (req, res) => {
  try {
    const role = await ensureProjectOwner(req.params.id, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

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

// @desc    Get project members
// @route   GET /api/projects/:id/members
// @access  Private
export const getProjectMembers = async (req, res) => {
  try {
    const role = await ensureProjectMember(req.params.id, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view members'
      });
    }

    const [members] = await pool.execute(
      `SELECT pm.user_id as id, pm.role, pm.created_at, u.name, u.email, u.profile_picture
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY pm.role = 'owner' DESC, pm.role = 'admin' DESC, u.name ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members'
    });
  }
};

// @desc    Add project member
// @route   POST /api/projects/:id/members
// @access  Private (Owner)
export const addProjectMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const projectId = req.params.id;

    const ownerRole = await ensureProjectOwner(projectId, req.user.id);
    if (!ownerRole) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can add members'
      });
    }

    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isAllowedEmailDomain(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Member email must be Gmail, Hotmail, Outlook, or Yahoo'
      });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be admin or member'
      });
    }

    if (role === 'admin') {
      const [admins] = await pool.execute(
        "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'",
        [projectId]
      );
      if ((admins[0]?.count || 0) >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 2 admins allowed'
        });
      }
    }

    const [users] = await pool.execute('SELECT id, name, email FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const [existing] = await pool.execute(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    await pool.execute(
      'INSERT INTO project_members (project_id, user_id, role, added_by) VALUES (?, ?, ?, ?)',
      [projectId, user.id, role, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
};

// @desc    Update project member role
// @route   PATCH /api/projects/:id/members/:userId
// @access  Private (Owner)
export const updateProjectMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const projectId = req.params.id;
    const targetUserId = parseInt(req.params.userId, 10);

    const ownerRole = await ensureProjectOwner(projectId, req.user.id);
    if (!ownerRole) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can edit member roles'
      });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be admin or member'
      });
    }

    const [members] = await pool.execute(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );
    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (members[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Owner role cannot be changed'
      });
    }

    if (role === 'admin') {
      const [admins] = await pool.execute(
        "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'",
        [projectId]
      );
      if ((admins[0]?.count || 0) >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 2 admins allowed'
        });
      }
    }

    await pool.execute(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: { userId: targetUserId, role }
    });
  } catch (error) {
    console.error('Update project member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member'
    });
  }
};

// @desc    Remove project member
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner/Admin)
export const removeProjectMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const targetUserId = parseInt(req.params.userId, 10);

    const ownerRole = await ensureProjectOwner(projectId, req.user.id);
    if (!ownerRole) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can remove members'
      });
    }

    const [members] = await pool.execute(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );
    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (members[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot be removed'
      });
    }

    await pool.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};

// @desc    Get project chat messages
// @route   GET /api/projects/:id/messages
// @access  Private
export const getProjectMessages = async (req, res) => {
  try {
    const role = await ensureProjectMember(req.params.id, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages'
      });
    }

    const [messages] = await pool.execute(
      `SELECT m.id, m.message, m.created_at, u.id as user_id, u.name, u.profile_picture
       FROM project_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.project_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get project messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// @desc    Add project chat message
// @route   POST /api/projects/:id/messages
// @access  Private
export const addProjectMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const projectId = req.params.id;

    const role = await ensureProjectMember(projectId, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO project_messages (project_id, user_id, message) VALUES (?, ?, ?)',
      [projectId, req.user.id, message.trim()]
    );

    const [messages] = await pool.execute(
      `SELECT m.id, m.message, m.created_at, u.id as user_id, u.name, u.profile_picture
       FROM project_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: messages[0]
    });
  } catch (error) {
    console.error('Add project message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};
// @desc    Get project tasks
// @route   GET /api/projects/:id/tasks
// @access  Private
export const getProjectTasks = async (req, res) => {
  try {
    const role = await ensureProjectMember(req.params.id, req.user.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tasks'
      });
    }

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

// @desc    Create project invite
// @route   POST /api/projects/:id/invites
// @access  Private (Owner)
export const createProjectInvite = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const projectId = req.params.id;

    const ownerRole = await ensureProjectOwner(projectId, req.user.id);
    if (!ownerRole) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can invite members'
      });
    }

    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isAllowedEmailDomain(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invite email must be Gmail, Hotmail, Outlook, or Yahoo'
      });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be admin or member'
      });
    }

    const [projects] = await pool.execute('SELECT name FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (role === 'admin') {
      const [admins] = await pool.execute(
        "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'",
        [projectId]
      );
      const [pendingAdmins] = await pool.execute(
        "SELECT COUNT(*) as count FROM project_invites WHERE project_id = ? AND role = 'admin' AND accepted_at IS NULL AND expires_at > NOW()",
        [projectId]
      );
      const adminCount = (admins[0]?.count || 0) + (pendingAdmins[0]?.count || 0);
      if (adminCount >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 2 admins allowed'
        });
      }
    }

    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length > 0) {
      const [memberRows] = await pool.execute(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, users[0].id]
      );
      if (memberRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member'
        });
      }
    }

    await pool.execute(
      'DELETE FROM project_invites WHERE project_id = ? AND email = ? AND accepted_at IS NULL',
      [projectId, normalizedEmail]
    );

    const { token, tokenHash, expiresAt } = createInviteToken();
    await pool.execute(
      'INSERT INTO project_invites (project_id, email, role, token_hash, expires_at, invited_by) VALUES (?, ?, ?, ?, ?, ?)',
      [projectId, normalizedEmail, role, tokenHash, expiresAt, req.user.id]
    );

    const inviteLinks = getClientUrls(`/invites/accept?token=${token}`);
    await sendProjectInviteEmail(
      normalizedEmail,
      projects[0].name,
      req.user.name,
      inviteLinks,
      role
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent'
    });
  } catch (error) {
    console.error('Create project invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invite'
    });
  }
};

// @desc    Get invite info
// @route   GET /api/projects/invites/info
// @access  Public
export const getProjectInviteInfo = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invite token is required'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [invites] = await pool.execute(
      `SELECT i.id, i.email, i.role, i.expires_at, p.name as project_name
       FROM project_invites i
       JOIN projects p ON p.id = i.project_id
       WHERE i.token_hash = ? AND i.accepted_at IS NULL AND i.expires_at > NOW()`,
      [tokenHash]
    );

    if (invites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invite is invalid or expired'
      });
    }

    res.json({
      success: true,
      data: invites[0]
    });
  } catch (error) {
    console.error('Get invite info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invite info'
    });
  }
};

// @desc    Accept project invite
// @route   POST /api/projects/invites/accept
// @access  Private
export const acceptProjectInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      console.warn('Accept invite failed: missing token', { userId: req.user?.id });
      return res.status(400).json({
        success: false,
        message: 'Invite token is required'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [invites] = await pool.execute(
      `SELECT i.id, i.project_id, i.email, i.role, p.name as project_name
       FROM project_invites i
       JOIN projects p ON p.id = i.project_id
       WHERE i.token_hash = ? AND i.accepted_at IS NULL AND i.expires_at > NOW()`,
      [tokenHash]
    );

    if (invites.length === 0) {
      console.warn('Accept invite failed: invalid or expired token', { userId: req.user?.id });
      return res.status(400).json({
        success: false,
        message: 'Invite is invalid or expired'
      });
    }

    const invite = invites[0];
    if (req.user.email.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
      console.warn('Accept invite failed: email mismatch', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        inviteEmail: invite.email
      });
      return res.status(403).json({
        success: false,
        message: 'This invite was sent to a different email'
      });
    }

    if (invite.role === 'admin') {
      const [admins] = await pool.execute(
        "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'",
        [invite.project_id]
      );
      if ((admins[0]?.count || 0) >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 2 admins allowed'
        });
      }
    }

    const [memberRows] = await pool.execute(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [invite.project_id, req.user.id]
    );

    if (memberRows.length === 0) {
      await pool.execute(
        'INSERT INTO project_members (project_id, user_id, role, added_by) VALUES (?, ?, ?, ?)',
        [invite.project_id, req.user.id, invite.role, req.user.id]
      );
    }

    await pool.execute(
      'UPDATE project_invites SET accepted_at = NOW() WHERE id = ?',
      [invite.id]
    );

    console.info('Invite accepted', {
      inviteId: invite.id,
      projectId: invite.project_id,
      userId: req.user.id,
      role: invite.role
    });

    res.json({
      success: true,
      message: 'Invite accepted',
      data: {
        project_id: invite.project_id,
        project_name: invite.project_name,
        role: invite.role
      }
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invite'
    });
  }
};
