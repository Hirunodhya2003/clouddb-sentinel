// Owner: Member 09
// SQL Query Optimization, EXPLAIN, EXPLAIN ANALYZE, and Plan Comparison page.

import { useEffect, useState } from "react";
import ExplainViewer from "../../components/query-analyzer/ExplainViewer.jsx";
import PlanComparison from "../../components/query-analyzer/PlanComparison.jsx";
import {
  compareQueryPlans,
  explainQuery,
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

  useEffect(() => {
    getPresetScenarios()
      .then((items) => setPresets(Array.isArray(items) ? items : []))
      .catch(() => setPresets([]));

    getAnalyzedQueryHistory(10)
      .then((items) => setHistory(Array.isArray(items) ? items : []))
      .catch(() => setHistory([]));
  }, []);

  const handlePresetSelect = (scenarioId) => {
    setSelectedPresetId(scenarioId);
    const match = presets.find((p) => p.scenario_id === scenarioId);
    if (!match) return;
    setSqlInput(match.optimized_sql);
    setOriginalSql(match.unoptimized_sql);
    setOptimizedSql(match.optimized_sql);
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header className="page-header page-header-row">
        <div>
          <h1>Query Analyzer &amp; Optimizer</h1>
          <p>
            Inspect MySQL EXPLAIN and EXPLAIN ANALYZE execution plans, detect full
            table scans, and compare query optimizations side by side.
          </p>
        </div>

        {presets.length > 0 && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span className="muted">Load ADBMS Benchmark Scenario</span>
            <select
              aria-label="Preset Scenario"
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
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

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {modeTab === "single" ? (
        <>
          <form className="card" onSubmit={handleRunExplain}>
            <div className="form-field">
              <label htmlFor="qa-sql-input">Read-Only SELECT Query</label>
              <textarea
                id="qa-sql-input"
                aria-label="SQL Query"
                className="mono"
                rows={5}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
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

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Analyzing..." : "Run EXPLAIN"}
              </button>
            </div>
          </form>

          <ExplainViewer result={singleResult} />
        </>
      ) : (
        <>
          <form className="card" onSubmit={handleRunCompare}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="qa-orig-sql">Baseline (Unoptimized) SELECT Query</label>
                <textarea
                  id="qa-orig-sql"
                  aria-label="Baseline SQL Query"
                  className="mono"
                  rows={6}
                  value={originalSql}
                  onChange={(e) => setOriginalSql(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="qa-opt-sql">Candidate (Optimized) SELECT Query</label>
                <textarea
                  id="qa-opt-sql"
                  aria-label="Optimized SQL Query"
                  className="mono"
                  rows={6}
                  value={optimizedSql}
                  onChange={(e) => setOptimizedSql(e.target.value)}
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
          <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Recent Analyzer Runs</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mode</th>
                  <th style={{ textAlign: "right" }}>Time (ms)</th>
                  <th style={{ textAlign: "right" }}>Est. Rows</th>
                  <th>SQL Query</th>
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
