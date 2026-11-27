import * as Sentry from '@sentry/react-native';

let sentryInitialized = false;

/**
 * Initializes Sentry error monitoring when EXPO_PUBLIC_SENTRY_DSN is configured.
 */
export function initMobileSentry(): void {
  if (sentryInitialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 0 : 0.15,
    enableNative: true,
    environment: __DEV__ ? 'development' : 'production',
  });
  sentryInitialized = true;
}

export function captureMobileException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryInitialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('lifeos', context);
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}
