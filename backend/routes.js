const express = require('express');
const router = express.Router();
const { getTopN, fetchNotifications } = require('./notificationService');
const { logger } = require('./logger');

/**
 * GET /api/notifications
 * Returns all notifications from upstream API.
 * Supports: ?limit=&page=&notification_type=
 */
router.get('/notifications', async (req, res) => {
  try {
    const { limit, page, notification_type } = req.query;
    const params = {};
    if (limit) params.limit = limit;
    if (page) params.page = page;
    if (notification_type) params.notification_type = notification_type;

    const notifications = await fetchNotifications(params);
    logger.info('Fetched all notifications', { count: notifications.length, params });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    logger.error('Failed to fetch notifications', { error: err.message });
    res.status(502).json({ success: false, error: 'Failed to fetch notifications from upstream API', details: err.message });
  }
});

/**
 * GET /api/notifications/priority
 * Returns top N priority notifications.
 * Query params:
 *   n           - number of top notifications to return (default: 10)
 *   notification_type - filter by type before ranking
 */
router.get('/notifications/priority', async (req, res) => {
  try {
    const n = parseInt(req.query.n) || 10;

    if (n < 1 || n > 1000) {
      return res.status(400).json({ success: false, error: 'n must be between 1 and 1000' });
    }

    const apiParams = {};
    if (req.query.notification_type) {
      apiParams.notification_type = req.query.notification_type;
    }

    const topN = await getTopN(n, apiParams);
    logger.info('Priority inbox computed', { requested_n: n, returned: topN.length });

    res.json({
      success: true,
      requested_n: n,
      returned: topN.length,
      notifications: topN,
    });
  } catch (err) {
    logger.error('Failed to compute priority inbox', { error: err.message });
    res.status(502).json({ success: false, error: 'Failed to compute priority inbox', details: err.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
