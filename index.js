const express = require('express');
const { loggingMiddleware, logger } = require('./src/logger');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(loggingMiddleware);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Campus Notifications Service started`, { port: PORT });
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/notifications`);
  console.log(`   GET /api/notifications/priority?n=10`);
  console.log(`   GET /api/notifications/priority?n=15`);
  console.log(`   GET /api/notifications?notification_type=Placement`);
});

module.exports = app;
