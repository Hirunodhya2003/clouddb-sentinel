// Owner: Member 09
// Smart reusable filter toolbar with quick date presets, active badge counter, and multi-format export.

function computePresetDates(preset) {
  const today = new Date("2026-11-27T00:00:00Z");
  const iso = (d) => d.toISOString().slice(0, 10);

  if (preset === "today") {
    const t = iso(today);
    return { start_date: t, end_date: t };
  }
  if (preset === "7d") {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 7);
    return { start_date: iso(start), end_date: iso(today) };
  }
  if (preset === "month") {
    return { start_date: "2026-11-01", end_date: iso(today) };
  }
  if (preset === "ytd") {
    return { start_date: "2026-01-01", end_date: iso(today) };
  }
  return { start_date: "", end_date: "" };
}

export default function ReportFilters({
  reportType = "sales",
  onReportTypeChange,
  filters = {},
  onFilterChange,
  onApply,
  onReset,
  onExportCsv,
  onExportJson,
}) {
  const statusOptions =
    reportType === "sales"
      ? ["", "COMPLETED", "PENDING", "CANCELLED"]
      : reportType === "purchases"
      ? ["", "RECEIVED", "PENDING", "CANCELLED"]
      : ["", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

  const activeFilterCount = [
    filters.start_date,
    filters.end_date,
    reportType === "inventory" ? filters.stock_status : filters.status,
    filters.search,
  ].filter(Boolean).length;

  const handleField = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [key]: value });
    }
  };

  const applyPreset = (presetKey) => {
    const range = computePresetDates(presetKey);
    const updated = { ...filters, ...range };
    if (onFilterChange) onFilterChange(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApply) onApply();
  };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: "#f8faff",
        border: "1px solid #e2e8f5",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 13 }}>Filter Criteria</strong>
          {activeFilterCount > 0 && (
            <span
              className="badge"
              style={{ background: "#e8eeff", color: "#243e9d", fontSize: 11 }}
            >
              {activeFilterCount} active
            </span>
          )}
        </div>

        {reportType !== "inventory" && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
            role="group"
            aria-label="Quick date presets"
          >
            <span className="muted" style={{ fontSize: 11 }}>
              Quick range:
            </span>
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7d" },
              { id: "month", label: "Nov 2026" },
              { id: "ytd", label: "YTD 2026" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-secondary"
                onClick={() => applyPreset(p.id)}
                style={{ padding: "3px 8px", fontSize: 11 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="toolbar"
        onSubmit={handleSubmit}
        aria-label="Report filters"
        style={{ marginBottom: 0 }}
      >
        {onReportTypeChange && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span className="muted">Report Module</span>
            <select
              aria-label="Report Type"
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
            >
              <option value="sales">Sales Revenue Report</option>
              <option value="purchases">Supplier Purchase Report</option>
              <option value="inventory">Inventory Valuation (Read-Only)</option>
            </select>
          </label>
        )}

        {reportType !== "inventory" && (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span className="muted">Start Date</span>
              <input
                type="date"
                aria-label="Start Date"
                value={filters.start_date || ""}
                onChange={(e) => handleField("start_date", e.target.value)}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span className="muted">End Date</span>
              <input
                type="date"
                aria-label="End Date"
                value={filters.end_date || ""}
                onChange={(e) => handleField("end_date", e.target.value)}
              />
            </label>
          </>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span className="muted">{reportType === "inventory" ? "Stock Health" : "Status"}</span>
          <select
            aria-label="Status Filter"
            value={
              reportType === "inventory"
                ? filters.stock_status || ""
                : filters.status || ""
            }
            onChange={(e) =>
              handleField(
                reportType === "inventory" ? "stock_status" : "status",
                e.target.value
              )
            }
          >
            {statusOptions.map((opt) => (
              <option key={opt || "ALL"} value={opt}>
                {opt ? opt.replaceAll("_", " ") : "All"}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
            flex: 1,
            minWidth: 190,
          }}
        >
          <span className="muted">Keyword Search</span>
          <input
            type="search"
            aria-label="Search Report"
            placeholder="Invoice, SKU, customer, supplier..."
            value={filters.search || ""}
            onChange={(e) => handleField("search", e.target.value)}
          />
        </label>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          {onReset && (
            <button type="button" className="btn btn-secondary" onClick={onReset}>
              Reset
            </button>
          )}
          {onExportCsv && (
            <button type="button" className="btn btn-secondary" onClick={onExportCsv}>
              Export CSV
            </button>
          )}
          {onExportJson && (
            <button type="button" className="btn btn-secondary" onClick={onExportJson}>
              Export JSON
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
