import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  getProjectMessages,
  addProjectMessage,
  createProjectInvite,
  getProjectInviteInfo,
  acceptProjectInvite
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const projectValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status')
];

router.get('/invites/info', getProjectInviteInfo);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, projectValidation, validate, createProject);
router.put('/:id', protect, projectValidation, validate, updateProject);
router.delete('/:id', protect, deleteProject);
router.get('/:id/tasks', protect, getProjectTasks);
router.get('/:id/members', protect, getProjectMembers);
router.post('/:id/members', protect, addProjectMember);
router.patch('/:id/members/:userId', protect, updateProjectMemberRole);
router.delete('/:id/members/:userId', protect, removeProjectMember);
router.get('/:id/messages', protect, getProjectMessages);
router.post('/:id/messages', protect, addProjectMessage);
router.post('/:id/invites', protect, createProjectInvite);
router.post('/invites/accept', protect, acceptProjectInvite);

export default router;
