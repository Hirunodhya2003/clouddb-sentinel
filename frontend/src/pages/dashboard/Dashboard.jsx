// Owner: Member 09
// Smart Executive Dashboard, Business Intelligence Hub & Unified ADBMS Workbench.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InventoryChart from "../../components/dashboard/InventoryChart.jsx";
import RecentTransactions from "../../components/dashboard/RecentTransactions.jsx";
import SalesChart from "../../components/dashboard/SalesChart.jsx";
import SummaryCards from "../../components/dashboard/SummaryCards.jsx";
import ReportFilters from "../../components/reports/ReportFilters.jsx";
import ReportTable from "../../components/reports/ReportTable.jsx";
import PerformanceMonitor from "../performance-monitor/PerformanceMonitor.jsx";
import QueryAnalyzer from "../query-analyzer/QueryAnalyzer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  DEMO_DASHBOARD_OVERVIEW,
  computeBusinessHealthScore,
  getDashboardOverview,
  getSalesChart,
} from "../../services/dashboardService.js";
import {
  DEMO_REPORTS_DATA,
  exportReportDataAsJson,
  getBusinessSummary,
  getInventoryReport,
  getPurchaseReport,
  getSalesReport,
} from "../../services/reportService.js";
import "../../styles/dashboard.css";

const QUICK_ACTIONS = [
  {
    label: "Browse products",
    description: "Manage catalog items, base pricing, and active categories.",
    path: "/products",
    permission: null,
  },
  {
    label: "Schema viewer",
    description: "Inspect normalized MySQL 3NF tables and ER relationships.",
    path: "/schema-viewer",
    permission: null,
  },
  {
    label: "Customer directory",
    description: "Review retail customer profiles and integrity checks.",
    path: "/customers",
    permission: null,
  },
  {
    label: "Browse users",
    description: "Find staff accounts and open workspace user profiles.",
    path: "/users",
    permission: "user:read",
  },
  {
    label: "Roles & permissions",
    description: "Review RBAC privileges granted to each database role.",
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
  const headers = columns
    .map((c) => `"${String(c.header).replaceAll('"', '""')}"`)
    .join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = row[c.key] ?? "";
        return `"${String(raw).replaceAll('"', '""')}"`;
      })
      .join(",")
  );
  const csv = "\uFEFF" + [headers, ...lines].join("\r\n");
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
  const [overview, setOverview] = useState(DEMO_DASHBOARD_OVERVIEW);
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
  const [execSummary, setExecSummary] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const loadOverview = useCallback(async (days) => {
    setLoadingOverview(true);
    try {
      const data = await getDashboardOverview({
        trend_days: days,
        recent_limit: 12,
      });
      setOverview(data);
      setUsingFallback(false);
    } catch {
      setOverview(DEMO_DASHBOARD_OVERVIEW);
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
      // Retain existing chart series if backend is offline
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

      if (typeof getBusinessSummary === "function") {
        const bsum = await Promise.resolve(getBusinessSummary()).catch(() => null);
        if (bsum) setExecSummary(bsum);
      }
    } catch (err) {
      const fallback = DEMO_REPORTS_DATA[type];
      if (fallback) {
        setReportData(fallback);
      } else {
        setReportError(err.message || "Failed to load report.");
        setReportData({ summary: {}, items: [] });
      }
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReport(reportType, reportFilters);
    }
  }, [activeTab, reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  const healthMetrics = useMemo(
    () => computeBusinessHealthScore(overview),
    [overview]
  );

  const handleCardShortcut = (card) => {
    if (!card?.key) return;
    const baseReset = {
      start_date: "",
      end_date: "",
      status: "",
      stock_status: "",
      search: "",
    };
    if (card.key === "gross_revenue") {
      setReportType("sales");
      setReportFilters(baseReset);
      setActiveTab("reports");
    } else if (card.key === "purchase_spend") {
      setReportType("purchases");
      setReportFilters(baseReset);
      setActiveTab("reports");
    } else if (card.key === "low_stock_alerts") {
      const lowFilter = { ...baseReset, stock_status: "LOW_STOCK" };
      setReportType("inventory");
      setReportFilters(lowFilter);
      setActiveTab("reports");
    } else if (card.key === "inventory_valuation") {
      setReportType("inventory");
      setReportFilters(baseReset);
      setActiveTab("reports");
    }
  };

  const handleCategoryDrilldown = (slice) => {
    if (!slice?.category_name) return;
    const nextFilters = {
      start_date: "",
      end_date: "",
      status: "",
      stock_status: "",
      search: "",
    };
    setReportType("inventory");
    setReportFilters(nextFilters);
    setActiveTab("reports");
  };

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
          value: `LKR ${Number(s.net_revenue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`,
        },
      ];
    }
    if (reportType === "purchases") {
      return [
        { label: "Total POs", value: s.total_orders ?? 0 },
        { label: "Received POs", value: s.received_orders ?? 0 },
        {
          label: "Received Spend",
          value: `LKR ${Number(s.received_spend || 0).toLocaleString(
            undefined,
            { minimumFractionDigits: 2 }
          )}`,
        },
        {
          label: "Pending Commitment",
          value: `LKR ${Number(s.pending_commitment || 0).toLocaleString(
            undefined,
            { minimumFractionDigits: 2 }
          )}`,
        },
      ];
    }
    return [
      { label: "Tracked Variants", value: s.total_variants ?? 0 },
      { label: "Units on Hand", value: s.total_units_on_hand ?? 0 },
      { label: "Low Stock", value: s.low_stock_variants ?? 0 },
      {
        label: "Retail Valuation",
        value: `LKR ${Number(s.total_retail_valuation || 0).toLocaleString(
          undefined,
          { minimumFractionDigits: 2 }
        )}`,
      },
    ];
  }, [reportData.summary, reportType]);

  const availableActions = QUICK_ACTIONS.filter(
    ({ permission }) => !permission || can(permission)
  );

  const ringRadius = 34;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringDash = (healthMetrics.score / 100) * ringCirc;

  return (
    <div className="sentinel-dashboard">
      <header className="sentinel-dashboard-hero">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#93c5fd" }}>
              CloudDB Sentinel · S.P. Apparels Intelligence Suite
            </p>
            <h1>Dashboard</h1>
            <p>
              Real-time retail sales velocity, read-only inventory valuation,
              cross-module ledger activity, SQL query optimization, and MySQL
              performance monitoring.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 18px",
              borderRadius: 16,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            <svg width="82" height="82" viewBox="0 0 84 84" aria-hidden="true">
              <circle
                cx="42"
                cy="42"
                r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="7"
              />
              <circle
                cx="42"
                cy="42"
                r={ringRadius}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringCirc}`}
                transform="rotate(-90 42 42)"
              />
              <text
                x="42"
                y="40"
                textAnchor="middle"
                fontSize="16"
                fontWeight="750"
                fill="#ffffff"
              >
                {healthMetrics.score}
              </text>
              <text
                x="42"
                y="54"
                textAnchor="middle"
                fontSize="9"
                fill="#cbd5e1"
              >
                INDEX
              </text>
            </svg>
            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                Operational Health
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>
                {healthMetrics.label}
              </div>
              <button
                type="button"
                onClick={() => loadOverview(trendDays)}
                style={{
                  marginTop: 6,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "transparent",
                  color: "#ffffff",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Sync Metrics
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Member 09 Workspace Navigation Tabs */}
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
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "analyzer"}
          className={`tab ${activeTab === "analyzer" ? "active" : ""}`}
          onClick={() => setActiveTab("analyzer")}
        >
          Query Analyzer (EXPLAIN)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "monitor"}
          className={`tab ${activeTab === "monitor" ? "active" : ""}`}
          onClick={() => setActiveTab("monitor")}
        >
          Performance Monitor
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <section aria-labelledby="dashboard-overview">
            <div className="sentinel-dashboard-section-heading">
              <h2 id="dashboard-overview">Business KPIs</h2>
              <span className="sentinel-dashboard-demo">
                {usingFallback ? "Demo baseline" : "Live database"}
              </span>
            </div>

            <SummaryCards
              cards={overview.summary_cards}
              loading={loadingOverview}
              onSelectCard={handleCardShortcut}
            />
          </section>

          {healthMetrics.insights.length > 0 && (
            <section
              className="card"
              aria-label="Automated business insights"
              style={{
                padding: "14px 18px",
                background: "linear-gradient(90deg, #f4f7ff 0%, #ffffff 100%)",
                borderLeft: "4px solid #3055e7",
              }}
            >
              <strong style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                Smart Operational Insights
              </strong>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "grid",
                  gap: 4,
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                {healthMetrics.insights.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
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
              onCategorySelect={handleCategoryDrilldown}
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
                  <Link
                    className="sentinel-dashboard-action"
                    to={path}
                    key={path}
                  >
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
      )}

      {activeTab === "reports" && (
        <section className="card" aria-label="Business reports explorer">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>
                Interactive Business Reports
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Filter, sort, inspect, and export Sales, Supplier Procurement,
                and Read-Only Inventory Valuation reports.
              </p>
            </div>
            {execSummary && (
              <span className="badge badge-active">
                Net Cashflow: LKR{" "}
                {Number(execSummary.estimated_net_cashflow || 0).toLocaleString()}
              </span>
            )}
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
            onExportJson={() =>
              exportReportDataAsJson(`${reportType}_report.json`, reportData)
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

      {activeTab === "analyzer" && <QueryAnalyzer />}

      {activeTab === "monitor" && <PerformanceMonitor />}
    </div>
  );
}
