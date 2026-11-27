// Owner: Member 09
// Smart Slow Query Telemetry Table with Scan Ratio Diagnostics & SQL Inspector Modal.

import { useEffect, useMemo, useState } from "react";

export default function SlowQueryTable({
  queries = [],
  slowOnly = false,
  onSlowOnlyChange,
  minDurationMs = "",
  onMinDurationChange,
  loading = false,
}) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && selectedLog) setSelectedLog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedLog]);

  const queryTypes = useMemo(() => {
    const unique = new Set(queries.map((q) => String(q.query_type || "SELECT").toUpperCase()));
    return ["ALL", ...Array.from(unique)];
  }, [queries]);

  const visibleQueries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return queries.filter((item) => {
      if (
        typeFilter !== "ALL" &&
        String(item.query_type || "").toUpperCase() !== typeFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${item.endpoint || ""} ${item.query_text || ""} ${item.query_fingerprint || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [queries, typeFilter, searchTerm]);

  return (
    <section className="card" aria-label="Query performance log table">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
            Recorded Query Performance Logs
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Application SQL telemetry stored in <code>query_performance_logs</code> ·{" "}
            {visibleQueries.length} entry(s) shown
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            aria-label="Search query logs"
            placeholder="Search SQL or endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 185, padding: "5px 9px", fontSize: 12 }}
          />

          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Query type filter">
            {queryTypes.slice(0, 4).map((qt) => (
              <button
                key={qt}
                type="button"
                onClick={() => setTypeFilter(qt)}
                className={`btn ${typeFilter === qt ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 8px", fontSize: 11 }}
              >
                {qt}
              </button>
            ))}
          </div>

          {onMinDurationChange && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
            >
              <span className="muted">Min ms:</span>
              <input
                type="number"
                min="0"
                step="10"
                aria-label="Minimum duration ms"
                value={minDurationMs}
                onChange={(e) => onMinDurationChange(e.target.value)}
                style={{ width: 85, padding: "5px 8px" }}
              />
            </label>
          )}

          {onSlowOnlyChange && (
            <label
              className="inline-check"
              style={{ fontSize: 13, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={slowOnly}
                onChange={(e) => onSlowOnlyChange(e.target.checked)}
              />
              <span>Slow queries only</span>
            </label>
          )}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading query performance logs...</p>
      ) : visibleQueries.length === 0 ? (
        <p className="muted" role="status">
          No query performance logs match the current filter.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Duration (ms)</th>
                <th style={{ textAlign: "right" }}>Rows Examined</th>
                <th style={{ textAlign: "right" }}>Rows Returned</th>
                <th style={{ textAlign: "right" }}>Scan Ratio</th>
                <th>Endpoint</th>
                <th>Query Preview</th>
              </tr>
            </thead>
            <tbody>
              {visibleQueries.map((q) => {
                const examined = Number(q.rows_examined || 0);
                const returned = Math.max(1, Number(q.rows_returned || 0));
                const scanRatio = Math.round(examined / returned);

                return (
                  <tr
                    key={q.log_id}
                    onClick={() => setSelectedLog(q)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="mono">#{q.log_id}</td>
                    <td>
                      <span className="key-tag key-fk">{q.query_type}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={
                          q.is_slow_query
                            ? { background: "#fbeceb", color: "#c0392b" }
                            : { background: "#e4f4ec", color: "#1f8a52" }
                        }
                      >
                        {q.is_slow_query ? "SLOW" : "FAST"}
                      </span>
                    </td>
                    <td
                      className="mono"
                      style={{ textAlign: "right", fontWeight: 700 }}
                    >
                      {Number(q.execution_time_ms || 0).toFixed(2)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {examined.toLocaleString()}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(q.rows_returned || 0).toLocaleString()}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      <span
                        style={{
                          color: scanRatio > 50 ? "#c0392b" : "#475569",
                          fontWeight: scanRatio > 50 ? 700 : 400,
                        }}
                      >
                        {scanRatio}:1
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {q.endpoint || "-"}
                    </td>
                    <td
                      className="mono"
                      style={{
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                      }}
                      title={q.query_text || ""}
                    >
                      {q.query_text || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="SQL telemetry inspector"
          onClick={() => setSelectedLog(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(100%, 620px)", borderRadius: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16 }}>
                Query Telemetry Entry #{selectedLog.log_id}
              </h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLog(null)}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Close
              </button>
            </div>

            <dl className="details-grid" style={{ marginBottom: 12 }}>
              <div>
                <dt>Query Type</dt>
                <dd className="mono">{selectedLog.query_type}</dd>
              </div>
              <div>
                <dt>Execution Time</dt>
                <dd className="mono">
                  {Number(selectedLog.execution_time_ms || 0).toFixed(3)} ms
                </dd>
              </div>
              <div>
                <dt>Rows Examined / Returned</dt>
                <dd className="mono">
                  {selectedLog.rows_examined} / {selectedLog.rows_returned}
                </dd>
              </div>
              <div>
                <dt>API Endpoint</dt>
                <dd className="mono">{selectedLog.endpoint || "-"}</dd>
              </div>
            </dl>

            <pre
              className="mono"
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 8,
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 12,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedLog.query_text || "No SQL text captured"}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
