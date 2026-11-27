// Owner: Member 09
// Smart Live MySQL Connection Pool, Storage Statistics, Health Diagnostics & Slow Query Monitor.

import { useCallback, useEffect, useMemo, useState } from "react";
import ConnectionStats from "../../components/performance-monitor/ConnectionStats.jsx";
import SlowQueryTable from "../../components/performance-monitor/SlowQueryTable.jsx";
import {
  DEMO_PERFORMANCE_OVERVIEW,
  evaluateDatabaseHealth,
  getPerformanceOverview,
  recordQueryLog,
} from "../../services/performanceMonitorService.js";

export default function PerformanceMonitor() {
  const [overview, setOverview] = useState(null);
  const [slowOnly, setSlowOnly] = useState(false);
  const [minDurationMs, setMinDurationMs] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interactive probe recorder drawer
  const [showProbeForm, setShowProbeForm] = useState(false);
  const [probePayload, setProbePayload] = useState({
    query_type: "SELECT",
    endpoint: "/api/v1/reports/sales",
    execution_time_ms: "185.5",
    rows_examined: "2400",
    rows_returned: "18",
    query_text:
      "SELECT sale_id, invoice_number, total_amount FROM sales WHERE status = 'COMPLETED' ORDER BY sale_date DESC",
  });
  const [submittingProbe, setSubmittingProbe] = useState(false);

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
      setUsingFallback(false);
    } catch (err) {
      setOverview(DEMO_PERFORMANCE_OVERVIEW);
      setUsingFallback(true);
      setError(err.message || "");
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

  const health = useMemo(() => evaluateDatabaseHealth(overview), [overview]);
  const breakdown = overview?.query_type_breakdown || [];

  const handleRecordProbe = async (e) => {
    e.preventDefault();
    setSubmittingProbe(true);
    setError("");
    try {
      await recordQueryLog({
        query_type: probePayload.query_type,
        endpoint: probePayload.endpoint,
        execution_time_ms: Number(probePayload.execution_time_ms || 0),
        rows_examined: Number(probePayload.rows_examined || 0),
        rows_returned: Number(probePayload.rows_returned || 0),
        query_text: probePayload.query_text,
        slow_threshold_ms: 100,
      });
      setShowProbeForm(false);
      await fetchMetrics();
    } catch (err) {
      setError(err.message || "Failed to record telemetry probe.");
    } finally {
      setSubmittingProbe(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header
        className="page-header page-header-row"
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          background:
            "radial-gradient(ellipse at 100% 0%, #3055e7, transparent 68%), #151d2f",
          color: "#ffffff",
          marginBottom: 0,
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 12,
              fontWeight: 700,
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            MySQL 8.0 &amp; Application Telemetry
          </p>
          <h1 style={{ margin: "0 0 6px", color: "#ffffff", fontSize: 24 }}>
            Database Performance Monitor
          </h1>
          <p style={{ margin: 0, color: "#dbe6ff", fontSize: 13 }}>
            Track active MySQL threads, connection pool utilization, InnoDB table
            storage, and slow application queries.
          </p>
        </div>

        <div
          className="header-actions"
          style={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <label
            className="inline-check"
            style={{ fontSize: 13, cursor: "pointer", color: "#e2e8f0" }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (10s)</span>
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowProbeForm((v) => !v)}
          >
            {showProbeForm ? "Hide Probe Form" : "+ Log Test Query"}
          </button>
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

      {/* Automated Database Health Diagnostic Strip */}
      {overview && (
        <section
          className="card"
          aria-label="Database health diagnostics"
          style={{
            borderLeft: `4px solid ${
              health.status === "Optimal"
                ? "#1f8a52"
                : health.status === "Warning"
                ? "#d97706"
                : "#c0392b"
            }`,
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <strong style={{ fontSize: 14 }}>
                Automated Telemetry Diagnostics
              </strong>
              <span className="badge badge-active">
                Health Score: {health.score}/100 ({health.status})
              </span>
              {usingFallback && (
                <span
                  className="badge"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  Baseline Telemetry Snapshot
                </span>
              )}
            </div>
            <span className="muted mono" style={{ fontSize: 12 }}>
              Slow threshold: {overview.slow_query_threshold_ms ?? 100} ms
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155" }}>
            {health.advisories.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </section>
      )}

      {showProbeForm && (
        <form
          className="card"
          onSubmit={handleRecordProbe}
          aria-label="Record query performance log"
        >
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>
            Record Custom SQL Telemetry Entry
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="probe-type">Query Type</label>
              <select
                id="probe-type"
                value={probePayload.query_type}
                onChange={(e) =>
                  setProbePayload((p) => ({ ...p, query_type: e.target.value }))
                }
              >
                <option value="SELECT">SELECT</option>
                <option value="EXPLAIN">EXPLAIN</option>
                <option value="REPORT">REPORT</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="probe-endpoint">Endpoint</label>
              <input
                id="probe-endpoint"
                value={probePayload.endpoint}
                onChange={(e) =>
                  setProbePayload((p) => ({ ...p, endpoint: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="probe-ms">Execution Time (ms)</label>
              <input
                id="probe-ms"
                type="number"
                step="0.1"
                min="0"
                value={probePayload.execution_time_ms}
                onChange={(e) =>
                  setProbePayload((p) => ({
                    ...p,
                    execution_time_ms: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="probe-rows">Rows Examined</label>
              <input
                id="probe-rows"
                type="number"
                min="0"
                value={probePayload.rows_examined}
                onChange={(e) =>
                  setProbePayload((p) => ({
                    ...p,
                    rows_examined: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-field form-field-full">
              <label htmlFor="probe-sql">SQL Statement</label>
              <textarea
                id="probe-sql"
                className="mono"
                rows={3}
                value={probePayload.query_text}
                onChange={(e) =>
                  setProbePayload((p) => ({ ...p, query_text: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowProbeForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingProbe}
            >
              {submittingProbe ? "Saving..." : "Record Log Entry"}
            </button>
          </div>
        </form>
      )}

      {error && !usingFallback && (
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
