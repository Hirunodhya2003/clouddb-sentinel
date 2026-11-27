// Owner: Member 09
// Reusable filter toolbar for Sales, Purchase, and Inventory Reports.

export default function ReportFilters({
  reportType = "sales",
  onReportTypeChange,
  filters = {},
  onFilterChange,
  onApply,
  onReset,
  onExportCsv,
}) {
  const statusOptions =
    reportType === "sales"
      ? ["", "COMPLETED", "PENDING", "CANCELLED"]
      : reportType === "purchases"
      ? ["", "RECEIVED", "PENDING", "CANCELLED"]
      : ["", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

  const handleField = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [key]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApply) onApply();
  };

  return (
    <form className="toolbar" onSubmit={handleSubmit} aria-label="Report filters">
      {onReportTypeChange && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span className="muted">Report</span>
          <select
            aria-label="Report Type"
            value={reportType}
            onChange={(e) => onReportTypeChange(e.target.value)}
          >
            <option value="sales">Sales Report</option>
            <option value="purchases">Purchase Report</option>
            <option value="inventory">Inventory Valuation</option>
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
          minWidth: 180,
        }}
      >
        <span className="muted">Search</span>
        <input
          type="search"
          aria-label="Search Report"
          placeholder="Invoice, SKU, customer, supplier..."
          value={filters.search || ""}
          onChange={(e) => handleField("search", e.target.value)}
        />
      </label>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
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
      </div>
    </form>
  );
}
