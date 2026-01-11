import express from 'express';
import {
  getStatistics,
  getChartData,
  getLeaderboard,
  getMyAnalytics,
  getRecentActivity
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getStatistics);
router.get('/charts', protect, getChartData);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/my-analytics', protect, getMyAnalytics);
router.get('/activity', protect, getRecentActivity);

export default router;