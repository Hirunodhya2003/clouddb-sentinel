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
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/dashboardService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getDashboardOverview: vi.fn(),
    getSalesChart: vi.fn(),
    getSummaryCards: vi.fn(),
    getInventoryChart: vi.fn(),
    getRecentTransactions: vi.fn(),
  };
});

vi.mock("../services/reportService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getSalesReport: vi.fn(),
    getPurchaseReport: vi.fn(),
    getInventoryReport: vi.fn(),
    getBusinessSummary: vi.fn(),
  };
});

import Dashboard from "../pages/dashboard/Dashboard.jsx";
import SummaryCards from "../components/dashboard/SummaryCards.jsx";
import SalesChart from "../components/dashboard/SalesChart.jsx";
import InventoryChart from "../components/dashboard/InventoryChart.jsx";
import RecentTransactions from "../components/dashboard/RecentTransactions.jsx";
import ReportTable from "../components/reports/ReportTable.jsx";
import {
  computeBusinessHealthScore,
  getDashboardOverview,
} from "../services/dashboardService.js";
import { getSalesReport } from "../services/reportService.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Member 09 Smart Dashboard & Business Reports UI", () => {
  it("renders SummaryCards with sparklines, KPI values, and alert badges", () => {
    const onSelect = vi.fn();
    render(
      <SummaryCards
        onSelectCard={onSelect}
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
            key: "low_stock_alerts",
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

    fireEvent.click(screen.getByText("Completed Sales Revenue"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("toggles SalesChart between Bars and Area modes and switches InventoryChart to Donut Ring", () => {
    render(
      <div>
        <SalesChart
          data={[
            { period: "2026-11-20", label: "11-20", orders_count: 3, revenue: 30000, discounts: 0 },
            { period: "2026-11-21", label: "11-21", orders_count: 5, revenue: 54000, discounts: 1000 },
          ]}
        />
        <InventoryChart
          data={[
            {
              category_id: 1,
              category_name: "Formal Shirts",
              units_on_hand: 90,
              variant_count: 10,
              retail_value: 250000,
              cost_value: 140000,
              low_stock_count: 1,
            },
          ]}
        />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    expect(screen.getByText(/Peak: 11-21/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Donut Ring" }));
    expect(
      screen.getByRole("img", { name: "Category retail valuation donut ring" })
    ).toBeInTheDocument();
  });

  it("filters RecentTransactions and opens the Transaction Detail Modal", () => {
    render(
      <RecentTransactions
        items={[
          {
            transaction_type: "SALE",
            record_id: 10,
            reference_number: "INV-7001",
            counterparty: "Nimal Perera",
            amount: 14500,
            status: "COMPLETED",
            occurred_at: "2026-11-25T10:00:00Z",
          },
          {
            transaction_type: "PURCHASE",
            record_id: 22,
            reference_number: "PO-8002",
            counterparty: "Ceylon Fabrics",
            amount: 62000,
            status: "RECEIVED",
            occurred_at: "2026-11-24T09:00:00Z",
          },
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Search recent transactions"), {
      target: { value: "INV-7001" },
    });
    expect(screen.getByText("INV-7001")).toBeInTheDocument();
    expect(screen.queryByText("PO-8002")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    expect(
      screen.getByRole("dialog", { name: "Transaction details" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
  });

  it("loads live Dashboard overview, computes health score, and switches to Business Reports tab", async () => {
    const score = computeBusinessHealthScore({
      summary_cards: [
        { key: "gross_revenue", value: 90000 },
        { key: "purchase_spend", value: 45000 },
        { key: "inventory_valuation", value: 220000 },
        { key: "low_stock_alerts", value: 0 },
      ],
      sales_chart: [{ period: "2026-11-20", revenue: 90000, orders_count: 6 }],
      inventory_chart: [
        { category_name: "Menswear", retail_value: 220000, units_on_hand: 60 },
      ],
    });
    expect(score.score).toBeGreaterThanOrEqual(85);

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
        {
          period: "2026-11-20",
          label: "11-20",
          orders_count: 2,
          revenue: 25000,
          discounts: 0,
        },
        {
          period: "2026-11-21",
          label: "11-21",
          orders_count: 2,
          revenue: 20000,
          discounts: 500,
        },
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
      expect(
        screen.getByText("Interactive Business Reports")
      ).toBeInTheDocument();
    });
  });

  it("sorts ReportTable columns and inspects a clicked row", () => {
    render(
      <ReportTable
        columns={[
          { key: "sku", header: "SKU", mono: true },
          { key: "quantity_on_hand", header: "On Hand" },
        ]}
        rows={[
          { inventory_id: 1, sku: "OXF-M-BLU", quantity_on_hand: 14 },
          { inventory_id: 2, sku: "DEN-S-BLK", quantity_on_hand: 3 },
        ]}
        summaryItems={[{ label: "Tracked Variants", value: 2 }]}
      />
    );

    fireEvent.click(screen.getByText("On Hand"));
    expect(screen.getByText("OXF-M-BLU")).toBeInTheDocument();
    expect(screen.getByText("Tracked Variants")).toBeInTheDocument();

    fireEvent.click(screen.getByText("OXF-M-BLU"));
    expect(
      screen.getByRole("dialog", { name: "Report row details" })
    ).toBeInTheDocument();
  });
});
