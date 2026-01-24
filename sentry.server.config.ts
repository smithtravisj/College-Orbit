import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - lower sample rate for server
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Set environment
  environment: process.env.NODE_ENV,

  // Filter out noisy errors
  ignoreErrors: [
    // Expected auth errors
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    // Database connection issues during cold starts
    "PrismaClientInitializationError",
  ],

  // Sanitize sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-forwarded-for"];
    }

    // Remove sensitive data from request body
    if (event.request?.data) {
      const sensitiveFields = ["password", "newPassword", "currentPassword", "token", "secret"];
      try {
        const data = typeof event.request.data === "string"
          ? JSON.parse(event.request.data)
          : event.request.data;

        for (const field of sensitiveFields) {
          if (data[field]) {
            data[field] = "[Filtered]";
          }
        }
        event.request.data = JSON.stringify(data);
      } catch {
        // Not JSON, leave as is
      }
    }

    return event;
  },
});
