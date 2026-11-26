// Owner: Member 08
import React from 'react';
import { MOVEMENT_TYPE_META } from '../../services/stockMovementService.js';

/**
 * Formats an ISO timestamp string to match Figma UI 17 date format ("17 Nov 2026").
 */
export function formatMovementDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Formats an ISO timestamp string with both date and UTC time for detailed views.
 */
export function formatMovementDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);

  const datePart = formatMovementDate(isoString);
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${datePart}, ${timePart} UTC`;
}

export default function MovementTable({
  movements = [],
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
  selectedMovementId = null,
}) {
  if (isLoading) {
    return (
      <div
        className="m08-sm-state-box"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="m08-sm-spinner" aria-hidden="true" />
        <p className="m08-sm-state-title">Loading stock movements...</p>
        <p className="m08-sm-state-subtitle">
          Preparing immutable stock movement records from development dataset.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m08-sm-state-box m08-sm-state-error" role="alert">
        <p className="m08-sm-state-title">Unable to load stock movements</p>
        <p className="m08-sm-state-subtitle">{error}</p>
        {onRetry && (
          <button
            type="button"
            className="m08-sm-btn-secondary"
            onClick={onRetry}
          >
            Retry loading
          </button>
        )}
      </div>
    );
  }

  if (!movements.length) {
    return (
      <div className="m08-sm-state-box" role="status" aria-live="polite">
        <p className="m08-sm-state-title">No matching stock movements found</p>
        <p className="m08-sm-state-subtitle">
          No records match your current search term, movement type, or date filter.
        </p>
        {onResetFilters && (
          <button
            type="button"
            className="m08-sm-btn-secondary"
            onClick={onResetFilters}
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + movements.length - 1, totalFilteredCount);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="m08-sm-table-section">
      <div className="m08-sm-table-scroll">
        <table
          className="m08-sm-table"
          aria-label="Stock Movements directory table"
        >
          <thead>
            <tr>
              <th scope="col">RECORD</th>
              <th scope="col">CATEGORY / TYPE</th>
              <th scope="col">QUANTITY / VALUE</th>
              <th scope="col">STATUS</th>
              <th scope="col">UPDATED</th>
              <th scope="col" className="m08-sm-th-action">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => {
              const meta =
                MOVEMENT_TYPE_META[movement.movement_type] ||
                MOVEMENT_TYPE_META.PURCHASE;
              const isSelected = selectedMovementId === movement.movement_id;
              const recordCode = `REC-${movement.movement_id}`;

              return (
                <tr
                  key={movement.movement_id}
                  className={isSelected ? 'm08-sm-row-selected' : ''}
                >
                  <td className="m08-sm-td-record">
                    <div className="m08-sm-record-primary">
                      <span>{recordCode}</span>
                      <span className="m08-sm-dot" aria-hidden="true">
                        ·
                      </span>
                      <span>{movement.product_name}</span>
                    </div>
                    <div className="m08-sm-record-secondary">
                      SKU: {movement.sku} · Variant #{movement.variant_id} (
                      {movement.size_name} / {movement.colour_name})
                    </div>
                  </td>

                  <td className="m08-sm-td-category">
                    <div className="m08-sm-category-primary">
                      {movement.category_name}
                    </div>
                    <div className="m08-sm-category-secondary">
                      {movement.reference_type} #{movement.reference_id}
                    </div>
                  </td>

                  <td className="m08-sm-td-quantity">
                    <span className="m08-sm-qty-value">
                      {meta.sign}
                      {movement.quantity} units
                    </span>
                    <span className="m08-sm-qty-direction">
                      {meta.direction === 'INBOUND' ? 'Addition' : 'Reduction'}
                    </span>
                  </td>

                  <td className="m08-sm-td-status">
                    <span
                      className={`m08-sm-badge ${
                        meta.badgeTone === 'amber'
                          ? 'm08-sm-badge-amber'
                          : 'm08-sm-badge-blue'
                      }`}
                    >
                      {meta.label}
                    </span>
                  </td>

                  <td className="m08-sm-td-date">
                    {formatMovementDate(movement.movement_date)}
                  </td>

                  <td className="m08-sm-td-action">
                    <button
                      type="button"
                      className="m08-sm-view-btn"
                      onClick={() =>
                        onViewDetails && onViewDetails(movement.movement_id)
                      }
                      aria-label={`View details for ${recordCode} ${movement.product_name}`}
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

      {/* Footer / Pagination bar matching Figma UI 17 */}
      <div className="m08-sm-pagination-bar">
        <div className="m08-sm-pagination-summary" aria-live="polite">
          Showing {startIndex}–{endIndex} of {totalFilteredCount} records
        </div>

        <nav
          className="m08-sm-pagination-controls"
          aria-label="Stock movements pagination"
        >
          {currentPage > 1 && (
            <button
              type="button"
              className="m08-sm-page-btn"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              ←
            </button>
          )}

          {pageNumbers.map((pageNumber) => {
            const isActive = pageNumber === currentPage;
            return (
              <button
                key={pageNumber}
                type="button"
                className={`m08-sm-page-btn ${
                  isActive ? 'm08-sm-page-btn-active' : ''
                }`}
                onClick={() => onPageChange && onPageChange(pageNumber)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${pageNumber}`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            type="button"
            className="m08-sm-page-btn"
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
