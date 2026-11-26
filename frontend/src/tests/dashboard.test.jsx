// Owner: Member 09
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/dashboardService.js", () => ({
  getDashboardOverview: vi.fn(),
  getSalesChart: vi.fn(),
  getSummaryCards: vi.fn(),
  getInventoryChart: vi.fn(),
  getRecentTransactions: vi.fn(),
}));

vi.mock("../services/reportService.js", () => ({
  getSalesReport: vi.fn(),
  getPurchaseReport: vi.fn(),
  getInventoryReport: vi.fn(),
  getBusinessSummary: vi.fn(),
}));

import Dashboard from "../pages/dashboard/Dashboard.jsx";
import SummaryCards from "../components/dashboard/SummaryCards.jsx";
import ReportTable from "../components/reports/ReportTable.jsx";
import { getDashboardOverview } from "../services/dashboardService.js";
import { getSalesReport } from "../services/reportService.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Member 09 Dashboard & Reports UI", () => {
  it("renders SummaryCards with formatted KPI values and alert badges", () => {
    render(
      <SummaryCards
        cards={[
          {
            key: "gross_revenue",
            label: "Completed Sales Revenue",
            formatted_value: "LKR 125,000.00",
            subtitle: "18 completed invoices",
            trend: "up",
            badge: "Sales",
          },
          {
            key: "low_stock",
            label: "Low / Out-of-Stock Variants",
            formatted_value: "3",
            subtitle: "3 SKU(s) at or below reorder level",
            trend: "down",
            badge: "Action Needed",
          },
        ]}
      />
    );

    expect(screen.getByText("Completed Sales Revenue")).toBeInTheDocument();
    expect(screen.getByText("LKR 125,000.00")).toBeInTheDocument();
    expect(screen.getByText("Action Needed")).toBeInTheDocument();
  });

  it("loads live Dashboard overview and switches to Business Reports tab", async () => {
    getDashboardOverview.mockResolvedValueOnce({
      summary_cards: [
        {
          key: "gross_revenue",
          label: "Completed Sales Revenue",
          value: 45000,
          formatted_value: "LKR 45,000.00",
          subtitle: "4 completed invoices",
          trend: "up",
          badge: "Sales",
        },
      ],
      sales_chart: [
        { period: "2026-11-20", label: "11-20", orders_count: 2, revenue: 25000, discounts: 0 },
        { period: "2026-11-21", label: "11-21", orders_count: 2, revenue: 20000, discounts: 500 },
      ],
      inventory_chart: [
        {
          category_id: 1,
          category_name: "Menswear",
          product_count: 5,
          variant_count: 12,
          units_on_hand: 80,
          retail_value: 280000,
          cost_value: 160000,
          low_stock_count: 1,
        },
      ],
      recent_transactions: [
        {
          transaction_type: "SALE",
          record_id: 1,
          reference_number: "INV-9001",
          counterparty: "Nimal Perera",
          amount: 12500,
          status: "COMPLETED",
          occurred_at: "2026-11-21T10:30:00Z",
        },
      ],
    });

    getSalesReport.mockResolvedValueOnce({
      summary: {
        total_orders: 1,
        completed_orders: 1,
        total_units_sold: 3,
        net_revenue: 12500,
      },
      items: [
        {
          sale_id: 1,
          invoice_number: "INV-9001",
          customer_name: "Nimal Perera",
          status: "COMPLETED",
          units_sold: 3,
          discount_amount: 0,
          total_amount: 12500,
        },
      ],
      total: 1,
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("LKR 45,000.00")).toBeInTheDocument();
    });

    expect(screen.getByText("Menswear")).toBeInTheDocument();
    expect(screen.getByText("INV-9001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Business Reports" }));

    await waitFor(() => {
      expect(getSalesReport).toHaveBeenCalled();
      expect(screen.getByText("Interactive Business Reports")).toBeInTheDocument();
    });
  });
});
