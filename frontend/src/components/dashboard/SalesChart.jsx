// Owner: Member 09
// Interactive Dual-Mode (Bar & Smooth Area) Sales Revenue & Order Volume SVG Chart.

import { useMemo, useState } from "react";

function formatCompact(num) {
  const n = Number(num || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

export default function SalesChart({
  data = [],
  days = 14,
  onDaysChange,
  loading = false,
}) {
  const [chartMode, setChartMode] = useState("bar");
  const [metricKey, setMetricKey] = useState("revenue");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const summary = useMemo(() => {
    const totalRevenue = data.reduce((s, pt) => s + Number(pt.revenue || 0), 0);
    const totalOrders = data.reduce((s, pt) => s + Number(pt.orders_count || 0), 0);
    const totalDiscounts = data.reduce((s, pt) => s + Number(pt.discounts || 0), 0);
    const avgOrderVal = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const peakPoint =
      data.length > 0
        ? data.reduce(
            (best, cur) =>
              Number(cur.revenue || 0) > Number(best.revenue || 0) ? cur : best,
            data[0]
          )
        : null;
    return { totalRevenue, totalOrders, totalDiscounts, avgOrderVal, peakPoint };
  }, [data]);

  const values = data.map((pt) =>
    metricKey === "orders_count"
      ? Number(pt.orders_count || 0)
      : Number(pt.revenue || 0)
  );
  const maxVal = Math.max(1, ...values);

  const svgWidth = 640;
  const svgHeight = 240;
  const padLeft = 52;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 36;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const points = data.map((pt, idx) => {
    const slot = plotWidth / Math.max(1, data.length);
    const cx =
      data.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + idx * slot + slot / 2;
    const val =
      metricKey === "orders_count"
        ? Number(pt.orders_count || 0)
        : Number(pt.revenue || 0);
    const cy = padTop + plotHeight - (val / maxVal) * plotHeight;
    return { cx, cy, val, raw: pt, slot };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].cx.toFixed(1)},${padTop + plotHeight} L${points[0].cx.toFixed(1)},${padTop + plotHeight} Z`
      : "";

  const activePoint =
    hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <section className="card" aria-label="Sales revenue trend" style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Sales Revenue Trend</h3>
            {summary.peakPoint && (
              <span
                className="badge"
                style={{ background: "#e8eeff", color: "#243e9d", fontSize: 11 }}
              >
                Peak: {summary.peakPoint.label || summary.peakPoint.period}
              </span>
            )}
          </div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
            LKR{" "}
            {summary.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            across {summary.totalOrders} orders · Avg order LKR{" "}
            {summary.avgOrderVal.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Chart metric">
            <button
              type="button"
              onClick={() => setMetricKey("revenue")}
              className={`btn ${metricKey === "revenue" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setMetricKey("orders_count")}
              className={`btn ${metricKey === "orders_count" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Orders
            </button>
          </div>

          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Chart visual style">
            <button
              type="button"
              onClick={() => setChartMode("bar")}
              className={`btn ${chartMode === "bar" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Bars
            </button>
            <button
              type="button"
              onClick={() => setChartMode("area")}
              className={`btn ${chartMode === "area" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 9px", fontSize: 11 }}
            >
              Area
            </button>
          </div>

          {onDaysChange && (
            <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Trend window">
              {[7, 14, 30].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onDaysChange(option)}
                  className={`btn ${days === option ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 9px", fontSize: 11 }}
                >
                  {option}d
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activePoint && (
        <div
          role="status"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            padding: "8px 12px",
            marginBottom: 10,
            borderRadius: 8,
            background: "#151d2f",
            color: "#ffffff",
            fontSize: 12,
          }}
        >
          <span>
            <strong>{activePoint.raw.period}</strong>
          </span>
          <span className="mono">
            Revenue: LKR{" "}
            {Number(activePoint.raw.revenue || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="mono">Orders: {activePoint.raw.orders_count}</span>
          <span className="mono">
            Discounts: LKR {Number(activePoint.raw.discounts || 0).toLocaleString()}
          </span>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading sales trend...</p>
      ) : data.length === 0 ? (
        <p className="muted" style={{ margin: "24px 0" }}>
          No sales activity recorded for the selected window.
        </p>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: "100%", height: "auto", display: "block" }}
            role="img"
            aria-label="Daily completed sales revenue chart"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="m09SalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3055e7" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#3055e7" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="m09SalesBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b66f5" />
                <stop offset="100%" stopColor="#2442b8" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padTop + plotHeight * (1 - ratio);
              const tickValue = maxVal * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={padLeft}
                    x2={svgWidth - padRight}
                    y1={y}
                    y2={y}
                    stroke="#e6ecf5"
                    strokeDasharray={ratio === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b7691"
                  >
                    {formatCompact(tickValue)}
                  </text>
                </g>
              );
            })}

            {chartMode === "area" ? (
              <>
                <path d={areaPath} fill="url(#m09SalesAreaGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3055e7"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p, idx) => (
                  <g
                    key={p.raw.period || idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={p.cx}
                      cy={p.cy}
                      r={hoveredIndex === idx ? 6 : 4}
                      fill={hoveredIndex === idx ? "#151d2f" : "#3055e7"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.cx}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7691"
                    >
                      {p.raw.label || p.raw.period}
                    </text>
                  </g>
                ))}
              </>
            ) : (
              points.map((p, idx) => {
                const barWidth = Math.min(36, Math.max(10, p.slot * 0.62));
                const x = p.cx - barWidth / 2;
                const barHeight = Math.max(3, padTop + plotHeight - p.cy);
                const y = padTop + plotHeight - barHeight;
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={p.raw.period || idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    {isHovered && (
                      <line
                        x1={p.cx}
                        x2={p.cx}
                        y1={padTop}
                        y2={padTop + plotHeight}
                        stroke="#94a3b8"
                        strokeDasharray="2 2"
                      />
                    )}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="5"
                      fill={isHovered ? "#151d2f" : "url(#m09SalesBarGrad)"}
                    >
                      <title>
                        {`${p.raw.period}: LKR ${Number(p.raw.revenue || 0).toLocaleString()} (${p.raw.orders_count} orders)`}
                      </title>
                    </rect>
                    <text
                      x={p.cx}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isHovered ? "700" : "400"}
                      fill={isHovered ? "#0f172a" : "#6b7691"}
                    >
                      {p.raw.label || p.raw.period}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
      )}
    </section>
  );
}
