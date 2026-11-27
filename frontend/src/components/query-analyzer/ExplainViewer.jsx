// Owner: Member 09
// MySQL EXPLAIN & EXPLAIN ANALYZE execution plan viewer component.

function accessBadgeStyle(accessType = "") {
  const upper = String(accessType).toUpperCase();
  if (upper === "ALL") {
    return { background: "#fbeceb", color: "var(--danger, #c0392b)" };
  }
  if (["CONST", "SYSTEM", "EQ_REF", "REF", "RANGE"].includes(upper)) {
    return { background: "#e4f4ec", color: "var(--success, #1f8a52)" };
  }
  return { background: "#fdf3dc", color: "var(--warning, #b7791f)" };
}

export default function ExplainViewer({ result, title = "Execution Plan" }) {
  if (!result) {
    return (
      <div className="card muted" role="status">
        Enter a read-only SELECT query and click Run EXPLAIN to inspect the optimizer plan.
      </div>
    );
  }

  const steps = result.steps || [];
  const suggestions = result.optimization_suggestions || [];

  return (
    <section className="card" aria-label={title}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{title}</h3>
          <p className="muted mono" style={{ margin: 0, fontSize: 11 }}>
            Mode: {result.mode} · Est. rows: {result.total_estimated_rows} · Time:{" "}
            {Number(result.execution_time_ms || 0).toFixed(3)} ms
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span
            className="badge"
            style={
              result.uses_full_table_scan
                ? { background: "#fbeceb", color: "var(--danger, #c0392b)" }
                : { background: "#e4f4ec", color: "var(--success, #1f8a52)" }
            }
          >
            {result.uses_full_table_scan ? "Full Table Scan" : "Index Access"}
          </span>
          {result.uses_filesort && (
            <span
              className="badge"
              style={{ background: "#fdf3dc", color: "var(--warning, #b7791f)" }}
            >
              Filesort
            </span>
          )}
          {result.uses_temp_table && (
            <span
              className="badge"
              style={{ background: "#fdf3dc", color: "var(--warning, #b7791f)" }}
            >
              Temp Table
            </span>
          )}
        </div>
      </div>

      <div className="table-wrap" style={{ marginBottom: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Select Type</th>
              <th>Table</th>
              <th>Access Type</th>
              <th>Possible Keys</th>
              <th>Key Used</th>
              <th style={{ textAlign: "right" }}>Est. Rows</th>
              <th style={{ textAlign: "right" }}>Filtered %</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => (
              <tr key={`${step.step_id}-${step.table_name || idx}`}>
                <td>{step.step_id}</td>
                <td className="mono">{step.select_type}</td>
                <td className="mono">{step.table_name || "-"}</td>
                <td>
                  <span className="badge" style={accessBadgeStyle(step.access_type)}>
                    {step.access_type}
                  </span>
                </td>
                <td className="mono">{step.possible_keys || "-"}</td>
                <td className="mono">
                  <strong>{step.key_used || "None"}</strong>
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {step.rows_estimated}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {Number(step.filtered_pct ?? 100).toFixed(1)}%
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {step.extra || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.analyze_tree && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: 13 }}>EXPLAIN ANALYZE Tree</h4>
          <pre
            className="mono"
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 8,
              background: "#151d2f",
              color: "#e6eefc",
              fontSize: 12,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.analyze_tree}
          </pre>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: 13 }}>Optimization Recommendations</h4>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
            {suggestions.map((tip, idx) => (
              <li key={idx} style={{ fontSize: 13 }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
