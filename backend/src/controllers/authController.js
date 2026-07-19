import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { hashPassword, comparePassword, validatePassword, validateEmail } from '../utils/auth.js';
import { generateToken } from '../utils/jwt.js';
import { sendMail } from '../utils/mailer.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const USERS_COLLECTION = 'users';

/**
 * Get users collection
 */
function getUsersCollection() {
  return getDB().collection(USERS_COLLECTION);
}

/**
 * Register a new user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    const usersCollection = getUsersCollection();

    // Check if username already exists
    const existingUsername = await usersCollection.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await usersCollection.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // The very first registered user becomes an admin; everyone else a member.
    const userCount = await usersCollection.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'member';

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate token
    const token = generateToken({
      userId: result.insertedId.toString(),
      username: username,
      email: email,
      role: role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.insertedId.toString(),
        username: username,
        email: email,
        role: role,
        token: token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
}

/**
 * Login user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const usersCollection = getUsersCollection();

    // Find user by username
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'member'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || 'member',
        token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
}

/**
 * Get current user profile
 * @param {Object} req - Express request (with user from auth middleware)
 * @param {Object} res - Express response
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || 'member',
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
}

/**
 * Change the authenticated user's password.
 * @param {Object} req - Express request (with user from auth middleware)
 * @param {Object} res - Express response
 */
export async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: validation.errors
      });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashed = await hashPassword(newPassword);
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashed, updated_at: new Date() } }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
}

/**
 * Start a password reset: email the user a time-limited reset link.
 * Always responds success to avoid revealing which emails exist.
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ email });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { reset_token_hash: hashToken(token), reset_expires: expires, updated_at: new Date() } }
      );

      const base = process.env.APP_URL || 'http://localhost:5173';
      const link = `${base}/?reset_token=${token}&email=${encodeURIComponent(email)}`;
      await sendMail({
        to: email,
        subject: 'Reset your Vibe Todo password',
        text: `You requested a password reset.\n\nReset it here (valid for 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`
      });
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to start password reset' });
  }
}

/**
 * Complete a password reset using the emailed token.
 */
export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: 'Password validation failed', errors: validation.errors });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ email });

    const invalid = () =>
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    if (!user || !user.reset_token_hash || !user.reset_expires) return invalid();
    if (new Date(user.reset_expires) < new Date()) return invalid();
    if (user.reset_token_hash !== hashToken(token)) return invalid();

    const hashed = await hashPassword(newPassword);
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashed, reset_token_hash: null, reset_expires: null, updated_at: new Date() } }
    );

    res.json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

/**
 * Verify token endpoint (for checking if token is still valid)
 * @param {Object} req - Express request (with user from auth middleware)
 * @param {Object} res - Express response
 */
export async function verifyToken(req, res) {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email
    }
  });
}

/**
 * Link or unlink the current user's Telegram chat id for notifications.
 * Body: { chat_id } — pass an empty value to unlink.
 */
export async function linkTelegram(req, res) {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const raw = req.body?.chat_id;
    const value = raw ? String(raw).trim() : null;

    const result = await getUsersCollection().updateOne(
      { username },
      { $set: { telegram_chat_id: value } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: value ? 'Telegram linked' : 'Telegram unlinked' });
  } catch (error) {
    console.error('Error linking Telegram:', error);
    res.status(500).json({ success: false, message: 'Failed to update Telegram link' });
  }
}
