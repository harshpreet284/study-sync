import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Resolves and normalizes allowed CORS origins.
 *
 * Rules:
 * - Includes default localhost development origins (http://localhost:5173, http://127.0.0.1:5173)
 *   only when NODE_ENV is not 'production'.
 * - Accepts single or comma-separated origins from CLIENT_URL.
 * - Trims whitespace and strips any trailing slashes from each origin.
 * - Filters out empty values and deduplicates entries.
 *
 * @param {string} [clientUrlEnv=process.env.CLIENT_URL]
 * @param {string} [nodeEnv=process.env.NODE_ENV]
 * @returns {string[]} Array of normalized unique allowed origins
 */
const resolveAllowedOrigins = (clientUrlEnv = process.env.CLIENT_URL, nodeEnv = process.env.NODE_ENV) => {
  const isProduction = nodeEnv === 'production';
  const defaultOrigins = isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const origins = new Set(defaultOrigins);

  if (typeof clientUrlEnv === 'string') {
    clientUrlEnv
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter((url) => url.length > 0)
      .forEach((url) => origins.add(url));
  }

  return Array.from(origins);
};

/**
 * Checks if a given request origin is permitted by the CORS allowlist.
 *
 * - Non-browser requests without an Origin header (e.g. mobile apps, curl, server-to-server)
 *   are permitted.
 * - Incoming browser Origin is trimmed and stripped of any trailing slashes before comparison.
 * - Exact match against normalized allowed origins is enforced (no wildcards).
 *
 * @param {string} [origin]
 * @param {string[]} allowedOrigins
 * @returns {boolean} True if allowed, false otherwise
 */
const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  return allowedOrigins.includes(normalizedOrigin);
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = resolveAllowedOrigins();
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      const corsError = new Error('Blocked by CORS policy');
      corsError.statusCode = 403;
      callback(corsError);
    }
  },
  credentials: true,
}));

// Body parsing middleware with reasonable request size limit
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Server lifecycle management
let server;
let isShuttingDown = false;

/**
 * Gracefully shuts down the HTTP server and database connections.
 * Prevents duplicate shutdown executions and enforces a timeout.
 */
const shutdown = async (signal) => {
  if (isShuttingDown) {
    console.warn(`[Server] Shutdown already in progress. Ignoring duplicate ${signal} signal.`);
    return;
  }
  isShuttingDown = true;
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  // Force exit after 10s timeout to prevent hanging indefinitely
  const forceExitTimeout = setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    if (server && server.listening) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('[Server] Error closing HTTP server:', err.message);
          } else {
            console.log('[Server] HTTP server stopped accepting connections.');
          }
          resolve();
        });
      });
    }

    await disconnectDB();
    clearTimeout(forceExitTimeout);
    console.log('[Server] Graceful shutdown complete.');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error.message);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

/**
 * Validates that JWT_SECRET is configured and sufficiently strong (at least 32 characters)
 * before starting the server. A cryptographically random secret (e.g. 64-character hex)
 * should be generated and stored in the local server/.env file only.
 *
 * @returns {boolean} True if valid, false otherwise
 */
const validateJwtConfig = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Startup Error] JWT_SECRET environment variable is missing.');
    console.error('[Startup Error] A cryptographically random secret of at least 32 characters is required for authentication.');
    return false;
  }

  const trimmedSecret = String(secret).trim();
  if (trimmedSecret.length < 32) {
    console.error(`[Startup Error] JWT_SECRET is too short (${trimmedSecret.length} characters).`);
    console.error('[Startup Error] A cryptographically random secret of at least 32 characters is required to ensure token security.');
    return false;
  }

  return true;
};

const startServer = async () => {
  // Validate critical security configuration before startup
  if (!validateJwtConfig()) {
    console.error('[Server] Server startup aborted due to invalid security configuration.');
    process.exit(1);
  }

  // Attempt database connection
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`[Server] StudySync API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Handle server listen errors such as EADDRINUSE
  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use by another process.`);
    } else {
      console.error(`[Server] Server startup error: ${err.message}`);
    }
    try {
      await disconnectDB();
    } catch {
      // Ignore disconnect error during startup failure
    }
    process.exit(1);
  });

  return server;
};

// Register process signal handlers for graceful shutdown
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start automatically when run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export {
  app,
  startServer,
  shutdown,
  validateJwtConfig,
  resolveAllowedOrigins,
  isOriginAllowed,
};

