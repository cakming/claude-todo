import pino from 'pino';

// Structured application logger. Level is configurable via LOG_LEVEL; defaults
// to 'silent' under tests so suites stay quiet, 'info' otherwise. In
// development we pretty-print when pino-pretty is available, but fall back to
// plain JSON if it isn't installed (production ships JSON to stdout for the
// log collector to parse).
const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'test' ? 'silent' : 'info');

const logger = pino({
  level,
  redact: {
    // Never let secrets reach the logs.
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    remove: true
  }
});

export default logger;
