// Owner: Member 09
// Smart Executive KPI Summary Cards with embedded SVG sparklines and interactive focus state.

import { useState } from "react";

const SPARKLINE_PRESETS = {
  gross_revenue: [38, 52, 44, 68, 84, 61, 79],
  purchase_spend: [45, 42, 60, 48, 55, 50, 46],
  inventory_valuation: [70, 74, 73, 78, 82, 85, 88],
  low_stock_alerts: [5, 4, 4, 3, 2, 3, 3],
};

function buildSparklinePath(points = []) {
  if (!points.length) return { linePath: "", areaPath: "" };
  const width = 104;
  const height = 32;
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points, minVal + 1);
  const stepX = width / Math.max(1, points.length - 1);

  const coords = points.map((val, idx) => {
    const x = Number((idx * stepX).toFixed(1));
    const ratio = (val - minVal) / (maxVal - minVal);
    const y = Number((height - 4 - ratio * (height - 8)).toFixed(1));
    return [x, y];
  });

  const linePath = coords
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return { linePath, areaPath };
}

export default function SummaryCards({
  cards = [],
  loading = false,
  onSelectCard,
}) {
  const [selectedKey, setSelectedKey] = useState(null);

  if (loading && (!cards || cards.length === 0)) {
    return (
      <div className="sentinel-dashboard-metrics" aria-busy="true">
        {[1, 2, 3, 4].map((idx) => (
          <div className="sentinel-dashboard-metric" key={idx}>
            <div
              style={{
                height: 14,
                width: "58%",
                borderRadius: 6,
                background: "#e8eef8",
                marginBottom: 14,
              }}
            />
            <div
              style={{
                height: 30,
                width: "75%",
                borderRadius: 8,
                background: "#eef3fb",
                marginBottom: 10,
              }}
            />
            <div className="muted" style={{ fontSize: 12 }}>
              Loading metric...
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="card muted" role="status">
        No summary metrics available yet.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .m09-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 235px), 1fr));
          gap: 16px;
          margin: 0;
        }
        .m09-kpi-card {
          position: relative;
          overflow: hidden;
          padding: 20px 22px 18px;
          border-radius: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
          border: 1px solid #dbe3f0;
          border-top: 3px solid #3055e7;
          box-shadow: 0 8px 24px rgba(21, 29, 47, 0.045);
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
        }
        .m09-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(21, 29, 47, 0.08);
        }
        .m09-kpi-card.is-alert {
          border-top-color: #c0392b;
        }
        .m09-kpi-card.is-positive {
          border-top-color: #1f8a52;
        }
        .m09-kpi-card.is-selected {
          outline: 2px solid #3055e7;
          outline-offset: 2px;
        }
        .m09-kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .m09-kpi-label {
          font-size: 13px;
          font-weight: 650;
          color: #334155;
          line-height: 1.35;
        }
        .m09-kpi-value-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 10px;
          margin-top: 12px;
        }
        .m09-kpi-value {
          margin: 0;
          font-size: clamp(1.45rem, 2.3vw, 1.95rem);
          font-weight: 780;
          letter-spacing: -0.04em;
          color: #0f172a;
          line-height: 1.1;
        }
        .m09-kpi-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e6ecf7;
        }
        .m09-kpi-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 999px;
        }
      `}</style>

      <dl className="m09-kpi-grid" aria-label="Key business metrics">
        {cards.map((card) => {
          const key = card.key || card.label;
          const isAlert = card.trend === "down";
          const isPositive = card.trend === "up";
          const strokeColor = isAlert
            ? "#c0392b"
            : isPositive
            ? "#1f8a52"
            : "#3055e7";
          const fillColor = isAlert
            ? "rgba(192, 57, 43, 0.12)"
            : isPositive
            ? "rgba(31, 138, 82, 0.12)"
            : "rgba(48, 85, 231, 0.12)";

          const series =
            card.sparkline ||
            SPARKLINE_PRESETS[card.key] ||
            [40, 48, 45, 56, 62, 59, 68];
          const { linePath, areaPath } = buildSparklinePath(series);

          const handleClick = () => {
            const next = selectedKey === key ? null : key;
            setSelectedKey(next);
            if (onSelectCard) onSelectCard(card);
          };

          return (
            <div
              key={key}
              onClick={handleClick}
              className={[
                "m09-kpi-card",
                isAlert ? "is-alert" : isPositive ? "is-positive" : "",
                selectedKey === key ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ cursor: onSelectCard ? "pointer" : "default" }}
            >
              <div className="m09-kpi-top">
                <dt className="m09-kpi-label">{card.label}</dt>
                {card.badge && (
                  <span
                    className={`badge ${isAlert ? "badge-inactive" : "badge-active"}`}
                    style={
                      isAlert
                        ? { background: "#fbeceb", color: "#c0392b" }
                        : isPositive
                        ? { background: "#e4f4ec", color: "#1f8a52" }
                        : { background: "#e8eeff", color: "#243e9d" }
                    }
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="m09-kpi-value-row">
                <dd className="m09-kpi-value">
                  {card.formatted_value ?? card.value}
                </dd>

                {linePath && (
                  <svg
                    width="96"
                    height="30"
                    viewBox="0 0 104 32"
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  >
                    <path d={areaPath} fill={fillColor} />
                    <path
                      d={linePath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              <div className="m09-kpi-footer">
                {card.subtitle ? (
                  <dd
                    className="sentinel-dashboard-metric-note"
                    style={{ margin: 0, fontSize: 12 }}
                  >
                    {card.subtitle}
                  </dd>
                ) : (
                  <span />
                )}

                <span
                  className="m09-kpi-trend"
                  style={{
                    background: fillColor,
                    color: strokeColor,
                  }}
                >
                  {isAlert ? "▼ Alert" : isPositive ? "▲ Healthy" : "● Stable"}
                </span>
              </div>
            </div>
          );
        })}
      </dl>
    </>
  );
}
