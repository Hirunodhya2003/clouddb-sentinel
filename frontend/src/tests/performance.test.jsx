// Owner: Member 09
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../services/queryAnalyzerService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getPresetScenarios: vi.fn(),
    explainQuery: vi.fn(),
    compareQueryPlans: vi.fn(),
    getAnalyzedQueryHistory: vi.fn(),
  };
});

vi.mock("../services/performanceMonitorService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getPerformanceOverview: vi.fn(),
    getConnectionStats: vi.fn(),
    getTableStatistics: vi.fn(),
    getSlowQueries: vi.fn(),
    recordQueryLog: vi.fn(),
  };
});

import QueryAnalyzer from "../pages/query-analyzer/QueryAnalyzer.jsx";
import PerformanceMonitor from "../pages/performance-monitor/PerformanceMonitor.jsx";
import {
  analyzeSqlHeuristics,
  compareQueryPlans,
  explainQuery,
  getAnalyzedQueryHistory,
  getPresetScenarios,
} from "../services/queryAnalyzerService.js";
import {
  evaluateDatabaseHealth,
  getPerformanceOverview,
} from "../services/performanceMonitorService.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Member 09 Smart Query Analyzer & Performance Monitor UI", () => {
  it("evaluates static SQL sargability heuristics and blocks mutating statements", () => {
    const unsafe = analyzeSqlHeuristics("DROP TABLE sales");
    expect(unsafe.validSelect).toBe(false);
    expect(unsafe.score).toBe(0);

    const wildcard = analyzeSqlHeuristics(
      "SELECT * FROM sales WHERE invoice_number LIKE '%INV-001%'"
    );
    expect(wildcard.validSelect).toBe(true);
    expect(wildcard.score).toBeLessThan(70);

    const clean = analyzeSqlHeuristics(
      "SELECT sale_id, invoice_number FROM sales WHERE sale_date >= '2026-01-01' LIMIT 25"
    );
    expect(clean.validSelect).toBe(true);
    expect(clean.score).toBe(100);
  });

  it("runs EXPLAIN in QueryAnalyzer and displays visual pipeline steps and suggestions", async () => {
    getPresetScenarios.mockResolvedValueOnce([]);
    getAnalyzedQueryHistory.mockResolvedValue([]);
    explainQuery.mockResolvedValueOnce({
      query_text: "SELECT * FROM inventory WHERE quantity_on_hand <= reorder_level",
      query_fingerprint: "abc123def4567890",
      mode: "EXPLAIN",
      execution_time_ms: 4.25,
      total_estimated_rows: 250,
      uses_index: false,
      uses_full_table_scan: true,
      uses_filesort: false,
      uses_temp_table: false,
      steps: [
        {
          step_id: 1,
          select_type: "SIMPLE",
          table_name: "inventory",
          access_type: "ALL",
          possible_keys: null,
          key_used: null,
          rows_estimated: 250,
          filtered_pct: 33.3,
          extra: "Using where",
        },
      ],
      analyze_tree: null,
      optimization_suggestions: [
        "Full table scan (type=ALL) detected on inventory.",
      ],
      severity: "warning",
    });

    render(<QueryAnalyzer />);

    fireEvent.click(screen.getByRole("button", { name: "Run EXPLAIN" }));

    await waitFor(() => {
      expect(explainQuery).toHaveBeenCalled();
      expect(screen.getByText("Full Table Scan")).toBeInTheDocument();
      expect(
        screen.getByText("Full table scan (type=ALL) detected on inventory.")
      ).toBeInTheDocument();
    });
  });

  it("compares baseline and optimized SQL plans in QueryAnalyzer", async () => {
    getPresetScenarios.mockResolvedValueOnce([]);
    getAnalyzedQueryHistory.mockResolvedValueOnce([]);
    compareQueryPlans.mockResolvedValueOnce({
      winner: "optimized",
      summary:
        "Optimized query improved the execution plan (estimated rows examined reduced by 90.0%).",
      estimated_rows_delta: 90,
      estimated_rows_reduction_pct: 90.0,
      execution_time_delta_ms: 3.1,
      access_improved: true,
      original: {
        mode: "EXPLAIN",
        execution_time_ms: 4.5,
        total_estimated_rows: 100,
        uses_full_table_scan: true,
        uses_filesort: false,
        uses_temp_table: false,
        steps: [
          {
            step_id: 1,
            select_type: "SIMPLE",
            table_name: "sales",
            access_type: "ALL",
            key_used: null,
            rows_estimated: 100,
            filtered_pct: 10,
            extra: "Using where",
          },
        ],
        optimization_suggestions: [],
      },
      optimized: {
        mode: "EXPLAIN",
        execution_time_ms: 1.4,
        total_estimated_rows: 10,
        uses_full_table_scan: false,
        uses_filesort: false,
        uses_temp_table: false,
        steps: [
          {
            step_id: 1,
            select_type: "SIMPLE",
            table_name: "sales",
            access_type: "range",
            key_used: "idx_sales_date",
            rows_estimated: 10,
            filtered_pct: 100,
            extra: "Using index condition",
          },
        ],
        optimization_suggestions: [],
      },
    });

    render(<QueryAnalyzer />);

    fireEvent.click(
      screen.getByRole("tab", { name: "Before vs After Plan Comparison" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Compare Plans" }));

    await waitFor(() => {
      expect(compareQueryPlans).toHaveBeenCalled();
      expect(screen.getByText("Winner: OPTIMIZED")).toBeInTheDocument();
      expect(screen.getByText("idx_sales_date")).toBeInTheDocument();
    });
  });

  it("renders PerformanceMonitor radial gauge, health diagnostics, and SQL log modal", async () => {
    const diag = evaluateDatabaseHealth({
      connections: { connection_utilization_pct: 85, aborted_connects: 0 },
      slow_queries: [{ is_slow_query: true }],
    });
    expect(diag.status).toBe("Critical");

    getPerformanceOverview.mockResolvedValue({
      connections: {
        mysql_version: "8.0.46",
        threads_connected: 6,
        threads_running: 2,
        max_used_connections: 14,
        max_connections: 151,
        connection_utilization_pct: 3.97,
        aborted_connects: 0,
        total_connections: 42,
        uptime_seconds: 7200,
        questions: 1280,
        slow_queries_count: 1,
      },
      table_statistics: [
        {
          table_name: "sales",
          engine: "InnoDB",
          table_rows: 320,
          data_size_mb: 0.125,
          index_size_mb: 0.064,
          total_size_mb: 0.189,
          free_space_mb: 0,
        },
      ],
      slow_queries: [
        {
          log_id: 7,
          query_type: "SELECT",
          execution_time_ms: 312.4,
          rows_examined: 4800,
          rows_returned: 15,
          is_slow_query: true,
          endpoint: "/api/v1/reports/sales",
          query_text: "SELECT * FROM sales ORDER BY sale_date DESC",
        },
      ],
      query_type_breakdown: [
        {
          query_type: "SELECT",
          total_executions: 25,
          slow_executions: 1,
          avg_execution_time_ms: 18.4,
          max_execution_time_ms: 312.4,
          total_rows_examined: 6200,
        },
      ],
      slow_query_threshold_ms: 100.0,
    });

    render(<PerformanceMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/6 \/ 151/)).toBeInTheDocument();
      expect(screen.getByText("SLOW")).toBeInTheDocument();
      expect(screen.getByText("/api/v1/reports/sales")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("/api/v1/reports/sales"));
    expect(
      screen.getByRole("dialog", { name: "SQL telemetry inspector" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByLabelText("Slow queries only"));
    await waitFor(() => {
      expect(getPerformanceOverview).toHaveBeenCalledTimes(2);
    });
  });
});
