// Owner: Member 09
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../services/queryAnalyzerService.js", () => ({
  getPresetScenarios: vi.fn(),
  explainQuery: vi.fn(),
  compareQueryPlans: vi.fn(),
  getAnalyzedQueryHistory: vi.fn(),
}));

vi.mock("../services/performanceMonitorService.js", () => ({
  getPerformanceOverview: vi.fn(),
  getConnectionStats: vi.fn(),
  getTableStatistics: vi.fn(),
  getSlowQueries: vi.fn(),
  recordQueryLog: vi.fn(),
}));

import QueryAnalyzer from "../pages/query-analyzer/QueryAnalyzer.jsx";
import PerformanceMonitor from "../pages/performance-monitor/PerformanceMonitor.jsx";
import {
  compareQueryPlans,
  explainQuery,
  getAnalyzedQueryHistory,
  getPresetScenarios,
} from "../services/queryAnalyzerService.js";
import { getPerformanceOverview } from "../services/performanceMonitorService.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Member 09 Query Analyzer & Performance Monitor UI", () => {
  it("runs EXPLAIN in QueryAnalyzer and displays execution plan steps and suggestions", async () => {
    getPresetScenarios.mockResolvedValueOnce([]);
    getAnalyzedQueryHistory.mockResolvedValue([]);
    explainQuery.mockResolvedValueOnce({
      query_text: "SELECT * FROM inventory WHERE quantity_on_hand <= reorder_level",
      query_fingerprint: "abc123",
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
      expect(screen.getByText("inventory")).toBeInTheDocument();
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
      summary: "Optimized query improved the execution plan (estimated rows examined reduced by 90.0%).",
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

    fireEvent.click(screen.getByRole("tab", { name: "Before vs After Plan Comparison" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare Plans" }));

    await waitFor(() => {
      expect(compareQueryPlans).toHaveBeenCalled();
      expect(screen.getByText("Winner: OPTIMIZED")).toBeInTheDocument();
      expect(screen.getByText("idx_sales_date")).toBeInTheDocument();
    });
  });
});
