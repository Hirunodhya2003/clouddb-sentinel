// Owner: Member 09
// Recent Cross-Module Transactions feed component.

import { useState } from "react";

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentTransactions({ items = [], loading = false }) {
  const [filterType, setFilterType] = useState("ALL");

  const visibleItems =
    filterType === "ALL"
      ? items
      : items.filter((item) => item.transaction_type === filterType);

  return (
    <section className="card" aria-label="Recent transactions">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Recent Transactions</h3>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Latest sales invoices and supplier purchase orders
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Filter transaction type">
          {["ALL", "SALE", "PURCHASE"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`btn ${filterType === type ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              {type === "ALL" ? "All" : type === "SALE" ? "Sales" : "Purchases"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading recent transactions...</p>
      ) : visibleItems.length === 0 ? (
        <p className="muted">No matching recent transactions.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference</th>
                <th>Counterparty</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((tx) => {
                const isCompleted =
                  tx.status === "COMPLETED" || tx.status === "RECEIVED";
                return (
                  <tr key={`${tx.transaction_type}-${tx.record_id}-${tx.reference_number}`}>
                    <td>
                      <span className="key-tag key-fk">{tx.transaction_type}</span>
                    </td>
                    <td className="mono">{tx.reference_number}</td>
                    <td>{tx.counterparty}</td>
                    <td>
                      <span
                        className={`badge ${isCompleted ? "badge-active" : "badge-inactive"}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td>{formatDateTime(tx.occurred_at)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {Number(tx.amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
