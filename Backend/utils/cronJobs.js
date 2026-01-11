import cron from 'node-cron';
import { checkAndResetStreaks } from './streakCalculator.js';

// Setup cron jobs
export const setupCronJobs = () => {
  // Run every day at midnight to check and reset streaks
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily streak check...');
    try {
      const result = await checkAndResetStreaks();
      console.log(`Streak check complete. Reset ${result.resetCount} streaks.`);
    } catch (error) {
      console.error('Error in streak check cron job:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
};