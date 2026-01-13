import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks
} from '../controllers/projectController.js';
import { protect, admin } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const projectValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status')
];

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, projectValidation, validate, createProject);
router.put('/:id', protect, admin, projectValidation, validate, updateProject);
router.delete('/:id', protect, admin, deleteProject);
router.get('/:id/tasks', protect, getProjectTasks);

export default router;
