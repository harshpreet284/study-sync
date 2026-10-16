import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow designated frontend origin
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server and initialize database connection
let server;

const startServer = async () => {
  // Attempt database connection
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`[Server] StudySync API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  return server;
};

// Start automatically when run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
