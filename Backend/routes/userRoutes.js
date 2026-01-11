import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserProfile,
  deleteUser,
  getUserStreak,
  getUserProductivity
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUserProfile);
router.delete('/:id', protect, admin, deleteUser);
router.get('/:id/streak', protect, getUserStreak);
router.get('/:id/productivity', protect, getUserProductivity);

export default router;
