import express from 'express';
import {
  register,
  login,
  getProfile,
  verifyToken,
  changePassword,
  forgotPassword,
  resetPassword,
  linkTelegram
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private (requires authentication)
 */
router.get('/verify', authenticate, verifyToken);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change the current user's password
 * @access  Private (requires authentication)
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Email a password reset link
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset the password using an emailed token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/telegram-link
 * @desc    Link/unlink the current user's Telegram chat id for notifications
 * @access  Private (requires authentication)
 */
router.post('/telegram-link', authenticate, linkTelegram);

export default router;
