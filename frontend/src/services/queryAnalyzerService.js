// Owner: Member 09
// Smart frontend service for SQL Query Optimization, Live Heuristics, EXPLAIN, and Plan Comparison.

import api from "./api.js";

export const DEMO_PRESET_SCENARIOS = [
  {
    scenario_id: "sales-date-range",
    title: "Sales Date Range Filter (Sargable vs Function-Wrapped)",
    category: "Index Range Scan",
    description:
      "Wrapping sale_date in SUBSTR/YEAR prevents MySQL from using idx_sales_date. Rewriting with a half-open range enables a fast B-Tree range scan.",
    unoptimized_sql:
      "SELECT * FROM sales\nWHERE status = 'COMPLETED'\n  AND SUBSTR(CAST(sale_date AS CHAR), 1, 4) = '2026'\nORDER BY sale_date DESC",
    optimized_sql:
      "SELECT sale_id, invoice_number, sale_date, total_amount\nFROM sales\nWHERE sale_date >= '2026-01-01'\n  AND sale_date < '2027-01-01'\n  AND status = 'COMPLETED'\nORDER BY sale_date DESC",
  },
  {
    scenario_id: "invoice-lookup",
    title: "Invoice Line-Item Lookup via Unique Constraint",
    category: "Unique Index & Joins",
    description:
      "Replacing leading-wildcard LIKE '%INV-001%' with direct equality on uq_sales_invoice turns a full scan into O(log N) const index lookup.",
    unoptimized_sql:
      "SELECT * FROM sales s\nINNER JOIN sale_items si ON si.sale_id = s.sale_id\nINNER JOIN product_variants pv ON pv.variant_id = si.variant_id\nINNER JOIN products p ON p.product_id = pv.product_id\nWHERE s.invoice_number LIKE '%INV-001%'",
    optimized_sql:
      "SELECT s.invoice_number, s.sale_date, p.product_name, pv.sku, si.quantity, si.unit_price, si.subtotal\nFROM sales s\nINNER JOIN sale_items si ON si.sale_id = s.sale_id\nINNER JOIN product_variants pv ON pv.variant_id = si.variant_id\nINNER JOIN products p ON p.product_id = pv.product_id\nWHERE s.invoice_number = 'INV-001'",
  },
  {
    scenario_id: "low-stock-scan",
    title: "Low-Stock Inventory Selective Projection",
    category: "Inventory & Projection",
    description:
      "Projecting only required SKU and quantity columns and avoiding arithmetic on the indexed column improves buffer cache density.",
    unoptimized_sql:
      "SELECT * FROM inventory i\nINNER JOIN product_variants pv ON pv.variant_id = i.variant_id\nINNER JOIN products p ON p.product_id = pv.product_id\nWHERE i.quantity_on_hand - i.reorder_level <= 0",
    optimized_sql:
      "SELECT pv.sku, p.product_name, i.quantity_on_hand, i.reorder_level\nFROM inventory i\nINNER JOIN product_variants pv ON pv.variant_id = i.variant_id\nINNER JOIN products p ON p.product_id = pv.product_id\nWHERE i.quantity_on_hand <= i.reorder_level\nORDER BY i.quantity_on_hand ASC",
  },
];

export function analyzeSqlHeuristics(sql = "") {
  const trimmed = String(sql || "").trim();
  if (!trimmed) {
    return { validSelect: false, score: 0, findings: [] };
  }

  const upper = trimmed.toUpperCase();
  const findings = [];
  let score = 100;

  const forbiddenMatch = trimmed.match(
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|CALL|SET)\b/i
  );
  if (forbiddenMatch) {
    return {
      validSelect: false,
      score: 0,
      findings: [
        {
          level: "critical",
          rule: "Read-Only Guardrail",
          detail: `Keyword '${forbiddenMatch[1].toUpperCase()}' is blocked. Query Analyzer accepts read-only SELECT statements only.`,
        },
      ],
    };
  }

  if (/\bSELECT\s+\*/i.test(trimmed)) {
    score -= 22;
    findings.push({
      level: "warning",
      rule: "Wildcard Projection (SELECT *)",
      detail: "Project explicit columns to cut I/O payload and unlock covering index scans.",
    });
  }

  if (/LIKE\s+'%[^']*'/i.test(trimmed)) {
    score -= 28;
    findings.push({
      level: "critical",
      rule: "Leading Wildcard Predicate",
      detail: "LIKE '%value%' disables B-Tree index seek; use prefix LIKE 'value%' or '='.",
    });
  }

  if (/\b(YEAR|MONTH|DATE|SUBSTR|LOWER|UPPER|CAST)\s*\([^)]*(date|name|sku|invoice)/i.test(trimmed)) {
    score -= 25;
    findings.push({
      level: "warning",
      rule: "Non-Sargable Column Expression",
      detail: "Wrapping an indexed column inside a function forces MySQL to evaluate every row.",
    });
  }

  if (/\bORDER\s+BY\b/i.test(trimmed) && !/\bLIMIT\b/i.test(trimmed)) {
    score -= 8;
    findings.push({
      level: "info",
      rule: "Unbounded Sort Result",
      detail: "Consider adding a LIMIT clause when sorting large result sets for UI pagination.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "optimal",
      rule: "Sargable Query Structure",
      detail: "No static SQL anti-patterns detected — ready for MySQL EXPLAIN verification.",
    });
  }

  return {
    validSelect: upper.startsWith("SELECT") || upper.startsWith("WITH"),
    score: Math.max(10, score),
    findings,
  };
}

export function formatSqlReadability(sql = "") {
  return String(sql || "")
    .replace(/\s+/g, " ")
    .replace(/\b(FROM|WHERE|INNER JOIN|LEFT JOIN|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi, (m) => `\n${m.toUpperCase()}`)
    .replace(/\b(AND|OR)\b/gi, (m) => `\n  ${m.toUpperCase()}`)
    .trim();
}

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
  DEMO_PRESET_SCENARIOS,
  analyzeSqlHeuristics,
  formatSqlReadability,
  getPresetScenarios,
  explainQuery,
  compareQueryPlans,
  getAnalyzedQueryHistory,
};
