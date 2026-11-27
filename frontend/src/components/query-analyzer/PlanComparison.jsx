// Owner: Member 09
// Smart Side-by-Side SQL Execution Plan Comparison with Visual Scan Reduction Bars.

import { useState } from "react";
import ExplainViewer from "./ExplainViewer.jsx";

export default function PlanComparison({ comparison }) {
  const [layoutMode, setLayoutMode] = useState("split"); // "split" | "stacked"

  if (!comparison) {
    return (
      <div
        className="card"
        role="status"
        style={{
          textAlign: "center",
          padding: "32px 20px",
          background: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 6 }}>
          Side-by-Side Execution Plan Benchmark
        </strong>
        <span className="muted">
          Provide both a baseline SQL query and an optimized SQL query to compare
          estimated rows examined, index access paths, and execution latency.
        </span>
      </div>
    );
  }

  const isOptimizedWinner = comparison.winner === "optimized";
  const origRows = Math.max(0, Number(comparison.original?.total_estimated_rows || 0));
  const optRows = Math.max(0, Number(comparison.optimized?.total_estimated_rows || 0));
  const maxRows = Math.max(1, origRows, optRows);

  const origTime = Number(comparison.original?.execution_time_ms || 0);
  const optTime = Number(comparison.optimized?.execution_time_ms || 0);
  const speedupFactor =
    optTime > 0 && origTime > 0 ? (origTime / optTime).toFixed(2) : "1.00";

  const origAccess =
    (comparison.original?.steps || []).map((s) => s.access_type).join(" → ") || "-";
  const optAccess =
    (comparison.optimized?.steps || []).map((s) => s.access_type).join(" → ") || "-";

  return (
    <div style={{ display: "grid", gap: 16 }} aria-label="Execution plan comparison">
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${
            isOptimizedWinner ? "#1f8a52" : "#2c5fd8"
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
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Plan Comparison Summary</h3>
            <span className="badge badge-active">
              Winner: {comparison.winner.toUpperCase()}
            </span>
            {Number(speedupFactor) > 1.05 && (
              <span
                className="badge"
                style={{ background: "#e8eeff", color: "#243e9d" }}
              >
                {speedupFactor}x Faster Plan
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Comparison layout">
            <button
              type="button"
              onClick={() => setLayoutMode("split")}
              className={`btn ${layoutMode === "split" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("stacked")}
              className={`btn ${layoutMode === "stacked" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Stacked
            </button>
          </div>
        </div>

        <p style={{ margin: "0 0 14px", color: "#334155" }}>{comparison.summary}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
            gap: 10,
            marginBottom: 16,
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
              Access Path Upgrade
            </div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
              {origAccess} → <span style={{ color: "#1f8a52" }}>{optAccess}</span>
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
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3 }}>
              {comparison.access_improved ? "Yes (Scan Eliminated)" : "Unchanged"}
            </div>
          </div>
        </div>

        {/* Visual Row Scan Comparison Bars */}
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#f8faff",
            border: "1px solid #e2e8f5",
            display: "grid",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>Baseline Query Estimated Rows Examined</span>
              <span className="mono">{origRows.toLocaleString()} rows</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(3, (origRows / maxRows) * 100)}%`,
                  height: "100%",
                  background: "#c0392b",
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>Optimized Query Estimated Rows Examined</span>
              <span className="mono">{optRows.toLocaleString()} rows</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(3, (optRows / maxRows) * 100)}%`,
                  height: "100%",
                  background: "#1f8a52",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            layoutMode === "split"
              ? "repeat(auto-fit, minmax(340px, 1fr))"
              : "1fr",
          gap: 16,
        }}
      >
        <ExplainViewer result={comparison.original} title="Baseline Query Plan" />
        <ExplainViewer result={comparison.optimized} title="Optimized Query Plan" />
      </div>
    </div>
  );
}
