// Owner: Member 09
// Smart ADBMS SQL Query Optimization, Live Heuristics, EXPLAIN, EXPLAIN ANALYZE & Plan Comparison Workbench.

import { useEffect, useMemo, useState } from "react";
import ExplainViewer from "../../components/query-analyzer/ExplainViewer.jsx";
import PlanComparison from "../../components/query-analyzer/PlanComparison.jsx";
import {
  DEMO_PRESET_SCENARIOS,
  analyzeSqlHeuristics,
  compareQueryPlans,
  explainQuery,
  formatSqlReadability,
  getAnalyzedQueryHistory,
  getPresetScenarios,
} from "../../services/queryAnalyzerService.js";

const DEFAULT_SQL = `SELECT sale_id, invoice_number, sale_date, total_amount
FROM sales
WHERE sale_date >= '2026-01-01'
  AND sale_date < '2027-01-01'
  AND status = 'COMPLETED'
ORDER BY sale_date DESC`;

const DEFAULT_UNOPTIMIZED_SQL = `SELECT * FROM sales
WHERE status = 'COMPLETED'
  AND SUBSTR(CAST(sale_date AS CHAR), 1, 4) = '2026'
ORDER BY sale_date DESC`;

function findingBadgeStyle(level) {
  if (level === "critical") return { background: "#fbeceb", color: "#c0392b" };
  if (level === "warning") return { background: "#fdf3dc", color: "#b7791f" };
  if (level === "optimal") return { background: "#e4f4ec", color: "#1f8a52" };
  return { background: "#e8eeff", color: "#243e9d" };
}

export default function QueryAnalyzer() {
  const [modeTab, setModeTab] = useState("single");
  const [analyzeFlag, setAnalyzeFlag] = useState(false);

  const [sqlInput, setSqlInput] = useState(DEFAULT_SQL);
  const [originalSql, setOriginalSql] = useState(DEFAULT_UNOPTIMIZED_SQL);
  const [optimizedSql, setOptimizedSql] = useState(DEFAULT_SQL);

  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const [singleResult, setSingleResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedFlag, setCopiedFlag] = useState(false);

  useEffect(() => {
    getPresetScenarios()
      .then((items) =>
        setPresets(
          Array.isArray(items) && items.length > 0
            ? items
            : DEMO_PRESET_SCENARIOS
        )
      )
      .catch(() => setPresets(DEMO_PRESET_SCENARIOS));

    getAnalyzedQueryHistory(10)
      .then((items) => setHistory(Array.isArray(items) ? items : []))
      .catch(() => setHistory([]));
  }, []);

  const liveHeuristics = useMemo(
    () =>
      analyzeSqlHeuristics(modeTab === "single" ? sqlInput : optimizedSql),
    [modeTab, sqlInput, optimizedSql]
  );

  const handlePresetSelect = (scenarioId) => {
    setSelectedPresetId(scenarioId);
    const match = presets.find((p) => p.scenario_id === scenarioId);
    if (!match) return;
    setSqlInput(match.optimized_sql);
    setOriginalSql(match.unoptimized_sql);
    setOptimizedSql(match.optimized_sql);
    setError("");
  };

  const handleFormatActiveSql = () => {
    if (modeTab === "single") {
      setSqlInput((prev) => formatSqlReadability(prev));
    } else {
      setOriginalSql((prev) => formatSqlReadability(prev));
      setOptimizedSql((prev) => formatSqlReadability(prev));
    }
  };

  const handleCopySql = () => {
    if (!navigator?.clipboard) return;
    const text = modeTab === "single" ? sqlInput : optimizedSql;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 1600);
    });
  };

  const handleRunExplain = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await explainQuery({ sql: sqlInput, analyze: analyzeFlag });
      setSingleResult(res);
      const updatedHistory = await getAnalyzedQueryHistory(10).catch(() => []);
      setHistory(Array.isArray(updatedHistory) ? updatedHistory : []);
    } catch (err) {
      setError(err.message || "Unable to analyze query.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCompare = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await compareQueryPlans({
        original_sql: originalSql,
        optimized_sql: optimizedSql,
        analyze: analyzeFlag,
      });
      setComparisonResult(res);
    } catch (err) {
      setError(err.message || "Unable to compare query plans.");
    } finally {
      setLoading(false);
    }
  };

  const activePreset = presets.find((p) => p.scenario_id === selectedPresetId);

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
            ADBMS Query Optimization Workbench
          </p>
          <h1 style={{ margin: "0 0 6px", color: "#ffffff", fontSize: 24 }}>
            Query Analyzer &amp; Optimizer
          </h1>
          <p style={{ margin: 0, color: "#dbe6ff", fontSize: 13 }}>
            Inspect MySQL 8.0 EXPLAIN and EXPLAIN ANALYZE execution plans, run
            live sargability diagnostics, and benchmark optimizations side by side.
          </p>
        </div>

        {presets.length > 0 && (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 12,
              minWidth: 250,
            }}
          >
            <span style={{ color: "#cbd5e1", fontWeight: 600 }}>
              Load ADBMS Benchmark Scenario
            </span>
            <select
              aria-label="Preset Scenario"
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                fontWeight: 500,
              }}
            >
              <option value="">Custom SQL Query</option>
              {presets.map((preset) => (
                <option key={preset.scenario_id} value={preset.scenario_id}>
                  {preset.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {activePreset && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            background: "#f4f7ff",
            borderColor: "#c7d7fe",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              className="badge"
              style={{
                background: "#3055e7",
                color: "#fff",
                marginRight: 8,
                fontSize: 11,
              }}
            >
              {activePreset.category}
            </span>
            <strong style={{ fontSize: 13 }}>{activePreset.title}:</strong>{" "}
            <span style={{ fontSize: 13, color: "#334155" }}>
              {activePreset.description}
            </span>
          </div>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Analyzer mode">
        <button
          type="button"
          role="tab"
          aria-selected={modeTab === "single"}
          className={`tab ${modeTab === "single" ? "active" : ""}`}
          onClick={() => setModeTab("single")}
        >
          EXPLAIN Inspector
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modeTab === "compare"}
          className={`tab ${modeTab === "compare" ? "active" : ""}`}
          onClick={() => setModeTab("compare")}
        >
          Before vs After Plan Comparison
        </button>
      </div>

      {/* Live Static SQL Heuristics Guardrail Banner */}
      {liveHeuristics.findings.length > 0 && (
        <section
          className="card"
          aria-label="Live SQL lint heuristics"
          style={{ padding: "12px 16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 13 }}>
              Live SQL Sargability &amp; Safety Check
            </strong>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
              Static Readiness: {liveHeuristics.score}/100
            </span>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {liveHeuristics.findings.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span
                  className="badge"
                  style={{ ...findingBadgeStyle(f.level), fontSize: 10 }}
                >
                  {f.rule}
                </span>
                <span style={{ color: "#334155" }}>{f.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {modeTab === "single" ? (
        <>
          <form className="card" onSubmit={handleRunExplain}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <label htmlFor="qa-sql-input" style={{ fontWeight: 600, fontSize: 13 }}>
                Read-Only SELECT Query
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleFormatActiveSql}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Format SQL
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopySql}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  {copiedFlag ? "Copied!" : "Copy SQL"}
                </button>
              </div>
            </div>

            <div className="form-field">
              <textarea
                id="qa-sql-input"
                aria-label="SQL Query"
                className="mono"
                rows={6}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                style={{
                  background: "#0f172a",
                  color: "#f8fafc",
                  borderRadius: 10,
                  padding: 14,
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <label className="inline-check" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={analyzeFlag}
                  onChange={(e) => setAnalyzeFlag(e.target.checked)}
                />
                <span>Include EXPLAIN ANALYZE execution tree &amp; actual timing</span>
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !liveHeuristics.validSelect}
              >
                {loading ? "Analyzing..." : "Run EXPLAIN"}
              </button>
            </div>
          </form>

          <ExplainViewer result={singleResult} />
        </>
      ) : (
        <>
          <form className="card" onSubmit={handleRunCompare}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: 14 }}>
                Compare Candidate SQL Rewrites
              </strong>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleFormatActiveSql}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Format Both Queries
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="qa-orig-sql">
                  Baseline (Unoptimized) SELECT Query
                </label>
                <textarea
                  id="qa-orig-sql"
                  aria-label="Baseline SQL Query"
                  className="mono"
                  rows={6}
                  value={originalSql}
                  onChange={(e) => setOriginalSql(e.target.value)}
                  style={{
                    background: "#1e1b2e",
                    color: "#f8fafc",
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="qa-opt-sql">
                  Candidate (Optimized) SELECT Query
                </label>
                <textarea
                  id="qa-opt-sql"
                  aria-label="Optimized SQL Query"
                  className="mono"
                  rows={6}
                  value={optimizedSql}
                  onChange={(e) => setOptimizedSql(e.target.value)}
                  style={{
                    background: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: 10,
                    padding: 12,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <label className="inline-check" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={analyzeFlag}
                  onChange={(e) => setAnalyzeFlag(e.target.checked)}
                />
                <span>Run with EXPLAIN ANALYZE</span>
              </label>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Comparing..." : "Compare Plans"}
              </button>
            </div>
          </form>

          <PlanComparison comparison={comparisonResult} />
        </>
      )}

      {history.length > 0 && (
        <section className="card" aria-label="Recent analyzed queries">
          <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>
            Recent Analyzer Runs (Click to Load)
          </h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th style={{ textAlign: "right" }}>Time (ms)</th>
                  <th style={{ textAlign: "right" }}>Est. Rows</th>
                  <th>SQL Query</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((item) => (
                  <tr key={item.log_id}>
                    <td>
                      <span className="key-tag key-fk">{item.query_type}</span>
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(item.execution_time_ms || 0).toFixed(3)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {item.rows_examined}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {item.query_text}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                          if (item.query_text) {
                            setModeTab("single");
                            setSqlInput(item.query_text);
                          }
                        }}
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        Load SQL
                      </button>
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
