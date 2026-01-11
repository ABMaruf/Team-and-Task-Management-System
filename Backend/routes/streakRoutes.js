import express from 'express';
import {
  getUserStreak,
  getStreakHistory,
  calculateStreak
} from '../controllers/streakController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/user/:userId', protect, getUserStreak);
router.get('/history/:userId', protect, getStreakHistory);
router.post('/calculate', protect, admin, calculateStreak);

export default router;