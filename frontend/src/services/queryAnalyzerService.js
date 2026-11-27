// Owner: Member 09
// Frontend API service for SQL Query Optimization, EXPLAIN, and Plan Comparison.

import api from "./api.js";

export function getPresetScenarios() {
  return api.get("/query-analyzer/presets");
}

export function explainQuery({ sql, analyze = false, endpoint } = {}) {
  return api.post("/query-analyzer/explain", { sql, analyze, endpoint });
}

export function compareQueryPlans({ original_sql, optimized_sql, analyze = false } = {}) {
  return api.post("/query-analyzer/compare", {
    original_sql,
    optimized_sql,
    analyze,
  });
}

export function getAnalyzedQueryHistory(limit = 20) {
  return api.get("/query-analyzer/history", { limit });
}

export default {
  getPresetScenarios,
  explainQuery,
  compareQueryPlans,
  getAnalyzedQueryHistory,
};
