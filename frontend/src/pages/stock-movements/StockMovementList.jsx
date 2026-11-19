// Owner: Member 08
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MovementTable, {
  formatMovementDate,
  formatMovementDateTime,
} from '../../components/stock-movements/MovementTable.jsx';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_MOVEMENT_TYPES,
  MOVEMENT_TYPE_META,
  getStockMovements,
  getStockMovementById,
} from '../../services/stockMovementService.js';

const PAGE_SIZE = 6;

export default function StockMovementList() {
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Details & New Record Info Modal State
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);

  const loadMovements = useCallback(async (simulateError = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStockMovements({ simulateError });
      setMovements(Array.isArray(response.items) ? response.items : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading stock movements.'
      );
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements(false);
  }, [loadMovements]);

  // Close open modals on Escape key for keyboard accessibility
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (selectedMovement || detailsError) {
          setSelectedMovement(null);
          setDetailsError(null);
        } else if (showNewRecordModal) {
          setShowNewRecordModal(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMovement, detailsError, showNewRecordModal]);

  // Distinct category options and date options derived from loaded records
  const categoryOptions = useMemo(() => {
    const set = new Set();
    movements.forEach((item) => {
      if (item.category_name) set.add(item.category_name);
    });
    return Array.from(set);
  }, [movements]);

  const dateOptions = useMemo(() => {
    const map = new Map();
    movements.forEach((item) => {
      if (item.movement_date) {
        const isoDateKey = item.movement_date.slice(0, 10);
        if (!map.has(isoDateKey)) {
          map.set(isoDateKey, formatMovementDate(item.movement_date));
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [movements]);

  // Combined search + movement_type + category + date filtering
  const filteredMovements = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return movements.filter((item) => {
      // 1. Movement type / status filter
      if (movementTypeFilter !== 'ALL') {
        if (movementTypeFilter === 'DIRECTION_INBOUND') {
          if (item.direction !== 'INBOUND') return false;
        } else if (movementTypeFilter === 'DIRECTION_OUTBOUND') {
          if (item.direction !== 'OUTBOUND') return false;
        } else if (item.movement_type !== movementTypeFilter) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter !== 'ALL' && item.category_name !== categoryFilter) {
        return false;
      }

      // 3. Date filter (YYYY-MM-DD prefix match)
      if (dateFilter !== 'ALL') {
        const recordDate = (item.movement_date || '').slice(0, 10);
        if (recordDate !== dateFilter) return false;
      }

      // 4. Text search across ID, REC-ID, MOV-ID, SKU, product name, variant_id, reference, notes
      if (trimmedQuery) {
        const searchableFields = [
          String(item.movement_id),
          `rec-${item.movement_id}`,
          `mov-${item.movement_id}`,
          String(item.variant_id),
          item.sku,
          item.product_name,
          item.category_name,
          item.movement_type,
          item.movement_label,
          item.reference_type,
          String(item.reference_id ?? ''),
          `${item.reference_type || ''} #${item.reference_id || ''}`,
          item.notes,
        ];

        const matchesSearch = searchableFields.some(
          (field) => field && String(field).toLowerCase().includes(trimmedQuery)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [movements, searchQuery, movementTypeFilter, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedMovements = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredMovements.slice(start, start + PAGE_SIZE);
  }, [filteredMovements, safeCurrentPage]);

  // Handlers that keep search, filters, and pagination synchronized
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleMovementTypeChange = (event) => {
    setMovementTypeFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategoryFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (event) => {
    setDateFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setMovementTypeFilter('ALL');
    setCategoryFilter('ALL');
    setDateFilter('ALL');
    setCurrentPage(1);
  };

  const handleViewDetails = async (movementId) => {
    setDetailsError(null);
    try {
      const response = await getStockMovementById(movementId);
      setSelectedMovement(response.item);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : 'Unable to load details for the selected stock movement.'
      );
    }
  };

  const handleExportCsv = () => {
    if (!filteredMovements.length) return;

    const headers = [
      'movement_id',
      'variant_id',
      'sku',
      'product_name',
      'movement_type',
      'quantity',
      'reference_type',
      'reference_id',
      'movement_date',
      'notes',
    ];

    const escapeCsvValue = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredMovements.map((item) =>
      headers.map((key) => escapeCsvValue(item[key])).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock_movements_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    movementTypeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    dateFilter !== 'ALL';

  const selectedMeta = selectedMovement
    ? MOVEMENT_TYPE_META[selectedMovement.movement_type] ||
      MOVEMENT_TYPE_META.PURCHASE
    : null;

  return (
    <section
      className="m08-sm-page"
      aria-labelledby="m08-sm-page-title"
    >
      <style>{`
        .m08-sm-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #F5F7FB;
          color: #0F172A;
          min-height: 100%;
          padding: 32px 36px 48px;
          box-sizing: border-box;
        }

        .m08-sm-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Top Page Header matching Figma UI 17 */
        .m08-sm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .m08-sm-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m08-sm-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .m08-sm-title {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .m08-sm-mock-pill {
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

        .m08-sm-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        .m08-sm-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .m08-sm-btn-primary {
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
          transition: background-color 0.15s ease, transform 0.1s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-sm-btn-primary:hover {
          background-color: #1D437F;
        }

        .m08-sm-btn-primary:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        .m08-sm-btn-secondary {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .m08-sm-btn-secondary:hover {
          background-color: #E8ECF4;
        }

        .m08-sm-btn-secondary:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Main White Card Panel matching Figma UI 17 */
        .m08-sm-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF2F7;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          padding: 28px 32px;
        }

        .m08-sm-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .m08-sm-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-sm-card-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        /* Search & Filters Toolbar matching Figma UI 17 */
        .m08-sm-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .m08-sm-search-wrapper {
          position: relative;
          flex: 1 1 320px;
          min-width: 240px;
        }

        .m08-sm-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          font-size: 14px;
          pointer-events: none;
        }

        .m08-sm-search-input {
          width: 100%;
          background-color: #F4F6FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 14px 11px 36px;
          font-size: 13.5px;
          color: #0F172A;
          box-sizing: border-box;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .m08-sm-search-input::placeholder {
          color: #8492A6;
        }

        .m08-sm-search-input:focus {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-sm-filter-select {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .m08-sm-filter-select:hover {
          background-color: #EBF0F7;
        }

        .m08-sm-filter-select:focus-visible {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-sm-export-btn {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: background-color 0.15s ease;
        }

        .m08-sm-export-btn:hover:not(:disabled) {
          background-color: #EBF0F7;
        }

        .m08-sm-export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .m08-sm-export-btn:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Table Styles matching Figma UI 17 */
        .m08-sm-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .m08-sm-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 820px;
        }

        .m08-sm-table thead tr {
          background-color: #F4F6FA;
        }

        .m08-sm-table th {
          text-align: left;
          padding: 13px 18px;
          font-size: 11px;
          font-weight: 600;
          color: #7C8BA1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-top: 1px solid #EEF2F7;
          border-bottom: 1px solid #EEF2F7;
        }

        .m08-sm-table th:first-child {
          border-top-left-radius: 8px;
          border-left: 1px solid #EEF2F7;
        }

        .m08-sm-table th:last-child {
          border-top-right-radius: 8px;
          border-right: 1px solid #EEF2F7;
        }

        .m08-sm-table tbody tr {
          background-color: #FFFFFF;
          transition: background-color 0.12s ease;
        }

        .m08-sm-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .m08-sm-table tbody tr.m08-sm-row-selected {
          background-color: #F0F5FF;
        }

        .m08-sm-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #EEF2F7;
          vertical-align: middle;
          font-size: 13.5px;
        }

        .m08-sm-table td:first-child {
          border-left: 1px solid #EEF2F7;
        }

        .m08-sm-table td:last-child {
          border-right: 1px solid #EEF2F7;
        }

        .m08-sm-record-primary {
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .m08-sm-dot {
          color: #64748B;
        }

        .m08-sm-record-secondary {
          font-size: 12px;
          color: #64748B;
        }

        .m08-sm-category-primary {
          color: #64748B;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .m08-sm-category-secondary {
          font-size: 11.5px;
          color: #94A3B8;
        }

        .m08-sm-qty-value {
          display: block;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .m08-sm-qty-direction {
          display: block;
          font-size: 11.5px;
          color: #64748B;
        }

        /* Status Pill Badges matching Figma UI 17 */
        .m08-sm-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          min-width: 82px;
        }

        .m08-sm-badge-blue {
          background-color: #EBF1FF;
          color: #24539B;
        }

        .m08-sm-badge-amber {
          background-color: #FEF3C7;
          color: #9A6B13;
        }

        .m08-sm-td-date {
          color: #64748B;
          white-space: nowrap;
          font-size: 13px;
        }

        .m08-sm-view-btn {
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
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .m08-sm-view-btn:hover {
          background-color: #EBF1FF;
          color: #1D437F;
        }

        .m08-sm-view-btn:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Pagination Footer matching Figma UI 17 */
        .m08-sm-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .m08-sm-pagination-summary {
          font-size: 12.5px;
          color: #64748B;
        }

        .m08-sm-pagination-controls {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #F4F6FA;
          padding: 5px 10px;
          border-radius: 999px;
        }

        .m08-sm-page-btn {
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
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .m08-sm-page-btn:hover:not(:disabled) {
          background-color: #E2E8F0;
          color: #0F172A;
        }

        .m08-sm-page-btn-active {
          color: #0F172A;
          font-weight: 700;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-sm-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .m08-sm-page-btn:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Loading, Empty & Error States */
        .m08-sm-state-box {
          padding: 48px 24px;
          text-align: center;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          background-color: #F8FAFC;
        }

        .m08-sm-state-error {
          border-color: #FCA5A5;
          background-color: #FEF2F2;
        }

        .m08-sm-state-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
        }

        .m08-sm-state-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 16px 0;
        }

        .m08-sm-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #E2E8F0;
          border-top-color: #24539B;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: m08-spin 0.8s linear infinite;
        }

        @keyframes m08-spin {
          to { transform: rotate(360deg); }
        }

        /* Accessible Modal Dialog */
        .m08-sm-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .m08-sm-modal {
          background-color: #FFFFFF;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .m08-sm-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          border-bottom: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        .m08-sm-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-sm-modal-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .m08-sm-modal-close {
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 16px;
          color: #64748B;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .m08-sm-modal-close:hover {
          background-color: #E2E8F0;
          color: #0F172A;
        }

        .m08-sm-modal-body {
          padding: 24px 26px;
        }

        .m08-sm-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .m08-sm-detail-item {
          background-color: #F8FAFC;
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .m08-sm-detail-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 4px;
        }

        .m08-sm-detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
          word-break: break-word;
        }

        .m08-sm-detail-notes {
          background-color: #F8FAFC;
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .m08-sm-immutable-notice {
          background-color: #EBF1FF;
          border: 1px solid #BFDBFE;
          color: #1E3A8A;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12.5px;
          line-height: 1.5;
        }

        .m08-sm-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 26px;
          border-top: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        @media (max-width: 768px) {
          .m08-sm-page {
            padding: 20px 16px 32px;
          }
          .m08-sm-card {
            padding: 20px 16px;
          }
          .m08-sm-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="m08-sm-container">
        {/* Page Heading Row matching Figma UI 17 */}
        <header className="m08-sm-header">
          <div className="m08-sm-title-group">
            <div className="m08-sm-title-row">
              <h1 id="m08-sm-page-title" className="m08-sm-title">
                Stock Movements
              </h1>
              {IS_DEVELOPMENT_MOCK_MODE && (
                <span
                  className="m08-sm-mock-pill"
                  title={`Using local development mock dataset (${API_ENDPOINTS.LIST_STOCK_MOVEMENTS})`}
                >
                  Dev Mock Mode
                </span>
              )}
            </div>
            <p className="m08-sm-subtitle">
              Full history of all additions and reductions
            </p>
          </div>

          <div className="m08-sm-header-actions">
            <button
              type="button"
              className="m08-sm-btn-primary"
              onClick={() => setShowNewRecordModal(true)}
            >
              <span aria-hidden="true">+</span>
              <span>New record</span>
            </button>
          </div>
        </header>

        {/* Main White Content Panel matching Figma UI 17 */}
        <div className="m08-sm-card">
          <div className="m08-sm-card-header">
            <div>
              <h2 className="m08-sm-card-title">Stock Movements directory</h2>
              <p className="m08-sm-card-subtitle">
                Search, filter and review operational records
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                className="m08-sm-btn-secondary"
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Search & Filter Controls matching Figma UI 17 */}
          <div
            className="m08-sm-toolbar"
            role="search"
            aria-label="Filter stock movements"
          >
            <div className="m08-sm-search-wrapper">
              <span className="m08-sm-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                className="m08-sm-search-input"
                placeholder="Search by name, ID or SKU..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search stock movements by product name, record ID, variant ID, SKU, reference, or notes"
              />
            </div>

            <select
              className="m08-sm-filter-select"
              value={movementTypeFilter}
              onChange={handleMovementTypeChange}
              aria-label="Filter by movement type or direction"
            >
              <option value="ALL">Status: All</option>
              <optgroup label="Direction">
                <option value="DIRECTION_INBOUND">Inbound (Additions)</option>
                <option value="DIRECTION_OUTBOUND">Outbound (Reductions)</option>
              </optgroup>
              <optgroup label="SQL Movement Type (ENUM)">
                {VALID_MOVEMENT_TYPES.map((typeCode) => (
                  <option key={typeCode} value={typeCode}>
                    {MOVEMENT_TYPE_META[typeCode]?.label || typeCode} ({typeCode})
                  </option>
                ))}
              </optgroup>
            </select>

            <select
              className="m08-sm-filter-select"
              value={categoryFilter}
              onChange={handleCategoryChange}
              aria-label="Filter by operational category"
            >
              <option value="ALL">Category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="m08-sm-filter-select"
              value={dateFilter}
              onChange={handleDateChange}
              aria-label="Filter by movement date"
            >
              <option value="ALL">Date: All</option>
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="m08-sm-export-btn"
              onClick={handleExportCsv}
              disabled={isLoading || filteredMovements.length === 0}
              aria-label="Export filtered stock movements to CSV"
            >
              <span>Export CSV</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          {/* Stock Movements Table */}
          <MovementTable
            movements={paginatedMovements}
            totalFilteredCount={filteredMovements.length}
            currentPage={safeCurrentPage}
            pageSize={PAGE_SIZE}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onViewDetails={handleViewDetails}
            onResetFilters={handleResetFilters}
            onRetry={() => loadMovements(false)}
            isLoading={isLoading}
            error={error}
            selectedMovementId={selectedMovement?.movement_id || null}
          />
        </div>
      </div>

      {/* Stock Movement Details Modal (GET /api/v1/stock-movements/{id}) */}
      {(selectedMovement || detailsError) && (
        <div
          className="m08-sm-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m08-sm-detail-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMovement(null);
              setDetailsError(null);
            }
          }}
        >
          <div className="m08-sm-modal">
            <div className="m08-sm-modal-header">
              <div>
                <h3 id="m08-sm-detail-modal-title" className="m08-sm-modal-title">
                  {selectedMovement
                    ? `REC-${selectedMovement.movement_id} · ${selectedMovement.product_name}`
                    : 'Movement Details Error'}
                </h3>
                <p className="m08-sm-modal-subtitle">
                  {selectedMovement
                    ? `Endpoint: ${API_ENDPOINTS.GET_STOCK_MOVEMENT_BY_ID(
                        selectedMovement.movement_id
                      )} (Development Mock Data)`
                    : 'Unable to retrieve record'}
                </p>
              </div>
              <button
                type="button"
                className="m08-sm-modal-close"
                onClick={() => {
                  setSelectedMovement(null);
                  setDetailsError(null);
                }}
                aria-label="Close movement details dialog"
              >
                ✕
              </button>
            </div>

            <div className="m08-sm-modal-body">
              {detailsError ? (
                <p className="m08-sm-state-subtitle">{detailsError}</p>
              ) : (
                <>
                  <div className="m08-sm-detail-grid">
                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Movement ID (PK)
                      </div>
                      <div className="m08-sm-detail-value">
                        #{selectedMovement.movement_id} (REC-
                        {selectedMovement.movement_id})
                      </div>
                    </div>

                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Movement Type (ENUM)
                      </div>
                      <div className="m08-sm-detail-value">
                        <span
                          className={`m08-sm-badge ${
                            selectedMeta?.badgeTone === 'amber'
                              ? 'm08-sm-badge-amber'
                              : 'm08-sm-badge-blue'
                          }`}
                        >
                          {selectedMovement.movement_type}
                        </span>
                      </div>
                    </div>

                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Variant ID (FK) & SKU
                      </div>
                      <div className="m08-sm-detail-value">
                        Variant #{selectedMovement.variant_id} ·{' '}
                        {selectedMovement.sku} ({selectedMovement.size_name} /{' '}
                        {selectedMovement.colour_name})
                      </div>
                    </div>

                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Quantity & Direction
                      </div>
                      <div className="m08-sm-detail-value">
                        {selectedMeta?.sign}
                        {selectedMovement.quantity} units (
                        {selectedMeta?.direction === 'INBOUND'
                          ? 'Inbound Addition'
                          : 'Outbound Reduction'}
                        )
                      </div>
                    </div>

                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Reference Type & ID
                      </div>
                      <div className="m08-sm-detail-value">
                        {selectedMovement.reference_type || 'N/A'} #
                        {selectedMovement.reference_id ?? 'N/A'}
                      </div>
                    </div>

                    <div className="m08-sm-detail-item">
                      <div className="m08-sm-detail-label">
                        Movement Date (UTC)
                      </div>
                      <div className="m08-sm-detail-value">
                        {formatMovementDateTime(selectedMovement.movement_date)}
                      </div>
                    </div>
                  </div>

                  <div className="m08-sm-detail-notes">
                    <div className="m08-sm-detail-label">
                      Operational Notes (notes)
                    </div>
                    <div className="m08-sm-detail-value">
                      {selectedMovement.notes || 'No notes recorded.'}
                    </div>
                  </div>

                  <div className="m08-sm-immutable-notice">
                    <strong>ADBMS Immutability Policy:</strong> This record is
                    protected by MySQL triggers{' '}
                    <code>trg_before_stock_movement_update_block</code> and{' '}
                    <code>trg_before_stock_movement_delete_block</code> (
                    <code>SQLSTATE &apos;45000&apos;</code>). Stock movements
                    cannot be edited or deleted once recorded.
                  </div>
                </>
              )}
            </div>

            <div className="m08-sm-modal-footer">
              <button
                type="button"
                className="m08-sm-btn-primary"
                onClick={() => {
                  setSelectedMovement(null);
                  setDetailsError(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "+ New record" Ledger Guidance Modal */}
      {showNewRecordModal && (
        <div
          className="m08-sm-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m08-sm-new-record-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewRecordModal(false);
            }
          }}
        >
          <div className="m08-sm-modal">
            <div className="m08-sm-modal-header">
              <div>
                <h3
                  id="m08-sm-new-record-modal-title"
                  className="m08-sm-modal-title"
                >
                  Recording a New Stock Movement
                </h3>
                <p className="m08-sm-modal-subtitle">
                  CloudDB Sentinel Append-Only Inventory Ledger Policy
                </p>
              </div>
              <button
                type="button"
                className="m08-sm-modal-close"
                onClick={() => setShowNewRecordModal(false)}
                aria-label="Close new record guidance dialog"
              >
                ✕
              </button>
            </div>

            <div className="m08-sm-modal-body">
              <div className="m08-sm-detail-notes">
                <div className="m08-sm-detail-label">How movements are created</div>
                <div className="m08-sm-detail-value">
                  In CloudDB Sentinel, entries in <code>stock_movements</code>{' '}
                  are generated automatically through transactional workflows
                  that invoke <code>sp_update_inventory</code>:
                  <ul style={{ margin: '10px 0 0 18px', padding: 0 }}>
                    <li>
                      <strong>Stock Adjustments</strong> (
                      <code>ADJUSTMENT_IN</code>, <code>ADJUSTMENT_OUT</code>,{' '}
                      <code>DAMAGE</code>) via{' '}
                      <code>POST /api/v1/stock-adjustments</code>
                    </li>
                    <li>
                      <strong>Sales Returns</strong> (
                      <code>CUSTOMER_RETURN</code>) via{' '}
                      <code>POST /api/v1/returns</code>
                    </li>
                    <li>
                      <strong>Supplier Purchases</strong> (<code>PURCHASE</code>,{' '}
                      <code>SUPPLIER_RETURN</code>)
                    </li>
                    <li>
                      <strong>Customer Sales</strong> (<code>SALE</code>)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="m08-sm-immutable-notice">
                Once shared navigation (<code>AppRoutes.jsx</code>, Member 02)
                and the Stock Adjustment / Sales Return forms are integrated,
                this action routes directly to the Stock Adjustment &amp; Return
                creation workflows.
              </div>
            </div>

            <div className="m08-sm-modal-footer">
              <button
                type="button"
                className="m08-sm-btn-primary"
                onClick={() => setShowNewRecordModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
