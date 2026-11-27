// Owner: Member 09
// Side-by-side SQL Execution Plan Comparison component.

import ExplainViewer from "./ExplainViewer.jsx";

export default function PlanComparison({ comparison }) {
  if (!comparison) {
    return (
      <div className="card muted" role="status">
        Provide both a baseline SQL query and an optimized SQL query to compare execution plans.
      </div>
    );
  }

  const isOptimizedWinner = comparison.winner === "optimized";

  return (
    <div style={{ display: "grid", gap: 16 }} aria-label="Execution plan comparison">
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${
            isOptimizedWinner ? "var(--success, #1f8a52)" : "var(--blue, #2c5fd8)"
          }`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Plan Comparison Summary</h3>
          <span className="badge badge-active">
            Winner: {comparison.winner.toUpperCase()}
          </span>
        </div>

        <p style={{ margin: "0 0 12px" }}>{comparison.summary}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--bg, #f5f7fb)",
            }}
          >
            <div className="muted" style={{ fontSize: 11 }}>
              Estimated Rows Reduction
            </div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              {Number(comparison.estimated_rows_reduction_pct || 0).toFixed(1)}% (
              {comparison.estimated_rows_delta >= 0 ? "-" : "+"}
              {Math.abs(comparison.estimated_rows_delta)} rows)
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--bg, #f5f7fb)",
            }}
          >
            <div className="muted" style={{ fontSize: 11 }}>
              Execution Time Delta
            </div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              {Number(comparison.execution_time_delta_ms || 0).toFixed(3)} ms
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--bg, #f5f7fb)",
            }}
          >
            <div className="muted" style={{ fontSize: 11 }}>
              Index Access Improved
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              {comparison.access_improved ? "Yes (Scan Eliminated)" : "Unchanged"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        <ExplainViewer result={comparison.original} title="Baseline Query Plan" />
        <ExplainViewer result={comparison.optimized} title="Optimized Query Plan" />
      </div>
    </div>
  );
}
