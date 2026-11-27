// Owner: Member 09
// Smart frontend service for MySQL Connection Pool, Storage Telemetry, and Anomaly Diagnostics.

import api from "./api.js";

export const DEMO_PERFORMANCE_OVERVIEW = {
  connections: {
    mysql_version: "8.0.46",
    dialect: "mysql",
    threads_connected: 9,
    threads_running: 2,
    max_used_connections: 24,
    max_connections: 151,
    connection_utilization_pct: 5.96,
    aborted_connects: 0,
    total_connections: 184,
    uptime_seconds: 86400,
    questions: 14820,
    slow_queries_count: 2,
    slow_query_log_enabled: true,
    long_query_time_seconds: 1.0,
  },
  table_statistics: [
    {
      table_name: "stock_movements",
      engine: "InnoDB",
      table_rows: 1420,
      data_size_mb: 0.48,
      index_size_mb: 0.31,
      total_size_mb: 0.79,
      free_space_mb: 0.0,
    },
    {
      table_name: "sale_items",
      engine: "InnoDB",
      table_rows: 980,
      data_size_mb: 0.34,
      index_size_mb: 0.22,
      total_size_mb: 0.56,
      free_space_mb: 0.0,
    },
    {
      table_name: "sales",
      engine: "InnoDB",
      table_rows: 410,
      data_size_mb: 0.19,
      index_size_mb: 0.14,
      total_size_mb: 0.33,
      free_space_mb: 0.0,
    },
    {
      table_name: "inventory",
      engine: "InnoDB",
      table_rows: 185,
      data_size_mb: 0.08,
      index_size_mb: 0.06,
      total_size_mb: 0.14,
      free_space_mb: 0.0,
    },
    {
      table_name: "query_performance_logs",
      engine: "InnoDB",
      table_rows: 96,
      data_size_mb: 0.06,
      index_size_mb: 0.05,
      total_size_mb: 0.11,
      free_space_mb: 0.0,
    },
  ],
  slow_queries: [
    {
      log_id: 12,
      query_type: "SELECT",
      execution_time_ms: 284.6,
      rows_examined: 4820,
      rows_returned: 14,
      is_slow_query: true,
      endpoint: "/api/v1/reports/sales",
      query_text:
        "SELECT * FROM sales WHERE SUBSTR(CAST(sale_date AS CHAR), 1, 4) = '2026' ORDER BY sale_date DESC",
    },
    {
      log_id: 11,
      query_type: "SELECT",
      execution_time_ms: 142.3,
      rows_examined: 1850,
      rows_returned: 9,
      is_slow_query: true,
      endpoint: "/api/v1/inventory/low-stock",
      query_text:
        "SELECT pv.sku, p.product_name, i.quantity_on_hand FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id WHERE i.quantity_on_hand <= i.reorder_level",
    },
    {
      log_id: 10,
      query_type: "EXPLAIN",
      execution_time_ms: 3.4,
      rows_examined: 12,
      rows_returned: 1,
      is_slow_query: false,
      endpoint: "/api/v1/query-analyzer/explain",
      query_text:
        "SELECT sale_id, invoice_number, sale_date, total_amount FROM sales WHERE sale_date >= '2026-01-01' AND status = 'COMPLETED'",
    },
  ],
  query_type_breakdown: [
    {
      query_type: "SELECT",
      total_executions: 68,
      slow_executions: 2,
      avg_execution_time_ms: 21.8,
      max_execution_time_ms: 284.6,
      total_rows_examined: 9420,
    },
    {
      query_type: "EXPLAIN",
      total_executions: 28,
      slow_executions: 0,
      avg_execution_time_ms: 2.9,
      max_execution_time_ms: 8.4,
      total_rows_examined: 340,
    },
  ],
  total_logged_queries: 96,
  slow_query_threshold_ms: 100.0,
};

export function evaluateDatabaseHealth(overview) {
  if (!overview || !overview.connections) {
    return { status: "unknown", score: 0, advisories: [] };
  }
  const conn = overview.connections;
  const slowList = overview.slow_queries || [];
  const util = Number(conn.connection_utilization_pct || 0);
  const slowCount = slowList.filter((q) => q.is_slow_query).length;

  let score = 96;
  const advisories = [];

  if (util >= 80) {
    score -= 30;
    advisories.push("Connection pool utilization exceeds 80% — inspect long-running transactions.");
  } else if (util >= 50) {
    score -= 12;
    advisories.push("Moderate connection pool load (>50% of max_connections).");
  }

  if (slowCount > 0) {
    score -= Math.min(25, slowCount * 6);
    advisories.push(`${slowCount} recorded query execution(s) exceeded the slow-query latency threshold.`);
  }

  if (Number(conn.aborted_connects || 0) > 5) {
    score -= 10;
    advisories.push("Elevated Aborted_connects counter — verify application connection credentials and timeouts.");
  }

  if (advisories.length === 0) {
    advisories.push("Connection pool saturation, thread concurrency, and query latencies are within optimal bounds.");
  }

  const bounded = Math.max(25, Math.min(100, Math.round(score)));
  const status = bounded >= 85 ? "Optimal" : bounded >= 65 ? "Warning" : "Critical";
  return { status, score: bounded, advisories };
}

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
  DEMO_PERFORMANCE_OVERVIEW,
  evaluateDatabaseHealth,
  getPerformanceOverview,
  getConnectionStats,
  getTableStatistics,
  getSlowQueries,
  recordQueryLog,
};
