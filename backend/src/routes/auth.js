import express from 'express';
import { register, login, getProfile, verifyToken } from '../controllers/authController.js';
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

export default router;
