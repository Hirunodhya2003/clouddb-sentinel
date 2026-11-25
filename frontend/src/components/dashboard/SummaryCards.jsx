// Owner: Member 09
// Executive KPI summary cards component.

export default function SummaryCards({ cards = [], loading = false }) {
  if (loading && (!cards || cards.length === 0)) {
    return (
      <div className="sentinel-dashboard-metrics" aria-busy="true">
        {[1, 2, 3, 4].map((idx) => (
          <div className="sentinel-dashboard-metric" key={idx}>
            <div className="muted">Loading metric...</div>
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
    <dl className="sentinel-dashboard-metrics" aria-label="Key business metrics">
      {cards.map((card) => {
        const isAlert = card.trend === "down";
        return (
          <div
            className="sentinel-dashboard-metric"
            key={card.key || card.label}
            style={{
              borderTopColor: isAlert ? "var(--danger, #c0392b)" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <dt>{card.label}</dt>
              {card.badge && (
                <span
                  className={`badge ${isAlert ? "badge-inactive" : "badge-active"}`}
                  style={
                    isAlert
                      ? { background: "#fbeceb", color: "var(--danger, #c0392b)" }
                      : undefined
                  }
                >
                  {card.badge}
                </span>
              )}
            </div>
            <dd>{card.formatted_value ?? card.value}</dd>
            {card.subtitle && (
              <dd className="sentinel-dashboard-metric-note">{card.subtitle}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
