const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Formats a log entry as a structured JSON line.
 */
function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

/**
 * Writes a log line to both stdout and the log file.
 */
function writeLog(level, message, meta = {}) {
  const line = formatLog(level, message, meta);
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const logger = {
  info: (msg, meta) => writeLog('INFO', msg, meta),
  warn: (msg, meta) => writeLog('WARN', msg, meta),
  error: (msg, meta) => writeLog('ERROR', msg, meta),
};

/**
 * Express logging middleware.
 * Logs: method, url, status, response time, and query params.
 */
function loggingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    writeLog(level.toUpperCase(), 'HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      query: req.query,
      ip: req.ip,
    });
  });

  next();
}

module.exports = { loggingMiddleware, logger };

