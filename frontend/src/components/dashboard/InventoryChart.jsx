// Owner: Member 09
// Smart Category Inventory Distribution Chart with SVG Donut Ring & Cost-vs-Retail Margin Bars.

import { useState } from "react";

const PALETTE = ["#3055e7", "#1f8a52", "#d97706", "#7c3aed", "#0891b2", "#db2777"];

export default function InventoryChart({
  data = [],
  loading = false,
  onCategorySelect,
}) {
  const [viewMode, setViewMode] = useState("bars");
  const [activeIdx, setActiveIdx] = useState(null);

  const maxRetail = Math.max(1, ...data.map((item) => Number(item.retail_value || 0)));
  const totalRetail = data.reduce((s, item) => s + Number(item.retail_value || 0), 0);
  const totalCost = data.reduce((s, item) => s + Number(item.cost_value || 0), 0);
  const totalUnits = data.reduce((s, item) => s + Number(item.units_on_hand || 0), 0);
  const blendedMarginPct =
    totalRetail > 0 ? (((totalRetail - totalCost) / totalRetail) * 100).toFixed(1) : "0.0";

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;
  const donutSegments = data.map((slice, idx) => {
    const val = Number(slice.retail_value || 0);
    const frac = totalRetail > 0 ? val / totalRetail : 0;
    const dashLength = frac * circumference;
    const dashOffset = -cumulativeFraction * circumference;
    cumulativeFraction += frac;
    return {
      slice,
      idx,
      frac,
      dashArray: `${dashLength} ${Math.max(0, circumference - dashLength)}`,
      dashOffset,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  const highlighted =
    activeIdx !== null && data[activeIdx] ? data[activeIdx] : null;

  return (
    <section className="card" aria-label="Inventory distribution by category">
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
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Inventory by Category</h3>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            {totalUnits.toLocaleString()} units across {data.length} categories · Est. retail margin{" "}
            <strong>{blendedMarginPct}%</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Inventory chart style">
          <button
            type="button"
            onClick={() => setViewMode("bars")}
            className={`btn ${viewMode === "bars" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "4px 9px", fontSize: 11 }}
          >
            Margin Bars
          </button>
          <button
            type="button"
            onClick={() => setViewMode("donut")}
            className={`btn ${viewMode === "donut" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "4px 9px", fontSize: 11 }}
          >
            Donut Ring
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading inventory distribution...</p>
      ) : data.length === 0 ? (
        <p className="muted" style={{ margin: "24px 0" }}>
          No category inventory records available.
        </p>
      ) : viewMode === "donut" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          <svg
            width="176"
            height="176"
            viewBox="0 0 180 180"
            role="img"
            aria-label="Category retail valuation donut ring"
          >
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#eef2fa"
              strokeWidth="22"
            />
            <g transform="rotate(-90 90 90)">
              {donutSegments.map((seg) => (
                <circle
                  key={seg.slice.category_id ?? seg.slice.category_name}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={activeIdx === seg.idx ? "26" : "22"}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  style={{ cursor: "pointer", transition: "stroke-width 0.15s ease" }}
                  onMouseEnter={() => setActiveIdx(seg.idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onClick={() => onCategorySelect && onCategorySelect(seg.slice)}
                />
              ))}
            </g>
            <text
              x="90"
              y="85"
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontWeight="600"
            >
              {highlighted ? highlighted.category_name.slice(0, 14) : "Total Retail"}
            </text>
            <text
              x="90"
              y="104"
              textAnchor="middle"
              fontSize="13"
              fill="#0f172a"
              fontWeight="700"
            >
              LKR{" "}
              {Math.round(
                (highlighted ? Number(highlighted.retail_value || 0) : totalRetail) / 1000
              )}
              k
            </text>
          </svg>

          <div style={{ display: "grid", gap: 8 }}>
            {donutSegments.map((seg) => (
              <div
                key={seg.slice.category_id ?? seg.slice.category_name}
                onMouseEnter={() => setActiveIdx(seg.idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => onCategorySelect && onCategorySelect(seg.slice)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: activeIdx === seg.idx ? "#f1f5fe" : "transparent",
                  cursor: onCategorySelect ? "pointer" : "default",
                  fontSize: 12,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: seg.color,
                    }}
                  />
                  <strong>{seg.slice.category_name}</strong>
                </span>
                <span className="mono">{(seg.frac * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {data.map((slice, idx) => {
            const retail = Number(slice.retail_value || 0);
            const cost = Number(slice.cost_value || 0);
            const widthPct = Math.max(4, Math.round((retail / maxRetail) * 100));
            const costSharePct = retail > 0 ? Math.min(100, Math.round((cost / retail) * 100)) : 0;
            const marginPct = retail > 0 ? (((retail - cost) / retail) * 100).toFixed(0) : "0";
            const hasLowStock = Number(slice.low_stock_count || 0) > 0;

            return (
              <div
                key={slice.category_id ?? slice.category_name}
                onClick={() => onCategorySelect && onCategorySelect(slice)}
                style={{ cursor: onCategorySelect ? "pointer" : "default" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    fontSize: 13,
                    marginBottom: 5,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{slice.category_name}</strong>{" "}
                    <span className="muted" style={{ fontSize: 12 }}>
                      ({slice.units_on_hand} units · {slice.variant_count} SKUs · {marginPct}% margin)
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
                      LKR{" "}
                      {retail.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: 9,
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
                      background: hasLowStock ? "#d97706" : PALETTE[idx % PALETTE.length],
                    }}
                    title={`Cost share: ${costSharePct}% | Margin: ${marginPct}%`}
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
