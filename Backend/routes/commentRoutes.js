import express from 'express';
import {
  getTaskComments,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const commentValidation = [
  body('comment').trim().notEmpty().withMessage('Comment cannot be empty')
];

router.get('/task/:taskId', protect, getTaskComments);
router.post('/task/:taskId', protect, commentValidation, validate, addComment);
router.put('/:id', protect, commentValidation, validate, updateComment);
router.delete('/:id', protect, deleteComment);

export default router;
