import mongoose from 'mongoose';

/**
 * Controller for GET /api/health
 * Accurately reports application health and current MongoDB connection state.
 */
export const getHealth = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
      },
    },
  });
};
