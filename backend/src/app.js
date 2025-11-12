import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './config/mongodb.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateProject } from './middleware/projectValidator.js';

// Import routes
import projectRoutes from './routes/projects.js';
import epicRoutes from './routes/epics.js';
import featureRoutes from './routes/features.js';
import taskRoutes from './routes/tasks.js';
import treeRoutes from './routes/tree.js';

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vibe Todo API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/projects', projectRoutes);

// Project-scoped routes (require project validation)
app.use('/api/:project/epics', validateProject, epicRoutes);
app.use('/api/:project/features', validateProject, featureRoutes);
app.use('/api/:project/tasks', validateProject, taskRoutes);
app.use('/api/:project/tree', validateProject, treeRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Vibe Todo API server running on port ${PORT}`);
      console.log(`📍 API endpoint: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDB();
  process.exit(0);
});

// Start the server
startServer();

export default app;
