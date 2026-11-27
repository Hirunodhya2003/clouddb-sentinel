// Owner: Member 09
// SVG Sales Revenue & Order Volume Trend Chart component.

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
  const maxRevenue = Math.max(1, ...data.map((pt) => Number(pt.revenue || 0)));
  const totalRevenue = data.reduce((sum, pt) => sum + Number(pt.revenue || 0), 0);
  const totalOrders = data.reduce((sum, pt) => sum + Number(pt.orders_count || 0), 0);

  const svgWidth = 620;
  const svgHeight = 220;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 34;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  return (
    <section className="card" aria-label="Sales revenue trend">
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
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Sales Revenue Trend</h3>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            LKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} across {totalOrders} orders
          </p>
        </div>
        {onDaysChange && (
          <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Trend window">
            {[7, 14, 30].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onDaysChange(option)}
                className={`btn ${days === option ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                {option}d
              </button>
            ))}
          </div>
        )}
      </div>

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
            aria-label="Daily completed sales revenue bar chart"
          >
            {[0, 0.5, 1].map((ratio) => {
              const y = padTop + plotHeight * (1 - ratio);
              const tickValue = maxRevenue * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={padLeft}
                    x2={svgWidth - padRight}
                    y1={y}
                    y2={y}
                    stroke="#e3e8f2"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 6}
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

            {data.map((pt, idx) => {
              const slotWidth = plotWidth / Math.max(1, data.length);
              const barWidth = Math.min(34, Math.max(10, slotWidth * 0.62));
              const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
              const barHeight = Math.max(
                2,
                (Number(pt.revenue || 0) / maxRevenue) * plotHeight
              );
              const y = padTop + plotHeight - barHeight;

              return (
                <g key={pt.period || idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill="#3055e7"
                  >
                    <title>
                      {`${pt.period}: LKR ${Number(pt.revenue || 0).toLocaleString()} (${pt.orders_count} orders)`}
                    </title>
                  </rect>
                  <text
                    x={x + barWidth / 2}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7691"
                  >
                    {pt.label || pt.period}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
