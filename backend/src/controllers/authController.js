import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { hashPassword, comparePassword, validatePassword, validateEmail } from '../utils/auth.js';
import { generateToken } from '../utils/jwt.js';

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

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate token
    const token = generateToken({
      userId: result.insertedId.toString(),
      username: username,
      email: email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.insertedId.toString(),
        username: username,
        email: email,
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
      email: user.email
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
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
