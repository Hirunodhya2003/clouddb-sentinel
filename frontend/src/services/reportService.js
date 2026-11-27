// Owner: Member 09
// Smart frontend service for Sales, Purchase, Inventory, and Business Summary Reports.

import api from "./api.js";

export const DEMO_REPORTS_DATA = {
  sales: {
    summary: {
      total_orders: 4,
      completed_orders: 3,
      total_units_sold: 19,
      gross_subtotal: 56200,
      total_discounts: 2400,
      net_revenue: 45900,
      average_order_value: 15300,
    },
    items: [
      {
        sale_id: 104,
        invoice_number: "INV-2026-104",
        sale_date: "2026-11-26T14:22:00Z",
        customer_name: "Nimal Perera",
        status: "COMPLETED",
        items_count: 3,
        units_sold: 6,
        subtotal: 19500,
        discount_amount: 1000,
        total_amount: 18500,
      },
      {
        sale_id: 103,
        invoice_number: "INV-2026-103",
        sale_date: "2026-11-25T17:40:00Z",
        customer_name: "Tharushi Fernando",
        status: "COMPLETED",
        items_count: 2,
        units_sold: 4,
        subtotal: 13000,
        discount_amount: 600,
        total_amount: 12400,
      },
      {
        sale_id: 102,
        invoice_number: "INV-2026-102",
        sale_date: "2026-11-25T13:15:00Z",
        customer_name: "Walk-in Customer",
        status: "PENDING",
        items_count: 2,
        units_sold: 3,
        subtotal: 7900,
        discount_amount: 0,
        total_amount: 7900,
      },
      {
        sale_id: 101,
        invoice_number: "INV-2026-101",
        sale_date: "2026-11-24T11:10:00Z",
        customer_name: "Kasun Silva",
        status: "COMPLETED",
        items_count: 3,
        units_sold: 6,
        subtotal: 15800,
        discount_amount: 800,
        total_amount: 15000,
      },
    ],
    total: 4,
  },
  purchases: {
    summary: {
      total_orders: 3,
      received_orders: 2,
      pending_orders: 1,
      total_units_purchased: 95,
      received_spend: 112000,
      pending_commitment: 48500,
    },
    items: [
      {
        purchase_id: 42,
        invoice_number: "PO-2026-042",
        purchase_date: "2026-11-26T10:05:00Z",
        supplier_name: "Ceylon Fine Fabrics Ltd",
        status: "RECEIVED",
        items_count: 4,
        units_purchased: 45,
        total_amount: 64000,
      },
      {
        purchase_id: 41,
        invoice_number: "PO-2026-041",
        purchase_date: "2026-11-24T09:30:00Z",
        supplier_name: "Lanka Apparel Mills",
        status: "PENDING",
        items_count: 3,
        units_purchased: 30,
        total_amount: 48500,
      },
      {
        purchase_id: 40,
        invoice_number: "PO-2026-040",
        purchase_date: "2026-11-21T15:00:00Z",
        supplier_name: "Colombo Trim & Knit Co",
        status: "RECEIVED",
        items_count: 2,
        units_purchased: 20,
        total_amount: 48000,
      },
    ],
    total: 3,
  },
  inventory: {
    summary: {
      total_variants: 4,
      total_units_on_hand: 67,
      low_stock_variants: 1,
      out_of_stock_variants: 1,
      total_cost_valuation: 138400,
      total_retail_valuation: 241500,
    },
    items: [
      {
        inventory_id: 1,
        variant_id: 201,
        sku: "SH-OXF-S-WHT",
        product_code: "P-101",
        product_name: "Classic Oxford Shirt",
        category_name: "Mens Formal Shirts",
        size_name: "S",
        colour_name: "White",
        quantity_on_hand: 0,
        reorder_level: 5,
        cost_price: 2100,
        selling_price: 3650,
        stock_cost_value: 0,
        stock_retail_value: 0,
        stock_status: "OUT_OF_STOCK",
      },
      {
        inventory_id: 2,
        variant_id: 202,
        sku: "DN-SLM-32-IND",
        product_code: "P-204",
        product_name: "Slim Stretch Denim",
        category_name: "Denim & Trousers",
        size_name: "32",
        colour_name: "Indigo",
        quantity_on_hand: 4,
        reorder_level: 6,
        cost_price: 2800,
        selling_price: 4950,
        stock_cost_value: 11200,
        stock_retail_value: 19800,
        stock_status: "LOW_STOCK",
      },
      {
        inventory_id: 3,
        variant_id: 203,
        sku: "SH-OXF-M-NVY",
        product_code: "P-101",
        product_name: "Classic Oxford Shirt",
        category_name: "Mens Formal Shirts",
        size_name: "M",
        colour_name: "Navy",
        quantity_on_hand: 38,
        reorder_level: 8,
        cost_price: 2100,
        selling_price: 3650,
        stock_cost_value: 79800,
        stock_retail_value: 138700,
        stock_status: "IN_STOCK",
      },
      {
        inventory_id: 4,
        variant_id: 204,
        sku: "WC-LIN-M-SGE",
        product_code: "P-309",
        product_name: "Relaxed Linen Tunic",
        category_name: "Womens Casual Wear",
        size_name: "M",
        colour_name: "Sage",
        quantity_on_hand: 25,
        reorder_level: 5,
        cost_price: 1896,
        selling_price: 3320,
        stock_cost_value: 47400,
        stock_retail_value: 83000,
        stock_status: "IN_STOCK",
      },
    ],
    total: 4,
  },
};

export function exportReportDataAsJson(filename, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

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
  DEMO_REPORTS_DATA,
  exportReportDataAsJson,
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getBusinessSummary,
};
