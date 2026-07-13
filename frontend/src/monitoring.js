// Error monitoring is opt-in: it only activates when VITE_SENTRY_DSN is set at
// build time. The Sentry SDK is heavy, so we load it lazily via dynamic import
// — a build without a DSN never pulls it into the main bundle and pays no
// runtime cost, sending nothing over the network.
let sentry = null;

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_RATE ?? 0.1)
  });
  sentry = Sentry;
}

// Report a caught error. Safe to call whether or not monitoring is enabled.
export function reportError(error, context) {
  if (!sentry) return;
  sentry.captureException(error, context ? { extra: context } : undefined);
}
