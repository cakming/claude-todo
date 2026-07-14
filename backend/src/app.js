import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './utils/logger.js';
import { connectDB, closeDB, getDB, createUserIndexes } from './config/mongodb.js';
import { setIO } from './realtime.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateProject } from './middleware/projectValidator.js';
import { authenticate, isAuthEnabled, requireRole } from './middleware/authMiddleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import epicRoutes from './routes/epics.js';
import featureRoutes from './routes/features.js';
import taskRoutes from './routes/tasks.js';
import treeRoutes from './routes/tree.js';
import activityRoutes from './routes/activity.js';
import adminRoutes from './routes/admin.js';
import pageRoutes from './routes/pages.js';
import uploadRoutes from './routes/uploads.js';
import { exportProject, importProject } from './controllers/exchangeController.js';
import { restoreItems } from './controllers/restoreController.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured request logging. Health checks and the E2E reset endpoint are
// noise, so we don't auto-log them.
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/__test__/reset'
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vibe Todo API is running',
    timestamp: new Date().toISOString(),
    authEnabled: isAuthEnabled()
  });
});

// Rate limit auth endpoints to slow down brute-force / credential-stuffing.
// Disabled under tests/E2E so suites aren't throttled.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  skip: () => process.env.E2E_TEST === 'true' || process.env.NODE_ENV === 'test'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Authentication routes (always available)
app.use('/api/auth', authRoutes);

// Admin routes (require the 'admin' role when auth is enabled)
app.use('/api/admin', authenticate, requireRole('admin'), adminRoutes);

// API Routes (protected if AUTH_ENABLED=true)
app.use('/api/projects', authenticate, projectRoutes);

// Project-scoped routes (require project validation + auth if enabled)
app.use('/api/:project/epics', authenticate, validateProject, epicRoutes);
app.use('/api/:project/features', authenticate, validateProject, featureRoutes);
app.use('/api/:project/tasks', authenticate, validateProject, taskRoutes);
app.use('/api/:project/tree', authenticate, validateProject, treeRoutes);
app.use('/api/:project/activity', authenticate, validateProject, activityRoutes);
app.use('/api/:project/pages', authenticate, validateProject, pageRoutes);
app.use('/api/:project/uploads', authenticate, validateProject, uploadRoutes);

// Project export / import (JSON).
app.get('/api/:project/export', authenticate, validateProject, exportProject);
app.post('/api/:project/import', authenticate, validateProject, importProject);

// Restore previously-deleted items (undo of a delete).
app.post('/api/:project/restore', authenticate, validateProject, restoreItems);

// Test-only endpoint to reset the database between E2E tests. Gated behind
// E2E_TEST and never enabled in production (only backend/scripts/e2e-server.mjs
// sets it). Registered before the 404 handler so it is reachable.
if (process.env.E2E_TEST === 'true') {
  app.post('/__test__/reset', async (req, res) => {
    try {
      await getDB().dropDatabase();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Ensure unique indexes on the users collection (safe if they already exist)
    await createUserIndexes();

    // Wrap the Express app in an HTTP server so Socket.IO can share the port.
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }
    });
    setIO(io);

    // Start listening
    server.listen(PORT, () => {
      logger.info(
        { port: PORT, realtime: true, authEnabled: isAuthEnabled() },
        `🚀 Vibe Todo API server running on port ${PORT}`
      );
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  logger.info({ signal }, '🛑 Shutting down gracefully...');
  await closeDB();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the server (skipped under tests, which import `app` and manage their
// own database connection).
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
