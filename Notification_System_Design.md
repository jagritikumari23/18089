# Notification System Design

## Overview

A Node.js/Express microservice that fetches campus notifications from an upstream API, ranks them by priority, and exposes a **Priority Inbox** endpoint returning the Top N most important unread notifications.

---

## Priority Scoring Approach

Each notification receives a **composite score** blending two signals:

| Signal | Weight | Rationale |
|---|---|---|
| Type weight | 60% | Placement > Result > Event — importance is categorical |
| Recency | 40% | More recent notifications matter more within the same category |

### Type Weights

```
Placement = 3  (highest)
Result    = 2
Event     = 1  (lowest)
```

### Recency Normalization

Raw timestamps (`YYYY-MM-DD HH:MM:SS`) are parsed into Unix epoch seconds. Recency is normalized against the maximum observed timestamp in the current batch:

```
recencyNorm = ts / maxTimestampSeen   ∈ [0, 1]
```

This produces a relative recency score without requiring a hard-coded time window.

### Final Score Formula

```
score = (typeWeight / 3) × 0.6 + recencyNorm × 0.4
```

Scaled by `1,000,000` to work with integer comparisons in the heap.

---

## Maintaining Top N Efficiently

### Data Structure: Min-Heap of size N

**Why a min-heap?**

A naive approach (sort all K notifications, take first N) costs **O(K log K)** time and **O(K)** space.

A min-heap of size N reduces this to:

| | Naive Sort | Min-Heap (ours) |
|---|---|---|
| Time | O(K log K) | **O(K log N)** |
| Space | O(K) | **O(N)** |

Since N << K in a real system, this is significantly more efficient.

### Algorithm

```
heap = MinHeap (capacity = N)

for each notification in stream:
  scored = computeScore(notification)

  if heap.size < N:
    heap.push(scored)          // Fill up the heap first
  else if scored.score > heap.peek().score:
    heap.pop()                 // Evict the lowest-priority item
    heap.push(scored)          // Replace with the new high-priority item
  // else: discard — it doesn't make the top N

return heap.toSortedArray()    // Sorted descending by score
```

The **heap root is always the minimum** of the current top-N set, so comparison and eviction are O(log N).

---

## Handling Continuous/Incoming Notifications

The service is **stateless by design** (as required — no DB). Each API call:

1. Fetches the latest snapshot from the upstream evaluation API.
2. Runs the heap algorithm on the full batch.
3. Returns fresh results.

This means:
- **Always reflects the current state** of the upstream data source.
- **No stale data** accumulates in memory between requests.
- **Horizontally scalable** — each instance independently computes Top N.

If the upstream API were a stream (WebSocket / SSE), the same heap algorithm applies incrementally: new notifications are compared against `heap.peek()` in O(log N) per event.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/notifications` | All notifications (supports `limit`, `page`, `notification_type`) |
| GET | `/api/notifications/priority?n=10` | Top N priority notifications |

---

## Trade-offs and Design Choices

### No database
Per requirements. All computation is in-memory per request. The upstream API is the sole source of truth.

### Stateless service
Chosen for simplicity and horizontal scalability. The trade-off is that every request re-fetches from upstream. A production system would add a short-lived cache (e.g., Redis TTL 30s) to reduce upstream load.

### Scoring weights (60/40 type/recency split)
Type hierarchy is the dominant signal because a recent `Event` should not outrank an older `Placement`. The 60/40 split means type always determines the broad tier, and recency fine-tunes ordering within the same type.

### Recency normalization via maxTimestamp
Avoids hard-coded time windows (e.g., "last 7 days") which would require tuning. The normalization is self-adjusting: the newest notification in the batch always scores `1.0` on recency.

### Integer scores
Multiplying by `1,000,000` before storing in the heap avoids floating-point comparison issues and makes heap operations deterministic.

---

## Project Structure

```
campus-notifications/
├── index.js                  # Express app + server bootstrap
├── src/
│   ├── routes.js             # API route handlers
│   ├── notificationService.js# Fetch + Top-N logic
│   ├── priorityScorer.js     # Score computation
│   ├── minHeap.js            # Min-heap data structure
│   └── logger.js             # Logging middleware + file logger
├── logs/
│   └── app.log               # Structured JSON logs
└── Notification_System_Design.md
```

---

## Running Locally

```bash
npm install
node index.js
# Server starts on http://localhost:3001
```

### Example requests

```bash
# Top 10 priority notifications
curl http://localhost:3001/api/notifications/priority?n=10

# Top 15
curl http://localhost:3001/api/notifications/priority?n=15

# Top 10 Placement-only
curl "http://localhost:3001/api/notifications/priority?n=10&notification_type=Placement"

# All notifications, page 2
curl "http://localhost:3001/api/notifications?page=2&limit=20"
```
