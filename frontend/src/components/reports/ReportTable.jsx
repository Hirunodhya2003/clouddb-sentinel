// Owner: Member 09
// Reusable business report table with summary strip and empty/loading states.

export default function ReportTable({
  columns = [],
  rows = [],
  summaryItems = [],
  loading = false,
  emptyMessage = "No report rows match the current filters.",
}) {
  return (
    <div>
      {summaryItems.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {summaryItems.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--bg, #f5f7fb)",
                border: "1px solid var(--border, #e3e8f2)",
              }}
            >
              <div className="muted" style={{ fontSize: 11 }}>
                {item.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
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
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ textAlign: col.align || "left" }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id ?? row.sale_id ?? row.purchase_id ?? row.inventory_id ?? idx}>
                  {columns.map((col) => {
                    const value = col.render ? col.render(row) : row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={col.mono ? "mono" : undefined}
                        style={{ textAlign: col.align || "left" }}
                      >
                        {value ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
