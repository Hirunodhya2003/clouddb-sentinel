// Owner: Member 09
// Smart MySQL Connection Pool Radial Gauge & InnoDB Storage Footprint Explorer.

import { useMemo, useState } from "react";

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
  const [tableSearch, setTableSearch] = useState("");
  const [sortBy, setSortBy] = useState("total_size_mb");

  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const list = tableStats.filter(
      (t) => !q || String(t.table_name || "").toLowerCase().includes(q)
    );
    return [...list].sort(
      (a, b) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0)
    );
  }, [tableStats, tableSearch, sortBy]);

  const storageSummary = useMemo(() => {
    const dataMb = tableStats.reduce((s, t) => s + Number(t.data_size_mb || 0), 0);
    const indexMb = tableStats.reduce((s, t) => s + Number(t.index_size_mb || 0), 0);
    const totalRows = tableStats.reduce((s, t) => s + Number(t.table_rows || 0), 0);
    return { dataMb, indexMb, totalMb: dataMb + indexMb, totalRows };
  }, [tableStats]);

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
  const avgQps =
    Number(connections.uptime_seconds || 0) > 0
      ? (
          Number(connections.questions || 0) /
          Number(connections.uptime_seconds || 1)
        ).toFixed(2)
      : "0.00";

  // Radial gauge geometry
  const gaugeR = 52;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeFill = (utilPct / 100) * gaugeCirc;

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
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
              Database Connection Pool &amp; Server Status
            </h3>
            <p className="muted mono" style={{ margin: 0, fontSize: 12 }}>
              Engine: {connections.mysql_version} · Uptime:{" "}
              {formatUptime(connections.uptime_seconds)} · Avg throughput:{" "}
              {avgQps} queries/s
            </p>
          </div>
          <span
            className="badge"
            style={
              highLoad
                ? { background: "#fbeceb", color: "#c0392b" }
                : { background: "#e4f4ec", color: "#1f8a52" }
            }
          >
            {utilPct.toFixed(1)}% Pool Used
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "148px 1fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          <svg
            width="136"
            height="136"
            viewBox="0 0 140 140"
            role="img"
            aria-label="MySQL connection pool radial gauge"
          >
            <circle
              cx="70"
              cy="70"
              r={gaugeR}
              fill="none"
              stroke="#eef2fa"
              strokeWidth="14"
            />
            <circle
              cx="70"
              cy="70"
              r={gaugeR}
              fill="none"
              stroke={highLoad ? "#c0392b" : "#3055e7"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(4, gaugeFill)} ${gaugeCirc}`}
              transform="rotate(-90 70 70)"
            />
            <text
              x="70"
              y="66"
              textAnchor="middle"
              fontSize="18"
              fontWeight="750"
              fill="#0f172a"
            >
              {utilPct.toFixed(1)}%
            </text>
            <text
              x="70"
              y="84"
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              Pool Load
            </text>
          </svg>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Threads Connected</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {connections.threads_connected} / {connections.max_connections}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Threads Running</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {connections.threads_running}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Peak Used Connections</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {connections.max_used_connections}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Total Queries</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {Number(connections.questions || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Server Slow Queries</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {connections.slow_queries_count}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--bg, #f5f7fb)" }}>
              <div className="muted" style={{ fontSize: 11 }}>Aborted Connects</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {connections.aborted_connects}
              </div>
            </div>
          </div>
        </div>
      </section>

      {tableStats.length > 0 && (
        <section className="card" aria-label="Database table storage statistics">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
                Table &amp; Index Storage Statistics
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                {tableStats.length} tables · {storageSummary.totalRows.toLocaleString()} est. rows ·{" "}
                {storageSummary.totalMb.toFixed(3)} MB total ({storageSummary.dataMb.toFixed(3)} MB data +{" "}
                {storageSummary.indexMb.toFixed(3)} MB indexes)
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="search"
                aria-label="Search table storage"
                placeholder="Filter table name..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{ padding: "5px 10px", fontSize: 12 }}
              />
              <select
                aria-label="Sort tables by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: "5px 8px", fontSize: 12 }}
              >
                <option value="total_size_mb">Sort: Total Size</option>
                <option value="table_rows">Sort: Est. Rows</option>
                <option value="index_size_mb">Sort: Index Size</option>
              </select>
            </div>
          </div>

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
                  <th>Data / Index Mix</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.slice(0, 15).map((tbl) => {
                  const total = Math.max(0.0001, Number(tbl.total_size_mb || 0));
                  const dataShare = Math.min(
                    100,
                    Math.round((Number(tbl.data_size_mb || 0) / total) * 100)
                  );
                  return (
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
                      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                        {Number(tbl.total_size_mb || 0).toFixed(3)}
                      </td>
                      <td style={{ minWidth: 110 }}>
                        <div
                          style={{
                            height: 7,
                            borderRadius: 999,
                            background: "#93c5fd",
                            overflow: "hidden",
                          }}
                          title={`Data: ${dataShare}% | Index: ${100 - dataShare}%`}
                        >
                          <div
                            style={{
                              width: `${dataShare}%`,
                              height: "100%",
                              background: "#3055e7",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
