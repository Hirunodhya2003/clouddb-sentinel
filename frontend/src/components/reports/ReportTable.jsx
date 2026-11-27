// Owner: Member 09
// Smart reusable business report table with column sorting, pagination, and row inspector modal.

import { useMemo, useState } from "react";

function statusPillStyle(raw) {
  const s = String(raw || "").toUpperCase();
  if (s === "COMPLETED" || s === "RECEIVED" || s === "IN_STOCK") {
    return { background: "#e4f4ec", color: "#1f8a52" };
  }
  if (s === "LOW_STOCK" || s === "PENDING") {
    return { background: "#fdf3dc", color: "#b7791f" };
  }
  if (s === "OUT_OF_STOCK" || s === "CANCELLED") {
    return { background: "#fbeceb", color: "#c0392b" };
  }
  return { background: "#eceff5", color: "#475569" };
}

export default function ReportTable({
  columns = [],
  rows = [],
  summaryItems = [],
  loading = false,
  emptyMessage = "No report rows match the current filters.",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [inspectedRow, setInspectedRow] = useState(null);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const numA = Number(av);
      const numB = Number(bv);
      const cmp =
        !Number.isNaN(numA) && !Number.isNaN(numB) && typeof av !== "boolean"
          ? numA - numB
          : String(av).localeCompare(String(bv));
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  return (
    <div>
      {summaryItems.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {summaryItems.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)",
                border: "1px solid #dbe3f0",
                borderLeft: "3px solid #3055e7",
              }}
            >
              <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>
                {item.label}
              </div>
              <div
                style={{
                  fontWeight: 750,
                  fontSize: 16,
                  marginTop: 4,
                  color: "#0f172a",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading report data...</p>
      ) : rows.length === 0 ? (
        <p className="muted" role="status">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            <span className="muted">
              Click any column header to sort · {sortedRows.length} total record(s)
            </span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="muted">Rows per page:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "3px 8px", fontSize: 12 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((col) => {
                    const isSorted = sortConfig.key === col.key;
                    const arrow = isSorted
                      ? sortConfig.direction === "asc"
                        ? " ▲"
                        : " ▼"
                      : "";
                    return (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        style={{
                          textAlign: col.align || "left",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        {col.header}
                        {arrow}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <tr
                    key={
                      row.id ??
                      row.sale_id ??
                      row.purchase_id ??
                      row.inventory_id ??
                      idx
                    }
                    onClick={() => setInspectedRow(row)}
                    style={{ cursor: "pointer" }}
                  >
                    {columns.map((col) => {
                      const isStatusCol =
                        col.key === "status" || col.key === "stock_status";
                      const rawValue = row[col.key];
                      const rendered = col.render
                        ? col.render(row)
                        : isStatusCol && rawValue
                        ? (
                            <span
                              className="badge"
                              style={statusPillStyle(rawValue)}
                            >
                              {String(rawValue).replaceAll("_", " ")}
                            </span>
                          )
                        : rawValue;

                      return (
                        <td
                          key={col.key}
                          className={col.mono ? "mono" : undefined}
                          style={{ textAlign: col.align || "left" }}
                        >
                          {rendered ?? "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pager">
              <span className="muted" style={{ fontSize: 12 }}>
                Page {safePage} of {totalPages}
              </span>
              <div className="pager-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {inspectedRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report row details"
          onClick={() => setInspectedRow(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(100%, 520px)", borderRadius: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16 }}>Record Breakdown</h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectedRow(null)}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Close
              </button>
            </div>

            <dl className="details-grid">
              {Object.entries(inspectedRow).map(([k, v]) => (
                <div key={k}>
                  <dt style={{ textTransform: "capitalize" }}>
                    {k.replaceAll("_", " ")}
                  </dt>
                  <dd className="mono">{v == null ? "-" : String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
