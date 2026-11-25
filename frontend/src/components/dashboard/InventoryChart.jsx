// Owner: Member 09
// Category Inventory Valuation & Stock Health Distribution Chart component.

export default function InventoryChart({ data = [], loading = false }) {
  const maxRetail = Math.max(1, ...data.map((item) => Number(item.retail_value || 0)));
  const totalUnits = data.reduce((sum, item) => sum + Number(item.units_on_hand || 0), 0);

  return (
    <section className="card" aria-label="Inventory distribution by category">
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Inventory by Category</h3>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          {totalUnits.toLocaleString()} total units across {data.length} categories
        </p>
      </div>

      {loading ? (
        <p className="muted">Loading inventory distribution...</p>
      ) : data.length === 0 ? (
        <p className="muted" style={{ margin: "24px 0" }}>
          No category inventory records available.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((slice) => {
            const widthPct = Math.max(
              4,
              Math.round((Number(slice.retail_value || 0) / maxRetail) * 100)
            );
            const hasLowStock = Number(slice.low_stock_count || 0) > 0;
            return (
              <div key={slice.category_id ?? slice.category_name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <div>
                    <strong>{slice.category_name}</strong>{" "}
                    <span className="muted" style={{ fontSize: 12 }}>
                      ({slice.units_on_hand} units · {slice.variant_count} SKUs)
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasLowStock && (
                      <span
                        className="badge"
                        style={{
                          background: "#fdf3dc",
                          color: "var(--warning, #b7791f)",
                          fontSize: 11,
                        }}
                      >
                        {slice.low_stock_count} low
                      </span>
                    )}
                    <span className="mono">
                      LKR {Number(slice.retail_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#eef2fa",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: hasLowStock ? "#d97706" : "#1f8a52",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
