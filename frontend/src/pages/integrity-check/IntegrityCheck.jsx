// Owner: Member 06
// TODO: implement
import { useEffect, useRef, useState } from "react";

import TestResultTable from "../../components/integrity-check/TestResultTable";
import {
  getIntegrityResults,
  runIntegrityChecks,
} from "../../services/integrityCheckService";

const checks = [
  { value: "required_name", label: "Required customer name" },
  { value: "unique_email", label: "Unique email" },
  { value: "valid_status", label: "Valid customer status" },
];

export default function IntegrityCheck() {
  const [selectedChecks, setSelectedChecks] = useState(
    checks.map((check) => check.value),
  );
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const inProgress = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResults() {
      try {
        const records = await getIntegrityResults(controller.signal);

        if (!controller.signal.aborted) {
          setResults(records);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => controller.abort();
  }, []);

  function toggleCheck(value) {
    setSelectedChecks((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  }

  async function handleRun() {
    if (inProgress.current || selectedChecks.length === 0) return;

    inProgress.current = true;
    setRunning(true);
    setError("");

    try {
      const response = await runIntegrityChecks(selectedChecks);

      setSummary(response);
      setResults(response.results);
    } catch (error) {
      setError(error.message);
    } finally {
      inProgress.current = false;
      setRunning(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>Integrity Check</h1>
        <p>Test customer database constraints and review results.</p>
      </div>

      {error && <p role="alert">{error}</p>}

      <section className="directory-card">
        <h2>Customer constraint checks</h2>

        <fieldset className="integrity-options" disabled={loading || running}>
          <legend>Select checks</legend>

          {checks.map((check) => (
            <label key={check.value}>
              <input
                type="checkbox"
                checked={selectedChecks.includes(check.value)}
                onChange={() => toggleCheck(check.value)}
              />
              {check.label}
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className="primary-button"
          disabled={loading || running || selectedChecks.length === 0}
          onClick={handleRun}
        >
          {running ? "Running checks..." : "Run integrity checks"}
        </button>

        {running && <p role="status">Testing database constraints...</p>}
      </section>

      {summary && (
        <div className="integrity-summary" role="status">
          <span>Total: {summary.total}</span>
          <span>Passed: {summary.passed}</span>
          <span>Failed: {summary.failed}</span>
          <span>Errors: {summary.errors}</span>
        </div>
      )}

      <section className="directory-card integrity-results">
        <h2>Constraint test results</h2>
        <p className="section-description">
          {summary
            ? "Results from the latest run on this page."
            : "Up to 100 recent saved results."}
        </p>

        {loading ? (
          <p role="status">Loading results...</p>
        ) : (
          <TestResultTable results={results} />
        )}
      </section>
    </>
  );
}
