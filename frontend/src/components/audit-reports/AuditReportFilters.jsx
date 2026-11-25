// Owner: Member 08
import React from 'react';
import {
  AUDIT_REPORT_ENDPOINTS,
  AUDIT_ENTITY_TABLES,
  AUDIT_ACTORS,
} from '../../services/auditReportService.js';

export default function AuditReportFilters({
  reportScope = 'ALL',
  onReportScopeChange,
  searchQuery = '',
  onSearchChange,
  entityFilter = 'ALL',
  onEntityFilterChange,
  outcomeFilter = 'ALL',
  onOutcomeFilterChange,
  actorFilter = 'ALL',
  onActorFilterChange,
  fromDate = '',
  onFromDateChange,
  toDate = '',
  onToDateChange,
  onResetFilters,
  onExportCsv,
  hasActiveFilters = false,
  exportDisabled = false,
}) {
  const actorsList = Object.values(AUDIT_ACTORS);

  return (
    <div className="m08-ar-filters-wrap">
      {/* Endpoint Scope Switcher: GET /api/v1/audit-reports vs GET /api/v1/audit-reports/stock */}
      <div
        className="m08-ar-scope-tabs"
        role="tablist"
        aria-label="Audit report endpoint scope"
      >
        <button
          type="button"
          role="tab"
          aria-selected={reportScope === 'ALL'}
          className={`m08-ar-scope-btn ${
            reportScope === 'ALL' ? 'm08-ar-scope-btn-active' : ''
          }`}
          onClick={() => onReportScopeChange && onReportScopeChange('ALL')}
        >
          <span>All Audit Reports</span>
          <code className="m08-ar-endpoint-tag">
            {AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS}
          </code>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={reportScope === 'STOCK'}
          className={`m08-ar-scope-btn ${
            reportScope === 'STOCK' ? 'm08-ar-scope-btn-active' : ''
          }`}
          onClick={() => onReportScopeChange && onReportScopeChange('STOCK')}
        >
          <span>Stock Audit Reports</span>
          <code className="m08-ar-endpoint-tag">
            {AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS}
          </code>
        </button>
      </div>

      {/* Filter Controls Toolbar */}
      <div
        className="m08-ar-toolbar"
        role="search"
        aria-label="Filter audit report records"
      >
        <div className="m08-ar-search-wrapper">
          <span className="m08-ar-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            className="m08-ar-search-input"
            placeholder="Search by audit ID, reference, SKU, product, user or summary..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            aria-label="Search audit reports by ID, reference, SKU, product name, actor, or summary"
          />
        </div>

        <select
          className="m08-ar-filter-select"
          value={entityFilter}
          onChange={(e) =>
            onEntityFilterChange && onEntityFilterChange(e.target.value)
          }
          aria-label="Filter by audited entity table"
        >
          <option value="ALL">Entity: All Tables</option>
          {AUDIT_ENTITY_TABLES.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>

        <select
          className="m08-ar-filter-select"
          value={outcomeFilter}
          onChange={(e) =>
            onOutcomeFilterChange && onOutcomeFilterChange(e.target.value)
          }
          aria-label="Filter by audit outcome or status"
        >
          <option value="ALL">Outcome: All</option>
          <option value="LOGGED">Logged (Immutable Ledger)</option>
          <option value="COMPLETED">Completed</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING_REVIEW">Needs Review (Pending)</option>
          <option value="REJECTED">Rejected</option>
          <option value="BLOCKED_45000">Blocked by Trigger (45000)</option>
        </select>

        <select
          className="m08-ar-filter-select"
          value={actorFilter}
          onChange={(e) =>
            onActorFilterChange && onActorFilterChange(e.target.value)
          }
          aria-label="Filter by user or role"
        >
          <option value="ALL">User: All Actors</option>
          {actorsList.map((actor) => (
            <option key={actor.user_id} value={String(actor.user_id)}>
              {actor.employee_code} · {actor.full_name} ({actor.role_name})
            </option>
          ))}
        </select>

        <input
          type="date"
          className="m08-ar-date-input"
          value={fromDate}
          onChange={(e) => onFromDateChange && onFromDateChange(e.target.value)}
          aria-label="From date"
          title="Filter audit events from date"
        />

        <input
          type="date"
          className="m08-ar-date-input"
          value={toDate}
          onChange={(e) => onToDateChange && onToDateChange(e.target.value)}
          aria-label="To date"
          title="Filter audit events to date"
        />

        {hasActiveFilters && (
          <button
            type="button"
            className="m08-ar-btn-secondary"
            onClick={onResetFilters}
          >
            Reset
          </button>
        )}

        <button
          type="button"
          className="m08-ar-export-btn"
          onClick={onExportCsv}
          disabled={exportDisabled}
        >
          <span>Export CSV</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
