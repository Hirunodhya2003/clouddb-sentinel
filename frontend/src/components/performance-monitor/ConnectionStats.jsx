// Owner: Member 09
// MySQL Server Connection & Table Storage Statistics component.

function formatUptime(seconds = 0) {
  const s = Number(seconds || 0);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

export default function ConnectionStats({
  connections,
  tableStats = [],
  loading = false,
}) {
  if (loading && !connections) {
    return (
      <div className="card muted" role="status">
        Loading database connection statistics...
      </div>
    );
  }

  if (!connections) {
    return (
      <div className="card muted" role="status">
        Connection telemetry is currently unavailable.
      </div>
    );
  }

  const utilPct = Math.min(
    100,
    Math.max(0, Number(connections.connection_utilization_pct || 0))
  );
  const highLoad = utilPct >= 80;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card" aria-label="Database connection metrics">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
              Database Connection Pool &amp; Server Status
            </h3>
            <p className="muted mono" style={{ margin: 0, fontSize: 12 }}>
              Engine: {connections.mysql_version} · Uptime:{" "}
              {formatUptime(connections.uptime_seconds)}
            </p>
          </div>
          <span
            className="badge"
            style={
              highLoad
                ? { background: "#fbeceb", color: "var(--danger, #c0392b)" }
                : { background: "#e4f4ec", color: "var(--success, #1f8a52)" }
            }
          >
            {utilPct.toFixed(1)}% Pool Used
          </span>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "#eef2fa",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: `${Math.max(2, utilPct)}%`,
              height: "100%",
              background: highLoad ? "var(--danger, #c0392b)" : "#3055e7",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Threads Connected</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {connections.threads_connected} / {connections.max_connections}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Threads Running</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {connections.threads_running}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Peak Used Connections</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {connections.max_used_connections}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Total Queries</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {Number(connections.questions || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Server Slow Queries</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {connections.slow_queries_count}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--bg, #f5f7fb)" }}>
            <div className="muted" style={{ fontSize: 11 }}>Aborted Connects</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
              {connections.aborted_connects}
            </div>
          </div>
        </div>
      </section>

      {tableStats.length > 0 && (
        <section className="card" aria-label="Database table storage statistics">
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
            Table &amp; Index Storage Statistics
          </h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Table Name</th>
                  <th>Engine</th>
                  <th style={{ textAlign: "right" }}>Est. Rows</th>
                  <th style={{ textAlign: "right" }}>Data (MB)</th>
                  <th style={{ textAlign: "right" }}>Index (MB)</th>
                  <th style={{ textAlign: "right" }}>Total (MB)</th>
                </tr>
              </thead>
              <tbody>
                {tableStats.slice(0, 12).map((tbl) => (
                  <tr key={tbl.table_name}>
                    <td className="mono">{tbl.table_name}</td>
                    <td>{tbl.engine}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(tbl.table_rows || 0).toLocaleString()}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(tbl.data_size_mb || 0).toFixed(3)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(tbl.index_size_mb || 0).toFixed(3)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(tbl.total_size_mb || 0).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
