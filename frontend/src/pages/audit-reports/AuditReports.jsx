// Owner: Member 08
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AuditReportFilters from '../../components/audit-reports/AuditReportFilters.jsx';
import AuditReportTable from '../../components/audit-reports/AuditReportTable.jsx';
import { formatMovementDateTime } from '../../components/stock-movements/MovementTable.jsx';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  AUDIT_REPORT_ENDPOINTS,
  AUDIT_SCHEMA_DEPENDENCY_NOTICE,
  computeAuditReportSummary,
  getAuditReports,
  getStockAuditReports,
} from '../../services/auditReportService.js';

const PAGE_SIZE = 6;

export default function AuditReports() {
  const [reportScope, setReportScope] = useState('ALL'); // 'ALL' (/api/v1/audit-reports) vs 'STOCK' (/api/v1/audit-reports/stock)
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Details Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [schemaNotice, setSchemaNotice] = useState(
    AUDIT_SCHEMA_DEPENDENCY_NOTICE
  );

  const loadReports = useCallback(
    async (scopeToLoad = reportScope, simulateError = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const response =
          scopeToLoad === 'STOCK'
            ? await getStockAuditReports({ simulateError })
            : await getAuditReports({ simulateError });
        setRecords(Array.isArray(response.items) ? response.items : []);
        setSchemaNotice(
          response?.schemaDependencyNotice || AUDIT_SCHEMA_DEPENDENCY_NOTICE
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while loading audit reports.'
        );
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    },
    [reportScope]
  );

  useEffect(() => {
    loadReports(reportScope, false);
  }, [reportScope, loadReports]);

  // Escape key closes details modal
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  // Apply search, entity, outcome, actor, and date range filters
  const filteredRecords = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return records.filter((rec) => {
      if (entityFilter !== 'ALL' && rec.entity_table !== entityFilter) {
        return false;
      }

      if (outcomeFilter !== 'ALL' && rec.outcome !== outcomeFilter) {
        return false;
      }

      if (
        actorFilter !== 'ALL' &&
        String(rec.actor?.user_id || '') !== String(actorFilter)
      ) {
        return false;
      }

      const eventDate = (rec.event_timestamp || '').slice(0, 10);
      if (fromDate && eventDate < fromDate) {
        return false;
      }
      if (toDate && eventDate > toDate) {
        return false;
      }

      if (trimmedQuery) {
        const searchable = [
          rec.audit_id,
          rec.reference_code,
          rec.entity_table,
          String(rec.entity_id),
          rec.action_type,
          rec.action_label,
          rec.outcome,
          rec.sku,
          rec.product_name,
          rec.actor?.full_name,
          rec.actor?.employee_code,
          rec.actor?.role_name,
          rec.summary,
          rec.quantity_impact,
        ];
        const matches = searchable.some(
          (val) => val && String(val).toLowerCase().includes(trimmedQuery)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [
    records,
    searchQuery,
    entityFilter,
    outcomeFilter,
    actorFilter,
    fromDate,
    toDate,
  ]);

  // Summary metrics computed dynamically from the active filtered dataset
  const summary = useMemo(
    () => computeAuditReportSummary(filteredRecords),
    [filteredRecords]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, safeCurrentPage]);

  const handleScopeChange = (nextScope) => {
    setReportScope(nextScope);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setEntityFilter('ALL');
    setOutcomeFilter('ALL');
    setActorFilter('ALL');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (!filteredRecords.length) return;

    const headers = [
      'audit_id',
      'entity_table',
      'entity_id',
      'reference_code',
      'action_type',
      'outcome',
      'variant_id',
      'sku',
      'product_name',
      'quantity_impact',
      'actor_employee_code',
      'actor_name',
      'actor_role',
      'event_timestamp',
      'summary',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredRecords.map((rec) =>
      [
        rec.audit_id,
        rec.entity_table,
        rec.entity_id,
        rec.reference_code,
        rec.action_type,
        rec.outcome,
        rec.variant_id ?? '',
        rec.sku ?? '',
        rec.product_name ?? '',
        rec.quantity_impact,
        rec.actor?.employee_code ?? '',
        rec.actor?.full_name ?? '',
        rec.actor?.role_name ?? '',
        rec.event_timestamp,
        rec.summary,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      reportScope === 'STOCK'
        ? 'stock_audit_reports_export.csv'
        : 'audit_reports_export.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    entityFilter !== 'ALL' ||
    outcomeFilter !== 'ALL' ||
    actorFilter !== 'ALL' ||
    fromDate !== '' ||
    toDate !== '';

  const activeEndpoint =
    reportScope === 'STOCK'
      ? AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS
      : AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS;

  return (
    <section
      className="m08-ar-page"
      aria-labelledby="m08-ar-page-title"
    >
      <style>{`
        .m08-ar-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #F5F7FB;
          color: #0F172A;
          min-height: 100vh;
          padding: 32px 36px 48px;
          box-sizing: border-box;
        }

        .m08-ar-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Top Page Header matching Figma UI 48 */
        .m08-ar-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .m08-ar-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m08-ar-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .m08-ar-title {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .m08-ar-mock-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background-color: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .m08-ar-readonly-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background-color: #EBF1FF;
          color: #24539B;
          border: 1px solid #BFDBFE;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .m08-ar-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        .m08-ar-btn-primary {
          background-color: #24539B;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-ar-btn-primary:hover:not(:disabled) {
          background-color: #1D437F;
        }

        .m08-ar-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .m08-ar-btn-secondary {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .m08-ar-btn-secondary:hover {
          background-color: #E8ECF4;
        }

        /* Schema Dependency Banner */
        .m08-ar-dependency-banner {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-left: 4px solid #24539B;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 22px;
          font-size: 12.5px;
          color: #334155;
          line-height: 1.5;
        }

        /* Row 1: 4 Summary KPI Cards matching Figma UI 48 */
        .m08-ar-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .m08-ar-kpi-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF2F7;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          padding: 20px 22px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 118px;
        }

        .m08-ar-kpi-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8492A6;
          margin-bottom: 10px;
        }

        .m08-ar-kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .m08-ar-kpi-footer {
          display: flex;
          justify-content: flex-end;
        }

        .m08-ar-kpi-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .m08-ar-kpi-pill-blue {
          background-color: #EBF1FF;
          color: #24539B;
        }

        .m08-ar-kpi-pill-amber {
          background-color: #FEF3C7;
          color: #9A6B13;
        }

        /* Row 2: Two-Panel Split (Chart on Left + Snapshot on Right) matching Figma UI 48 */
        .m08-ar-middle-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.15fr) minmax(0, 1fr);
          gap: 20px;
          margin-bottom: 22px;
        }

        .m08-ar-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF2F7;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          padding: 24px 28px;
        }

        .m08-ar-section-title {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-ar-section-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0 0 18px 0;
        }

        /* 10-Bar Vertical Blue Chart matching Figma UI 48 */
        .m08-ar-chart-area {
          height: 230px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 12px 6px;
          box-sizing: border-box;
        }

        .m08-ar-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 10px;
        }

        .m08-ar-bar-track {
          width: 100%;
          max-width: 30px;
          height: 175px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .m08-ar-bar-fill {
          width: 100%;
          background-color: #24539B;
          border-radius: 6px;
          transition: height 0.25s ease, background-color 0.15s ease;
          position: relative;
        }

        .m08-ar-bar-fill:hover {
          background-color: #1D437F;
        }

        .m08-ar-bar-count {
          font-size: 10.5px;
          font-weight: 700;
          color: #64748B;
        }

        .m08-ar-bar-label {
          font-size: 11px;
          color: #8492A6;
          white-space: nowrap;
        }

        /* Operations Snapshot Panel matching Figma UI 48 */
        .m08-ar-snapshot-list {
          list-style: none;
          margin: 8px 0 0 0;
          padding: 0;
        }

        .m08-ar-snapshot-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 0;
          border-top: 1px solid #EEF2F7;
          font-size: 13.5px;
          color: #334155;
          font-weight: 500;
        }

        .m08-ar-snapshot-pill {
          background-color: #EBF1FF;
          color: #24539B;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 999px;
          min-width: 78px;
          text-align: center;
        }

        /* Row 3: Recent Activity Panel matching Figma UI 48 */
        .m08-ar-recent-card {
          margin-bottom: 22px;
        }

        .m08-ar-recent-list {
          list-style: none;
          margin: 12px 0 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .m08-ar-recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 13.5px;
          color: #64748B;
          flex-wrap: wrap;
        }

        .m08-ar-recent-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .m08-ar-recent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #5B7DB1;
          flex-shrink: 0;
        }

        /* Filters & Table Styles */
        .m08-ar-filters-wrap {
          margin-bottom: 20px;
        }

        .m08-ar-scope-tabs {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #F4F6FA;
          padding: 6px;
          border-radius: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .m08-ar-scope-btn {
          background: transparent;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .m08-ar-scope-btn-active {
          background-color: #24539B;
          color: #FFFFFF;
        }

        .m08-ar-endpoint-tag {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: rgba(15, 23, 42, 0.08);
        }

        .m08-ar-scope-btn-active .m08-ar-endpoint-tag {
          background-color: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
        }

        .m08-ar-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .m08-ar-search-wrapper {
          position: relative;
          flex: 1 1 260px;
          min-width: 220px;
        }

        .m08-ar-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          font-size: 14px;
          pointer-events: none;
        }

        .m08-ar-search-input {
          width: 100%;
          background-color: #F4F6FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 14px 11px 36px;
          font-size: 13.5px;
          color: #0F172A;
          box-sizing: border-box;
        }

        .m08-ar-search-input:focus {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-ar-filter-select,
        .m08-ar-date-input,
        .m08-ar-export-btn {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .m08-ar-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .m08-ar-export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .m08-ar-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .m08-ar-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 900px;
        }

        .m08-ar-table thead tr {
          background-color: #F4F6FA;
        }

        .m08-ar-table th {
          text-align: left;
          padding: 13px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #7C8BA1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-top: 1px solid #EEF2F7;
          border-bottom: 1px solid #EEF2F7;
        }

        .m08-ar-table th:first-child {
          border-top-left-radius: 8px;
          border-left: 1px solid #EEF2F7;
        }

        .m08-ar-table th:last-child {
          border-top-right-radius: 8px;
          border-right: 1px solid #EEF2F7;
        }

        .m08-ar-table tbody tr {
          background-color: #FFFFFF;
          transition: background-color 0.12s ease;
        }

        .m08-ar-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .m08-ar-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #EEF2F7;
          vertical-align: middle;
          font-size: 13.5px;
        }

        .m08-ar-table td:first-child {
          border-left: 1px solid #EEF2F7;
        }

        .m08-ar-table td:last-child {
          border-right: 1px solid #EEF2F7;
        }

        .m08-ar-record-primary {
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .m08-ar-dot {
          color: #64748B;
        }

        .m08-ar-record-secondary {
          font-size: 12px;
          color: #64748B;
        }

        .m08-ar-category-primary {
          color: #475569;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .m08-ar-category-secondary {
          font-size: 11.5px;
          color: #94A3B8;
          max-width: 260px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .m08-ar-qty-value {
          display: block;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .m08-ar-qty-sub {
          display: block;
          font-size: 11.5px;
          color: #64748B;
        }

        .m08-ar-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          min-width: 82px;
        }

        .m08-ar-badge-blue {
          background-color: #EBF1FF;
          color: #24539B;
        }

        .m08-ar-badge-amber {
          background-color: #FEF3C7;
          color: #9A6B13;
        }

        .m08-ar-td-date {
          color: #64748B;
          white-space: nowrap;
          font-size: 13px;
        }

        .m08-ar-view-btn {
          background: transparent;
          border: none;
          color: #24539B;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .m08-ar-view-btn:hover {
          background-color: #EBF1FF;
          color: #1D437F;
        }

        .m08-ar-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .m08-ar-pagination-summary {
          font-size: 12.5px;
          color: #64748B;
        }

        .m08-ar-pagination-controls {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #F4F6FA;
          padding: 5px 10px;
          border-radius: 999px;
        }

        .m08-ar-page-btn {
          background: transparent;
          border: none;
          color: #64748B;
          font-size: 13px;
          font-weight: 600;
          min-width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .m08-ar-page-btn-active {
          color: #0F172A;
          font-weight: 700;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-ar-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* States & Modals */
        .m08-ar-state-box {
          padding: 48px 24px;
          text-align: center;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          background-color: #F8FAFC;
        }

        .m08-ar-state-error {
          border-color: #FCA5A5;
          background-color: #FEF2F2;
        }

        .m08-ar-state-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
        }

        .m08-ar-state-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 16px 0;
        }

        .m08-ar-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #E2E8F0;
          border-top-color: #24539B;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: m08-ar-spin 0.8s linear infinite;
        }

        @keyframes m08-ar-spin {
          to { transform: rotate(360deg); }
        }

        .m08-ar-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .m08-ar-modal {
          background-color: #FFFFFF;
          border-radius: 16px;
          max-width: 680px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .m08-ar-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          border-bottom: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        .m08-ar-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-ar-modal-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .m08-ar-modal-close {
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 16px;
          color: #64748B;
          cursor: pointer;
        }

        .m08-ar-modal-body {
          padding: 24px 26px;
          max-height: 75vh;
          overflow-y: auto;
        }

        .m08-ar-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }

        .m08-ar-detail-item {
          background-color: #F8FAFC;
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .m08-ar-detail-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 4px;
        }

        .m08-ar-detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .m08-ar-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 26px;
          border-top: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        @media (max-width: 1024px) {
          .m08-ar-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .m08-ar-middle-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .m08-ar-page {
            padding: 20px 16px 32px;
          }
          .m08-ar-card {
            padding: 20px 16px;
          }
          .m08-ar-kpi-grid,
          .m08-ar-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="m08-ar-container">
        {/* Top Page Heading matching Figma UI 48 */}
        <header className="m08-ar-header">
          <div className="m08-ar-title-group">
            <div className="m08-ar-title-row">
              <h1 id="m08-ar-page-title" className="m08-ar-title">
                Audit Reports
              </h1>
              <span className="m08-ar-readonly-pill">Read-Only Audit View</span>
              {IS_DEVELOPMENT_MOCK_MODE && (
                <span
                  className="m08-ar-mock-pill"
                  title={`Using local development mock dataset (${activeEndpoint})`}
                >
                  Dev Mock Mode
                </span>
              )}
            </div>
            <p className="m08-ar-subtitle">
              Stock audit activity and changes
            </p>
          </div>

          <div>
            <button
              type="button"
              className="m08-ar-btn-primary"
              onClick={handleExportCsv}
              disabled={isLoading || filteredRecords.length === 0}
            >
              <span>Export Audit CSV</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        {/* Member 10 Schema Dependency Notice */}
        <div className="m08-ar-dependency-banner" role="note">
          <strong>Schema &amp; Endpoint Notice:</strong> {schemaNotice} Active
          endpoint scope: <code>{activeEndpoint}</code>.
        </div>

        {/* Row 1: 4 Summary KPI Cards matching Figma UI 48 */}
        <div
          className="m08-ar-kpi-grid"
          aria-label="Audit report summary metrics"
        >
          <div className="m08-ar-kpi-card">
            <div>
              <div className="m08-ar-kpi-label">TOTAL AUDIT EVENTS</div>
              <div className="m08-ar-kpi-value">{summary.totalEvents}</div>
            </div>
            <div className="m08-ar-kpi-footer">
              <span className="m08-ar-kpi-pill m08-ar-kpi-pill-blue">
                ↗ 100% Logged
              </span>
            </div>
          </div>

          <div className="m08-ar-kpi-card">
            <div>
              <div className="m08-ar-kpi-label">PENDING &amp; FLAGGED AUDITS</div>
              <div className="m08-ar-kpi-value">{summary.needsReviewCount}</div>
            </div>
            <div className="m08-ar-kpi-footer">
              <span className="m08-ar-kpi-pill m08-ar-kpi-pill-amber">
                Needs review
              </span>
            </div>
          </div>

          <div className="m08-ar-kpi-card">
            <div>
              <div className="m08-ar-kpi-label">STOCK LEDGER AUDITS</div>
              <div className="m08-ar-kpi-value">
                {summary.stockLedgerEvents}
              </div>
            </div>
            <div className="m08-ar-kpi-footer">
              <span className="m08-ar-kpi-pill m08-ar-kpi-pill-blue">
                ↗ Immutable
              </span>
            </div>
          </div>

          <div className="m08-ar-kpi-card">
            <div>
              <div className="m08-ar-kpi-label">
                ADJUSTMENT &amp; RETURN AUDITS
              </div>
              <div className="m08-ar-kpi-value">
                {summary.reconciliationsAndReturns}
              </div>
            </div>
            <div className="m08-ar-kpi-footer">
              <span className="m08-ar-kpi-pill m08-ar-kpi-pill-blue">
                ↗ {summary.adjustmentAudits} Adj / {summary.returnAudits} Ret
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Two-Panel Split (Audit Activity Bar Chart + Audit Operations Snapshot) matching Figma UI 48 */}
        <div className="m08-ar-middle-grid">
          <div className="m08-ar-card">
            <h2 className="m08-ar-section-title">
              Stock &amp; audit activity timeline
            </h2>
            <p className="m08-ar-section-subtitle">
              Chronological distribution of audited stock movements,
              adjustments, returns, and trigger guard events
            </p>

            <div
              className="m08-ar-chart-area"
              role="img"
              aria-label="Bar chart showing audit event distribution across 10 audit periods and trigger guards"
            >
              {summary.chartSeries.map((bucket) => (
                <div key={bucket.key} className="m08-ar-bar-col">
                  <span className="m08-ar-bar-count">{bucket.count}</span>
                  <div className="m08-ar-bar-track">
                    <div
                      className="m08-ar-bar-fill"
                      style={{ height: `${bucket.heightPercent}%` }}
                      title={`${bucket.label}: ${bucket.count} audit event(s)`}
                    />
                  </div>
                  <span className="m08-ar-bar-label">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="m08-ar-card">
            <h2 className="m08-ar-section-title">Audit operations snapshot</h2>
            <p className="m08-ar-section-subtitle">
              Breakdown by audited entity and trigger protection status
            </p>

            <ul className="m08-ar-snapshot-list">
              <li className="m08-ar-snapshot-row">
                <span>Stock movement ledger audits</span>
                <span className="m08-ar-snapshot-pill">
                  {summary.stockLedgerEvents} events
                </span>
              </li>
              <li className="m08-ar-snapshot-row">
                <span>Stock adjustment audits</span>
                <span className="m08-ar-snapshot-pill">
                  {summary.adjustmentAudits} records
                </span>
              </li>
              <li className="m08-ar-snapshot-row">
                <span>Sales return audits</span>
                <span className="m08-ar-snapshot-pill">
                  {summary.returnAudits} records
                </span>
              </li>
              <li className="m08-ar-snapshot-row">
                <span>Trigger immutability guards</span>
                <span className="m08-ar-snapshot-pill">
                  {summary.triggerGuardBlocks} blocked
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Row 3: Recent Activity Panel matching Figma UI 48 */}
        <div className="m08-ar-card m08-ar-recent-card">
          <h2 className="m08-ar-section-title">Recent audit activity</h2>
          <ul className="m08-ar-recent-list">
            {summary.recentHighlights.length === 0 ? (
              <li className="m08-ar-recent-item">
                <span>No recent audit events match the active filters.</span>
              </li>
            ) : (
              summary.recentHighlights.map((item) => (
                <li key={item.audit_id} className="m08-ar-recent-item">
                  <div className="m08-ar-recent-left">
                    <span
                      className="m08-ar-recent-dot"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{item.reference_code}</strong> ({item.action_label}
                      ) — {item.summary}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="m08-ar-view-btn"
                    onClick={() => setSelectedRecord(item)}
                  >
                    Inspect →
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Row 4: Full Filterable & Paginated Audit Reports Directory */}
        <div className="m08-ar-card">
          <h2 className="m08-ar-section-title">Audit Reports directory</h2>
          <p className="m08-ar-section-subtitle">
            Search, filter, and inspect read-only stock and trigger audit records
          </p>

          <AuditReportFilters
            reportScope={reportScope}
            onReportScopeChange={handleScopeChange}
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            entityFilter={entityFilter}
            onEntityFilterChange={(val) => {
              setEntityFilter(val);
              setCurrentPage(1);
            }}
            outcomeFilter={outcomeFilter}
            onOutcomeFilterChange={(val) => {
              setOutcomeFilter(val);
              setCurrentPage(1);
            }}
            actorFilter={actorFilter}
            onActorFilterChange={(val) => {
              setActorFilter(val);
              setCurrentPage(1);
            }}
            fromDate={fromDate}
            onFromDateChange={(val) => {
              setFromDate(val);
              setCurrentPage(1);
            }}
            toDate={toDate}
            onToDateChange={(val) => {
              setToDate(val);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
            onExportCsv={handleExportCsv}
            hasActiveFilters={hasActiveFilters}
            exportDisabled={isLoading || filteredRecords.length === 0}
          />

          <AuditReportTable
            records={paginatedRecords}
            totalFilteredCount={filteredRecords.length}
            currentPage={safeCurrentPage}
            pageSize={PAGE_SIZE}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onViewDetails={setSelectedRecord}
            onResetFilters={handleResetFilters}
            onRetry={() => loadReports(reportScope, false)}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Read-Only Audit Record Details Modal */}
      {selectedRecord && (
        <div
          className="m08-ar-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m08-ar-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <div className="m08-ar-modal">
            <div className="m08-ar-modal-header">
              <div>
                <h3 id="m08-ar-modal-title" className="m08-ar-modal-title">
                  {selectedRecord.audit_id} · {selectedRecord.reference_code}
                </h3>
                <p className="m08-ar-modal-subtitle">
                  Entity: <code>{selectedRecord.entity_table}</code> · Endpoint:{' '}
                  <code>{activeEndpoint}</code>
                </p>
              </div>
              <button
                type="button"
                className="m08-ar-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close audit record details dialog"
              >
                ✕
              </button>
            </div>

            <div className="m08-ar-modal-body">
              <div className="m08-ar-detail-grid">
                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">
                    Audit ID &amp; Entity Reference
                  </div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.audit_id} ({selectedRecord.reference_code})
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">
                    Action &amp; Outcome
                  </div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.action_label} ({selectedRecord.outcome})
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">
                    Product Variant &amp; SKU
                  </div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.product_name} ({selectedRecord.sku} ·
                    Variant #{selectedRecord.variant_id ?? 'N/A'})
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">
                    Stock / Audit Impact
                  </div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.quantity_impact}
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">Actor / Role</div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.actor?.employee_code} ·{' '}
                    {selectedRecord.actor?.full_name} (
                    {selectedRecord.actor?.role_name})
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">
                    Event Timestamp (UTC)
                  </div>
                  <div className="m08-ar-detail-value">
                    {formatMovementDateTime(selectedRecord.event_timestamp)}
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">Before State</div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.before_state}
                  </div>
                </div>

                <div className="m08-ar-detail-item">
                  <div className="m08-ar-detail-label">After State</div>
                  <div className="m08-ar-detail-value">
                    {selectedRecord.after_state}
                  </div>
                </div>
              </div>

              <div className="m08-ar-detail-item">
                <div className="m08-ar-detail-label">Audit Event Summary</div>
                <div className="m08-ar-detail-value">
                  {selectedRecord.summary}
                </div>
              </div>
            </div>

            <div className="m08-ar-modal-footer">
              <button
                type="button"
                className="m08-ar-btn-primary"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
