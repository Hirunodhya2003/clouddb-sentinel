// Owner: Member 09
// Smart Cross-Module Recent Transactions Feed with Search, Pagination, and Detail Inspector Modal.

import { useEffect, useMemo, useState } from "react";

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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const pageSize = 6;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && selectedTx) {
        setSelectedTx(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTx]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((tx) => {
      if (filterType !== "ALL" && tx.transaction_type !== filterType) {
        return false;
      }
      if (statusFilter !== "ALL" && String(tx.status || "").toUpperCase() !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = `${tx.reference_number || ""} ${tx.counterparty || ""} ${tx.status || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterType, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const totalDisplayedAmount = useMemo(
    () => filteredItems.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [filteredItems]
  );

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
            {filteredItems.length} ledger event(s) · Combined volume LKR{" "}
            {totalDisplayedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="search"
            aria-label="Search recent transactions"
            placeholder="Filter invoice or counterparty..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ minWidth: 190, padding: "5px 10px", fontSize: 12 }}
          />

          <select
            aria-label="Transaction status filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "5px 8px", fontSize: 12 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RECEIVED">Received</option>
            <option value="PENDING">Pending</option>
          </select>

          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="Filter transaction type">
            {["ALL", "SALE", "PURCHASE"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFilterType(type);
                  setPage(1);
                }}
                className={`btn ${filterType === type ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                {type === "ALL" ? "All" : type === "SALE" ? "Sales" : "Purchases"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading recent transactions...</p>
      ) : paginatedItems.length === 0 ? (
        <p className="muted">No matching recent transactions.</p>
      ) : (
        <>
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
                  <th style={{ textAlign: "right" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((tx) => {
                  const isCompleted =
                    tx.status === "COMPLETED" || tx.status === "RECEIVED";
                  return (
                    <tr
                      key={`${tx.transaction_type}-${tx.record_id}-${tx.reference_number}`}
                    >
                      <td>
                        <span
                          className="key-tag"
                          style={
                            tx.transaction_type === "SALE"
                              ? { background: "#e6edfc", color: "#2c5fd8" }
                              : { background: "#fdf3dc", color: "#b7791f" }
                          }
                        >
                          {tx.transaction_type}
                        </span>
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
                      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                        {Number(tx.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => setSelectedTx(tx)}
                          style={{ fontSize: 12, fontWeight: 600 }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pager">
              <span className="muted" style={{ fontSize: 12 }}>
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredItems.length)} of{" "}
                {filteredItems.length}
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
                <span className="mono" style={{ fontSize: 12 }}>
                  Page {safePage} / {totalPages}
                </span>
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

      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Transaction details"
          onClick={() => setSelectedTx(null)}
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
            style={{
              width: "min(100%, 480px)",
              borderRadius: 14,
              boxShadow: "0 24px 48px rgba(15, 23, 42, 0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16 }}>
                Ledger Entry · {selectedTx.reference_number}
              </h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTx(null)}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Close
              </button>
            </div>

            <dl className="details-grid" style={{ marginTop: 8 }}>
              <div>
                <dt>Transaction Type</dt>
                <dd>
                  <strong>{selectedTx.transaction_type}</strong>
                </dd>
              </div>
              <div>
                <dt>Record ID</dt>
                <dd className="mono">#{selectedTx.record_id}</dd>
              </div>
              <div>
                <dt>Counterparty</dt>
                <dd>{selectedTx.counterparty}</dd>
              </div>
              <div>
                <dt>Settlement Status</dt>
                <dd>{selectedTx.status}</dd>
              </div>
              <div>
                <dt>Timestamp</dt>
                <dd>{formatDateTime(selectedTx.occurred_at)}</dd>
              </div>
              <div>
                <dt>Total Amount</dt>
                <dd className="mono" style={{ fontWeight: 700 }}>
                  LKR{" "}
                  {Number(selectedTx.amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
