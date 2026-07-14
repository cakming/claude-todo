// Boots an ephemeral MongoDB and starts the real backend against it, for E2E.
// Playwright's webServer launches this; it stays alive until terminated.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();

// Must be set before importing the app (config/mongodb.js reads them at load).
// Set unconditionally: the container may export CORS_ORIGIN/PORT for other uses,
// and the E2E stack must pin its own values (frontend runs on :5173).
process.env.MONGODB_URI = mongod.getUri();
process.env.DB_NAME = 'vibe_todo_e2e';
process.env.PORT = '3001';
// Auth is off by default; set E2E_AUTH=true to exercise the login/register flow.
process.env.AUTH_ENABLED = process.env.E2E_AUTH === 'true' ? 'true' : 'false';
if (process.env.AUTH_ENABLED === 'true') process.env.JWT_SECRET = 'e2e-test-secret';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.E2E_TEST = 'true'; // enables the /__test__/reset endpoint for isolation
process.env.NODE_ENV = 'development'; // ensure app.js auto-starts (it skips under 'test')

// Importing the app runs startServer(): connectDB() + app.listen(PORT).
await import('../src/app.js');

const shutdown = async () => {
  try {
    await mongod.stop();
  } finally {
    process.exit(0);
  }
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
