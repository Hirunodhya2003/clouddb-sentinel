// Owner: Member 09
// Smart frontend service for Executive Dashboard KPIs, analytics, and resilient offline fallback.

import api from "./api.js";

export const DEMO_DASHBOARD_OVERVIEW = {
  summary_cards: [
    {
      key: "gross_revenue",
      label: "Completed Sales Revenue",
      value: 486500,
      formatted_value: "LKR 486,500.00",
      subtitle: "34 completed retail invoices",
      trend: "up",
      badge: "Sales",
    },
    {
      key: "purchase_spend",
      label: "Procurement Spend",
      value: 294000,
      formatted_value: "LKR 294,000.00",
      subtitle: "9 received supplier purchase orders",
      trend: "neutral",
      badge: "Purchases",
    },
    {
      key: "inventory_valuation",
      label: "Inventory Retail Value",
      value: 1128400,
      formatted_value: "LKR 1,128,400.00",
      subtitle: "412 units across 18 active products",
      trend: "up",
      badge: "Inventory",
    },
    {
      key: "low_stock_alerts",
      label: "Low / Out-of-Stock Variants",
      value: 3,
      formatted_value: "3",
      subtitle: "3 SKU(s) at or below reorder level",
      trend: "down",
      badge: "Action Needed",
    },
  ],
  sales_chart: [
    { period: "2026-11-18", label: "11-18", orders_count: 3, revenue: 38500, discounts: 1200 },
    { period: "2026-11-19", label: "11-19", orders_count: 4, revenue: 51200, discounts: 1500 },
    { period: "2026-11-20", label: "11-20", orders_count: 2, revenue: 29400, discounts: 0 },
    { period: "2026-11-21", label: "11-21", orders_count: 5, revenue: 68900, discounts: 2400 },
    { period: "2026-11-22", label: "11-22", orders_count: 6, revenue: 84200, discounts: 3100 },
    { period: "2026-11-23", label: "11-23", orders_count: 4, revenue: 54800, discounts: 900 },
    { period: "2026-11-24", label: "11-24", orders_count: 3, revenue: 46500, discounts: 1100 },
    { period: "2026-11-25", label: "11-25", orders_count: 4, revenue: 59000, discounts: 1800 },
    { period: "2026-11-26", label: "11-26", orders_count: 3, revenue: 54000, discounts: 1000 },
  ],
  inventory_chart: [
    {
      category_id: 1,
      category_name: "Mens Formal Shirts",
      product_count: 5,
      variant_count: 14,
      units_on_hand: 148,
      retail_value: 473600,
      cost_value: 281200,
      low_stock_count: 1,
    },
    {
      category_id: 2,
      category_name: "Denim & Trousers",
      product_count: 4,
      variant_count: 11,
      units_on_hand: 96,
      retail_value: 364800,
      cost_value: 211200,
      low_stock_count: 1,
    },
    {
      category_id: 3,
      category_name: "Womens Casual Wear",
      product_count: 5,
      variant_count: 12,
      units_on_hand: 104,
      retail_value: 208000,
      cost_value: 119600,
      low_stock_count: 0,
    },
    {
      category_id: 4,
      category_name: "Kids Essentials",
      product_count: 4,
      variant_count: 9,
      units_on_hand: 64,
      retail_value: 82000,
      cost_value: 46400,
      low_stock_count: 1,
    },
  ],
  recent_transactions: [
    {
      transaction_type: "SALE",
      record_id: 104,
      reference_number: "INV-2026-104",
      counterparty: "Nimal Perera",
      amount: 18500,
      status: "COMPLETED",
      occurred_at: "2026-11-26T14:22:00Z",
    },
    {
      transaction_type: "PURCHASE",
      record_id: 42,
      reference_number: "PO-2026-042",
      counterparty: "Ceylon Fine Fabrics Ltd",
      amount: 64000,
      status: "RECEIVED",
      occurred_at: "2026-11-26T10:05:00Z",
    },
    {
      transaction_type: "SALE",
      record_id: 103,
      reference_number: "INV-2026-103",
      counterparty: "Tharushi Fernando",
      amount: 12400,
      status: "COMPLETED",
      occurred_at: "2026-11-25T17:40:00Z",
    },
    {
      transaction_type: "SALE",
      record_id: 102,
      reference_number: "INV-2026-102",
      counterparty: "Walk-in Customer",
      amount: 7900,
      status: "PENDING",
      occurred_at: "2026-11-25T13:15:00Z",
    },
    {
      transaction_type: "PURCHASE",
      record_id: 41,
      reference_number: "PO-2026-041",
      counterparty: "Lanka Apparel Mills",
      amount: 48500,
      status: "PENDING",
      occurred_at: "2026-11-24T09:30:00Z",
    },
  ],
};

export function computeBusinessHealthScore(overview) {
  if (!overview) {
    return { score: 85, label: "Good", insights: [] };
  }
  const cards = overview.summary_cards || [];
  const cardMap = Object.fromEntries(cards.map((c) => [c.key, Number(c.value || 0)]));
  const revenue = cardMap.gross_revenue || 0;
  const spend = cardMap.purchase_spend || 0;
  const invValue = cardMap.inventory_valuation || 0;
  const lowStock = cardMap.low_stock_alerts || 0;

  let score = 78;
  if (revenue > 0 && revenue >= spend * 0.8) score += 10;
  if (invValue > 0) score += 6;
  if (lowStock === 0) score += 6;
  else score -= Math.min(24, lowStock * 5);

  const bounded = Math.max(35, Math.min(100, Math.round(score)));
  const label = bounded >= 85 ? "Optimal" : bounded >= 70 ? "Healthy" : "Attention";

  const insights = [];
  const salesChart = overview.sales_chart || [];
  if (salesChart.length >= 2) {
    const peak = salesChart.reduce(
      (best, cur) => (Number(cur.revenue || 0) > Number(best.revenue || 0) ? cur : best),
      salesChart[0]
    );
    insights.push(
      `Peak sales day (${peak.period}) generated LKR ${Number(peak.revenue || 0).toLocaleString()} across ${peak.orders_count} orders.`
    );
  }
  const invChart = overview.inventory_chart || [];
  if (invChart.length > 0) {
    const topCat = invChart[0];
    insights.push(
      `${topCat.category_name} leads stock value at LKR ${Number(topCat.retail_value || 0).toLocaleString()} (${topCat.units_on_hand} units).`
    );
  }
  if (lowStock > 0) {
    insights.push(
      `${lowStock} variant SKU(s) are at or below reorder threshold — review Inventory Valuation report.`
    );
  } else {
    insights.push("All tracked product variants currently exceed minimum reorder thresholds.");
  }

  return { score: bounded, label, insights };
}

export function getDashboardOverview(params = {}) {
  return api.get("/dashboard", params);
}

export function getSummaryCards() {
  return api.get("/dashboard/summary");
}

export function getSalesChart(days = 14) {
  return api.get("/dashboard/sales-chart", { days });
}

export function getInventoryChart() {
  return api.get("/dashboard/inventory-chart");
}

export function getRecentTransactions(limit = 10) {
  return api.get("/dashboard/recent-transactions", { limit });
}

export default {
  DEMO_DASHBOARD_OVERVIEW,
  computeBusinessHealthScore,
  getDashboardOverview,
  getSummaryCards,
  getSalesChart,
  getInventoryChart,
  getRecentTransactions,
};
