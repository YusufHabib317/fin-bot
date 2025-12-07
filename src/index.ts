/**
 * Market Pulse Bot - Main Entry Point
 *
 * Real-time financial alert system delivered through Telegram bot
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

async function main() {
  console.log('Market Pulse Bot starting...');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Initialize Express server
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  // Root endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Market Pulse Bot',
      version: '1.0.0',
      status: 'running',
    });
  });
  
  // Start server
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
  
  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // TODO: Initialize bot and services
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
