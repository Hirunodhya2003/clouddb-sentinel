// Owner: Member 09
// Executive Dashboard & Business Reports Explorer page.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InventoryChart from "../../components/dashboard/InventoryChart.jsx";
import RecentTransactions from "../../components/dashboard/RecentTransactions.jsx";
import SalesChart from "../../components/dashboard/SalesChart.jsx";
import SummaryCards from "../../components/dashboard/SummaryCards.jsx";
import ReportFilters from "../../components/reports/ReportFilters.jsx";
import ReportTable from "../../components/reports/ReportTable.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getDashboardOverview,
  getSalesChart,
} from "../../services/dashboardService.js";
import {
  getInventoryReport,
  getPurchaseReport,
  getSalesReport,
} from "../../services/reportService.js";
import "../../styles/dashboard.css";

const FALLBACK_OVERVIEW = {
  summary_cards: [
    {
      key: "gross_revenue",
      label: "Completed Sales Revenue",
      value: 0,
      formatted_value: "LKR 0.00",
      subtitle: "0 completed invoices",
      trend: "neutral",
      badge: "Sales",
    },
    {
      key: "purchase_spend",
      label: "Procurement Spend",
      value: 0,
      formatted_value: "LKR 0.00",
      subtitle: "0 received purchase orders",
      trend: "neutral",
      badge: "Purchases",
    },
    {
      key: "inventory_valuation",
      label: "Inventory Retail Value",
      value: 0,
      formatted_value: "LKR 0.00",
      subtitle: "0 units across active products",
      trend: "neutral",
      badge: "Inventory",
    },
    {
      key: "low_stock_alerts",
      label: "Low / Out-of-Stock Variants",
      value: 0,
      formatted_value: "0",
      subtitle: "All tracked variants above reorder level",
      trend: "up",
      badge: "Healthy",
    },
  ],
  sales_chart: [],
  inventory_chart: [],
  recent_transactions: [],
};

const QUICK_ACTIONS = [
  {
    label: "Browse products",
    description: "Manage catalog items, pricing, and categories.",
    path: "/products",
    permission: null,
  },
  {
    label: "Schema viewer",
    description: "Inspect normalized MySQL tables and ER relationships.",
    path: "/schema-viewer",
    permission: null,
  },
  {
    label: "Browse users",
    description: "Find accounts and open user profiles.",
    path: "/users",
    permission: "user:read",
  },
  {
    label: "Roles & permissions",
    description: "Review what each workspace role can access.",
    path: "/roles",
    permission: "role:read",
  },
];

function useSafePermissions() {
  try {
    const auth = useAuth();
    return auth?.can || (() => true);
  } catch {
    return () => true;
  }
}

function exportRowsToCsv(filename, columns, rows) {
  if (!rows || rows.length === 0) return;
  const headers = columns.map((c) => `"${String(c.header).replaceAll('"', '""')}"`).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = row[c.key] ?? "";
        return `"${String(raw).replaceAll('"', '""')}"`;
      })
      .join(",")
  );
  const csv = [headers, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const can = useSafePermissions();

  const [activeTab, setActiveTab] = useState("overview");
  const [trendDays, setTrendDays] = useState(14);
  const [overview, setOverview] = useState(FALLBACK_OVERVIEW);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [reportType, setReportType] = useState("sales");
  const [reportFilters, setReportFilters] = useState({
    start_date: "",
    end_date: "",
    status: "",
    stock_status: "",
    search: "",
  });
  const [reportData, setReportData] = useState({ summary: {}, items: [] });
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const loadOverview = useCallback(async (days) => {
    setLoadingOverview(true);
    try {
      const data = await getDashboardOverview({ trend_days: days, recent_limit: 10 });
      setOverview(data);
      setUsingFallback(false);
    } catch {
      setOverview(FALLBACK_OVERVIEW);
      setUsingFallback(true);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(trendDays);
  }, [loadOverview, trendDays]);

  const handleTrendDaysChange = async (days) => {
    setTrendDays(days);
    try {
      const series = await getSalesChart(days);
      setOverview((prev) => ({ ...prev, sales_chart: series }));
    } catch {
      // Keep current series if offline
    }
  };

  const loadReport = useCallback(async (type, currentFilters) => {
    setLoadingReport(true);
    setReportError("");
    try {
      let response;
      if (type === "sales") {
        response = await getSalesReport({
          start_date: currentFilters.start_date,
          end_date: currentFilters.end_date,
          status: currentFilters.status,
          search: currentFilters.search,
        });
      } else if (type === "purchases") {
        response = await getPurchaseReport({
          start_date: currentFilters.start_date,
          end_date: currentFilters.end_date,
          status: currentFilters.status,
          search: currentFilters.search,
        });
      } else {
        response = await getInventoryReport({
          stock_status: currentFilters.stock_status,
          search: currentFilters.search,
        });
      }
      setReportData(response || { summary: {}, items: [] });
    } catch (err) {
      setReportError(err.message || "Failed to load report.");
      setReportData({ summary: {}, items: [] });
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReport(reportType, reportFilters);
    }
  }, [activeTab, reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  const reportColumns = useMemo(() => {
    if (reportType === "sales") {
      return [
        { key: "invoice_number", header: "Invoice #", mono: true },
        { key: "customer_name", header: "Customer" },
        { key: "status", header: "Status" },
        { key: "units_sold", header: "Units", align: "right", mono: true },
        {
          key: "discount_amount",
          header: "Discount (LKR)",
          align: "right",
          mono: true,
          render: (r) => Number(r.discount_amount || 0).toFixed(2),
        },
        {
          key: "total_amount",
          header: "Total (LKR)",
          align: "right",
          mono: true,
          render: (r) => Number(r.total_amount || 0).toFixed(2),
        },
      ];
    }
    if (reportType === "purchases") {
      return [
        { key: "invoice_number", header: "PO / Invoice", mono: true },
        { key: "supplier_name", header: "Supplier" },
        { key: "status", header: "Status" },
        { key: "units_purchased", header: "Units", align: "right", mono: true },
        {
          key: "total_amount",
          header: "Total (LKR)",
          align: "right",
          mono: true,
          render: (r) => Number(r.total_amount || 0).toFixed(2),
        },
      ];
    }
    return [
      { key: "sku", header: "SKU", mono: true },
      { key: "product_name", header: "Product" },
      { key: "category_name", header: "Category" },
      { key: "quantity_on_hand", header: "On Hand", align: "right", mono: true },
      { key: "reorder_level", header: "Reorder Lvl", align: "right", mono: true },
      { key: "stock_status", header: "Health" },
      {
        key: "stock_retail_value",
        header: "Retail Value (LKR)",
        align: "right",
        mono: true,
        render: (r) => Number(r.stock_retail_value || 0).toFixed(2),
      },
    ];
  }, [reportType]);

  const reportSummaryItems = useMemo(() => {
    const s = reportData.summary || {};
    if (reportType === "sales") {
      return [
        { label: "Total Orders", value: s.total_orders ?? 0 },
        { label: "Completed", value: s.completed_orders ?? 0 },
        { label: "Units Sold", value: s.total_units_sold ?? 0 },
        {
          label: "Net Revenue",
          value: `LKR ${Number(s.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      ];
    }
    if (reportType === "purchases") {
      return [
        { label: "Total POs", value: s.total_orders ?? 0 },
        { label: "Received POs", value: s.received_orders ?? 0 },
        {
          label: "Received Spend",
          value: `LKR ${Number(s.received_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
        {
          label: "Pending Commitment",
          value: `LKR ${Number(s.pending_commitment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      ];
    }
    return [
      { label: "Tracked Variants", value: s.total_variants ?? 0 },
      { label: "Units on Hand", value: s.total_units_on_hand ?? 0 },
      { label: "Low Stock", value: s.low_stock_variants ?? 0 },
      {
        label: "Retail Valuation",
        value: `LKR ${Number(s.total_retail_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      },
    ];
  }, [reportData.summary, reportType]);

  const availableActions = QUICK_ACTIONS.filter(
    ({ permission }) => !permission || can(permission)
  );

  return (
    <div className="sentinel-dashboard">
      <header className="sentinel-dashboard-hero">
        <p>CloudDB Sentinel · S.P. Apparels</p>
        <h1>Dashboard</h1>
        <p>
          Real-time sales analytics, inventory valuation, recent operational ledger,
          and business reports.
        </p>
      </header>

      <div className="tabs" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Executive Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reports"}
          className={`tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Business Reports
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          <section aria-labelledby="dashboard-overview">
            <div className="sentinel-dashboard-section-heading">
              <h2 id="dashboard-overview">Business KPIs</h2>
              <span className="sentinel-dashboard-demo">
                {usingFallback ? "Offline baseline" : "Live database"}
              </span>
            </div>

            <SummaryCards
              cards={overview.summary_cards}
              loading={loadingOverview}
            />
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 18,
            }}
          >
            <SalesChart
              data={overview.sales_chart}
              days={trendDays}
              onDaysChange={handleTrendDaysChange}
              loading={loadingOverview}
            />
            <InventoryChart
              data={overview.inventory_chart}
              loading={loadingOverview}
            />
          </div>

          <RecentTransactions
            items={overview.recent_transactions}
            loading={loadingOverview}
          />

          {availableActions.length > 0 && (
            <section aria-labelledby="dashboard-actions">
              <div className="sentinel-dashboard-section-heading">
                <h2 id="dashboard-actions">Quick actions</h2>
              </div>

              <div className="sentinel-dashboard-actions">
                {availableActions.map(({ label, description, path }) => (
                  <Link className="sentinel-dashboard-action" to={path} key={path}>
                    <span>
                      <strong>{label}</strong>
                      <span className="sentinel-dashboard-action-note">
                        {description}
                      </span>
                    </span>
                    <span className="sentinel-dashboard-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="card" aria-label="Business reports explorer">
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>
              Interactive Business Reports
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Filter and export Sales, Supplier Procurement, and Read-Only Inventory Valuation reports.
            </p>
          </div>

          {reportError && (
            <div className="alert alert-error" role="alert">
              {reportError}
            </div>
          )}

          <ReportFilters
            reportType={reportType}
            onReportTypeChange={(nextType) => {
              const cleared = {
                start_date: "",
                end_date: "",
                status: "",
                stock_status: "",
                search: "",
              };
              setReportFilters(cleared);
              setReportType(nextType);
            }}
            filters={reportFilters}
            onFilterChange={setReportFilters}
            onApply={() => loadReport(reportType, reportFilters)}
            onReset={() => {
              const cleared = {
                start_date: "",
                end_date: "",
                status: "",
                stock_status: "",
                search: "",
              };
              setReportFilters(cleared);
              loadReport(reportType, cleared);
            }}
            onExportCsv={() =>
              exportRowsToCsv(
                `${reportType}_report.csv`,
                reportColumns,
                reportData.items || []
              )
            }
          />

          <ReportTable
            columns={reportColumns}
            rows={reportData.items || []}
            summaryItems={reportSummaryItems}
            loading={loadingReport}
          />
        </section>
      )}
    </div>
  );
}
