import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout,
  googleAuth,
  githubAuth,
  githubExchange,
  githubCallback,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAllowedEmailDomain } from '../utils/emailValidation.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .bail()
    .custom((value) => {
      if (!isAllowedEmailDomain(value)) {
        throw new Error('Please use a Gmail, Hotmail, Outlook, or Yahoo address');
      }
      return true;
    }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/google', googleAuth);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);
router.post('/github/exchange', githubExchange);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);

export default router;
