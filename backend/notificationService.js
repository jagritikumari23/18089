const axios = require('axios');
const MinHeap = require('./minHeap');
const { computeScore } = require('./priorityScorer');

const API_URL = 'http://20.207.122.201/evaluation-service/notifications';

/**
 * Fetches all notifications from the evaluation API.
 * Supports optional query params: limit, page, notification_type
 */
async function fetchNotifications(params = {}) {
  const config = require('./config');
  const response = await axios.get(API_URL, {
    params,
    headers: {
      Authorization: `${config.token_type} ${config.access_token}`
    },
    timeout: 10000,
  });
  return response.data.notifications || [];
}

/**
 * Builds a scored notification object.
 */
function scoreNotification(notification) {
  return {
    ...notification,
    score: computeScore(notification),
  };
}

/**
 * Returns the Top N priority notifications using a min-heap of size N.
 *
 * Algorithm:
 *   For each notification:
 *     1. Compute priority score.
 *     2. If heap.size < N → push directly.
 *     3. Else if score > heap.peek().score → pop min, push new item.
 *     4. Else discard (it's not in the top N).
 *
 *   Time:  O(K log N) where K = total notifications
 *   Space: O(N)
 *
 * @param {number} n - how many top notifications to return
 * @param {object} apiParams - optional params forwarded to API
 * @returns {object[]} top N notifications sorted by priority descending
 */
async function getTopN(n, apiParams = {}) {
  const raw = await fetchNotifications(apiParams);

  if (!raw || raw.length === 0) return [];

  const heap = new MinHeap();

  for (const notification of raw) {
    const scored = scoreNotification(notification);

    if (heap.size() < n) {
      heap.push(scored);
    } else if (scored.score > heap.peek().score) {
      heap.pop();
      heap.push(scored);
    }
  }

  return heap.toSortedArray();
}

module.exports = { getTopN, fetchNotifications };
