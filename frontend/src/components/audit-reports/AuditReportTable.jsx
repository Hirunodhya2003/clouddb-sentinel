// Owner: Member 08
import React from 'react';
import {
  formatMovementDate,
  formatMovementDateTime,
} from '../stock-movements/MovementTable.jsx';

const OUTCOME_LABELS = Object.freeze({
  LOGGED: 'Logged',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  PENDING_REVIEW: 'Needs review',
  REJECTED: 'Rejected',
  BLOCKED_45000: 'Blocked (45000)',
});

export default function AuditReportTable({
  records = [],
  totalFilteredCount = 0,
  currentPage = 1,
  pageSize = 6,
  totalPages = 1,
  onPageChange,
  onViewDetails,
  onResetFilters,
  onRetry,
  isLoading = false,
  error = null,
}) {
  if (isLoading) {
    return (
      <div
        className="m08-ar-state-box"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="m08-ar-spinner" aria-hidden="true" />
        <p className="m08-ar-state-title">Loading audit report records...</p>
        <p className="m08-ar-state-subtitle">
          Aggregating read-only stock audit events and trigger verification logs.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m08-ar-state-box m08-ar-state-error" role="alert">
        <p className="m08-ar-state-title">Unable to load audit reports</p>
        <p className="m08-ar-state-subtitle">{error}</p>
        {onRetry && (
          <button
            type="button"
            className="m08-ar-btn-secondary"
            onClick={onRetry}
          >
            Retry loading
          </button>
        )}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="m08-ar-state-box" role="status" aria-live="polite">
        <p className="m08-ar-state-title">No matching audit records found</p>
        <p className="m08-ar-state-subtitle">
          No audit events match your active search query, entity table, actor, or
          date range filter.
        </p>
        {onResetFilters && (
          <button
            type="button"
            className="m08-ar-btn-secondary"
            onClick={onResetFilters}
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + records.length - 1, totalFilteredCount);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="m08-ar-table-section">
      <div className="m08-ar-table-scroll">
        <table
          className="m08-ar-table"
          aria-label="Audit Reports directory table"
        >
          <thead>
            <tr>
              <th scope="col">AUDIT RECORD</th>
              <th scope="col">ENTITY / ACTION</th>
              <th scope="col">STOCK / AUDIT IMPACT</th>
              <th scope="col">ACTOR / ROLE</th>
              <th scope="col">STATUS</th>
              <th scope="col">TIMESTAMP</th>
              <th scope="col">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const outcomeLabel =
                OUTCOME_LABELS[rec.outcome] || rec.outcome || 'Logged';
              const timePart =
                formatMovementDateTime(rec.event_timestamp).split(', ')[1] || '';

              return (
                <tr key={rec.audit_id}>
                  <td>
                    <div className="m08-ar-record-primary">
                      <span>{rec.audit_id}</span>
                      <span className="m08-ar-dot" aria-hidden="true">
                        ·
                      </span>
                      <span>{rec.product_name}</span>
                    </div>
                    <div className="m08-ar-record-secondary">
                      Ref: {rec.reference_code}
                      {rec.sku && rec.sku !== 'N/A'
                        ? ` · SKU: ${rec.sku} (Variant #${rec.variant_id})`
                        : ''}
                    </div>
                  </td>

                  <td>
                    <div className="m08-ar-category-primary">
                      <code>{rec.entity_table}</code> · {rec.action_label}
                    </div>
                    <div
                      className="m08-ar-category-secondary"
                      title={rec.summary}
                    >
                      {rec.summary}
                    </div>
                  </td>

                  <td>
                    <span className="m08-ar-qty-value">
                      {rec.quantity_impact}
                    </span>
                    <span className="m08-ar-qty-sub">
                      {rec.is_stock_audit
                        ? 'Stock Audit Event'
                        : 'Policy / Guard Verification'}
                    </span>
                  </td>

                  <td>
                    <div className="m08-ar-category-primary">
                      {rec.actor?.full_name || 'System'}
                    </div>
                    <div className="m08-ar-record-secondary">
                      {rec.actor?.employee_code || 'SYS'} ·{' '}
                      {rec.actor?.role_name || 'SYSTEM'}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`m08-ar-badge ${
                        rec.badge_tone === 'amber'
                          ? 'm08-ar-badge-amber'
                          : 'm08-ar-badge-blue'
                      }`}
                    >
                      {outcomeLabel}
                    </span>
                  </td>

                  <td className="m08-ar-td-date">
                    <div>{formatMovementDate(rec.event_timestamp)}</div>
                    <div className="m08-ar-record-secondary">{timePart}</div>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="m08-ar-view-btn"
                      onClick={() => onViewDetails && onViewDetails(rec)}
                      aria-label={`View audit details for ${rec.audit_id}`}
                    >
                      <span>View</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="m08-ar-pagination-bar">
        <div className="m08-ar-pagination-summary" aria-live="polite">
          Showing {startIndex}–{endIndex} of {totalFilteredCount} audit records
        </div>

        <nav
          className="m08-ar-pagination-controls"
          aria-label="Audit reports pagination"
        >
          {currentPage > 1 && (
            <button
              type="button"
              className="m08-ar-page-btn"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              ←
            </button>
          )}

          {pageNumbers.map((num) => (
            <button
              key={num}
              type="button"
              className={`m08-ar-page-btn ${
                num === currentPage ? 'm08-ar-page-btn-active' : ''
              }`}
              onClick={() => onPageChange && onPageChange(num)}
              aria-current={num === currentPage ? 'page' : undefined}
              aria-label={`Page ${num}`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className="m08-ar-page-btn"
            onClick={() =>
              onPageChange &&
              currentPage < totalPages &&
              onPageChange(currentPage + 1)
            }
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            →
          </button>
        </nav>
      </div>
    </div>
  );
}
