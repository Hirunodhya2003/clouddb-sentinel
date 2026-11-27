// Owner: Member 09
// Live MySQL Connection Pool, Storage Statistics, and Slow Query Monitor page.

import { useCallback, useEffect, useState } from "react";
import ConnectionStats from "../../components/performance-monitor/ConnectionStats.jsx";
import SlowQueryTable from "../../components/performance-monitor/SlowQueryTable.jsx";
import { getPerformanceOverview } from "../../services/performanceMonitorService.js";

export default function PerformanceMonitor() {
  const [overview, setOverview] = useState(null);
  const [slowOnly, setSlowOnly] = useState(false);
  const [minDurationMs, setMinDurationMs] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        slow_only: slowOnly ? "true" : "",
        min_duration_ms: minDurationMs !== "" ? Number(minDurationMs) : "",
        limit: 50,
      };
      const data = await getPerformanceOverview(params);
      setOverview(data);
    } catch (err) {
      setError(err.message || "Unable to fetch database performance metrics.");
    } finally {
      setLoading(false);
    }
  }, [slowOnly, minDurationMs]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(fetchMetrics, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchMetrics]);

  const breakdown = overview?.query_type_breakdown || [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header className="page-header page-header-row">
        <div>
          <h1>Database Performance Monitor</h1>
          <p>
            Track active MySQL threads, connection pool utilization, InnoDB table
            storage, and slow application queries.
          </p>
        </div>

        <div className="header-actions" style={{ alignItems: "center" }}>
          <label className="inline-check" style={{ fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (10s)</span>
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchMetrics}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <ConnectionStats
        connections={overview?.connections}
        tableStats={overview?.table_statistics || []}
        loading={loading}
      />

      {breakdown.length > 0 && (
        <section className="card" aria-label="Query type latency breakdown">
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
            Workload Breakdown by SQL Type
          </h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Query Type</th>
                  <th style={{ textAlign: "right" }}>Executions</th>
                  <th style={{ textAlign: "right" }}>Slow Count</th>
                  <th style={{ textAlign: "right" }}>Avg Latency (ms)</th>
                  <th style={{ textAlign: "right" }}>Max Latency (ms)</th>
                  <th style={{ textAlign: "right" }}>Rows Examined</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => (
                  <tr key={item.query_type}>
                    <td className="mono">{item.query_type}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {item.total_executions}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {item.slow_executions}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(item.avg_execution_time_ms || 0).toFixed(2)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(item.max_execution_time_ms || 0).toFixed(2)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(item.total_rows_examined || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SlowQueryTable
        queries={overview?.slow_queries || []}
        slowOnly={slowOnly}
        onSlowOnlyChange={setSlowOnly}
        minDurationMs={minDurationMs}
        onMinDurationChange={setMinDurationMs}
        loading={loading}
      />
    </div>
  );
}
