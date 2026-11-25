// Owner: Member 09
// Frontend API service for MySQL Connection, Table Statistics, and Slow Query Monitoring.

import api from "./api.js";

export function getPerformanceOverview(params = {}) {
  return api.get("/performance-monitor/overview", params);
}

export function getConnectionStats() {
  return api.get("/performance-monitor/connections");
}

export function getTableStatistics() {
  return api.get("/performance-monitor/tables");
}

export function getSlowQueries(params = {}) {
  return api.get("/performance-monitor/slow-queries", params);
}

export function recordQueryLog(payload) {
  return api.post("/performance-monitor/logs", payload);
}

export default {
  getPerformanceOverview,
  getConnectionStats,
  getTableStatistics,
  getSlowQueries,
  recordQueryLog,
};
