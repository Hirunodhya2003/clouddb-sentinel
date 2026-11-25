// Owner: Member 09
// Frontend API service for Sales, Purchase, Inventory, and Business Summary Reports.

import api from "./api.js";

export function getSalesReport(filters = {}) {
  return api.get("/reports/sales", filters);
}

export function getPurchaseReport(filters = {}) {
  return api.get("/reports/purchases", filters);
}

export function getInventoryReport(filters = {}) {
  return api.get("/reports/inventory", filters);
}

export function getBusinessSummary() {
  return api.get("/reports/business-summary");
}

export default {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getBusinessSummary,
};
