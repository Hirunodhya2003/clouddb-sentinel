// Owner: Member 09
// Frontend API service for Executive Dashboard metrics, charts, and recent activity.

import api from "./api.js";

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
  getDashboardOverview,
  getSummaryCards,
  getSalesChart,
  getInventoryChart,
  getRecentTransactions,
};
