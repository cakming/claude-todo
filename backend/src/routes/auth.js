import express from 'express';
import {
  register,
  login,
  getProfile,
  verifyToken,
  changePassword,
  forgotPassword,
  resetPassword,
  telegramConnect,
  telegramStatus,
  telegramDisconnect
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
 * Telegram notification linking (requires authentication).
 * connect -> get a deep link; status -> check if linked; disconnect -> unlink.
 */
router.post('/telegram/connect', authenticate, telegramConnect);
router.get('/telegram/status', authenticate, telegramStatus);
router.post('/telegram/disconnect', authenticate, telegramDisconnect);

export default router;
