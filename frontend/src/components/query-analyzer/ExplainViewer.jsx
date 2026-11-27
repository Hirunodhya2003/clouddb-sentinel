// Owner: Member 09
// Smart MySQL EXPLAIN & EXPLAIN ANALYZE Execution Plan Pipeline & Cost Inspector.

import { useState } from "react";

function accessBadgeStyle(accessType = "") {
  const upper = String(accessType).toUpperCase();
  if (upper === "ALL") {
    return { background: "#fbeceb", color: "#c0392b", border: "1px solid #f2c6c2" };
  }
  if (["CONST", "SYSTEM", "EQ_REF", "REF", "RANGE"].includes(upper)) {
    return { background: "#e4f4ec", color: "#1f8a52", border: "1px solid #bce3cf" };
  }
  return { background: "#fdf3dc", color: "#b7791f", border: "1px solid #f5dfa6" };
}

function computePlanEfficiencyScore(result) {
  if (!result) return 100;
  let score = 96;
  if (result.uses_full_table_scan) score -= 35;
  if (result.uses_filesort) score -= 15;
  if (result.uses_temp_table) score -= 15;
  const rows = Number(result.total_estimated_rows || 0);
  if (rows > 1000) score -= 18;
  else if (rows > 200) score -= 8;
  return Math.max(15, Math.min(100, score));
}

export default function ExplainViewer({ result, title = "Execution Plan" }) {
  const [copiedTree, setCopiedTree] = useState(false);
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);

  if (!result) {
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
          Ready for Query Plan Inspection
        </strong>
        <span className="muted">
          Enter a read-only SELECT query and click Run EXPLAIN to inspect the MySQL
          8.0 optimizer execution pipeline.
        </span>
      </div>
    );
  }

  const steps = result.steps || [];
  const suggestions = result.optimization_suggestions || [];
  const efficiency = computePlanEfficiencyScore(result);
  const scoreColor =
    efficiency >= 80 ? "#1f8a52" : efficiency >= 55 ? "#d97706" : "#c0392b";

  const copyAnalyzeTree = () => {
    if (!result.analyze_tree || !navigator?.clipboard) return;
    navigator.clipboard.writeText(result.analyze_tree).then(() => {
      setCopiedTree(true);
      setTimeout(() => setCopiedTree(false), 1800);
    });
  };

  return (
    <section className="card" aria-label={title}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{title}</h3>
          <p className="muted mono" style={{ margin: 0, fontSize: 11 }}>
            Mode: {result.mode} · Est. rows: {result.total_estimated_rows} · Time:{" "}
            {Number(result.execution_time_ms || 0).toFixed(3)} ms
            {result.query_fingerprint
              ? ` · Digest: ${String(result.query_fingerprint).slice(0, 12)}…`
              : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span
            className="badge"
            style={{
              background: "#f1f5f9",
              color: scoreColor,
              border: `1px solid ${scoreColor}33`,
              fontWeight: 700,
            }}
          >
            Optimizer Score: {efficiency}/100
          </span>
          <span
            className="badge"
            style={
              result.uses_full_table_scan
                ? { background: "#fbeceb", color: "#c0392b" }
                : { background: "#e4f4ec", color: "#1f8a52" }
            }
          >
            {result.uses_full_table_scan ? "Full Table Scan" : "Index Access"}
          </span>
          {result.uses_filesort && (
            <span
              className="badge"
              style={{ background: "#fdf3dc", color: "#b7791f" }}
            >
              Filesort
            </span>
          )}
          {result.uses_temp_table && (
            <span
              className="badge"
              style={{ background: "#fdf3dc", color: "#b7791f" }}
            >
              Temp Table
            </span>
          )}
        </div>
      </div>

      {/* Visual Execution Pipeline Flow */}
      {steps.length > 0 && (
        <div
          aria-label="Visual query pipeline"
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 10,
            overflowX: "auto",
            padding: "12px 14px",
            marginBottom: 16,
            borderRadius: 10,
            background: "#f8faff",
            border: "1px solid #e2e8f5",
          }}
        >
          {steps.map((step, idx) => {
            const isScan = String(step.access_type || "").toUpperCase() === "ALL";
            const isSelected = selectedStepIdx === idx;
            return (
              <div
                key={`node-${step.step_id}-${idx}`}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  onClick={() => setSelectedStepIdx(idx)}
                  style={{
                    minWidth: 175,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: isSelected
                      ? "2px solid #3055e7"
                      : `1px solid ${isScan ? "#f2c6c2" : "#dbe3f0"}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    <span className="muted">Step #{step.step_id}</span>
                    <span
                      className="badge"
                      style={{
                        ...accessBadgeStyle(step.access_type),
                        fontSize: 10,
                        padding: "1px 7px",
                      }}
                    >
                      {step.access_type}
                    </span>
                  </div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                    {step.table_name || "derived"}
                  </div>
                  <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                    Key: {step.key_used || "None"} · ~{step.rows_estimated} rows
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{ fontWeight: 700, color: "#64748b", fontSize: 16 }}
                  >
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

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
              <tr
                key={`${step.step_id}-${step.table_name || idx}`}
                onClick={() => setSelectedStepIdx(idx)}
                style={{
                  background: selectedStepIdx === idx ? "#f4f7ff" : undefined,
                  cursor: "pointer",
                }}
              >
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
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 13 }}>
              EXPLAIN ANALYZE Iterator Execution Tree
            </h4>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={copyAnalyzeTree}
              style={{ padding: "3px 9px", fontSize: 11 }}
            >
              {copiedTree ? "Copied!" : "Copy Tree"}
            </button>
          </div>
          <pre
            className="mono"
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 10,
              background: "#0f172a",
              color: "#e2e8f0",
              fontSize: 12,
              lineHeight: 1.55,
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
          <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>
            ADBMS Optimizer Recommendations
          </h4>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 8,
            }}
          >
            {suggestions.map((tip, idx) => (
              <li
                key={idx}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: result.uses_full_table_scan ? "#fff9eb" : "#f0fdf4",
                  border: `1px solid ${
                    result.uses_full_table_scan ? "#fde68a" : "#bbf7d0"
                  }`,
                  fontSize: 13,
                }}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
