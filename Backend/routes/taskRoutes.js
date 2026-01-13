import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getMyTasks
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'completed']).withMessage('Invalid status')
];

router.get('/', protect, getTasks);
router.get('/my-tasks', protect, getMyTasks);
router.get('/:id', protect, getTaskById);
router.post('/', protect, taskValidation, validate, createTask);
router.put('/:id', protect, taskValidation, validate, updateTask);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/status', protect, updateTaskStatus);

export default router;
