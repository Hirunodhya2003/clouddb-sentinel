// Owner: Member 09
// Application & Database Slow Query Performance Log Table component.

export default function SlowQueryTable({
  queries = [],
  slowOnly = false,
  onSlowOnlyChange,
  minDurationMs = "",
  onMinDurationChange,
  loading = false,
}) {
  return (
    <section className="card" aria-label="Query performance log table">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            Application SQL telemetry stored in <code>query_performance_logs</code>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {onMinDurationChange && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span className="muted">Min ms:</span>
              <input
                type="number"
                min="0"
                step="10"
                aria-label="Minimum duration ms"
                value={minDurationMs}
                onChange={(e) => onMinDurationChange(e.target.value)}
                style={{ width: 90, padding: "5px 8px" }}
              />
            </label>
          )}
          {onSlowOnlyChange && (
            <label className="inline-check" style={{ fontSize: 13, cursor: "pointer" }}>
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
      ) : queries.length === 0 ? (
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
                <th>Endpoint</th>
                <th>Query Preview</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q.log_id}>
                  <td className="mono">#{q.log_id}</td>
                  <td>
                    <span className="key-tag key-fk">{q.query_type}</span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={
                        q.is_slow_query
                          ? { background: "#fbeceb", color: "var(--danger, #c0392b)" }
                          : { background: "#e4f4ec", color: "var(--success, #1f8a52)" }
                      }
                    >
                      {q.is_slow_query ? "SLOW" : "FAST"}
                    </span>
                  </td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    {Number(q.execution_time_ms || 0).toFixed(2)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {Number(q.rows_examined || 0).toLocaleString()}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {Number(q.rows_returned || 0).toLocaleString()}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {q.endpoint || "-"}
                  </td>
                  <td
                    className="mono"
                    style={{
                      maxWidth: 320,
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
