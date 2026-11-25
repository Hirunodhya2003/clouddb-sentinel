// Owner: Member 08
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MovementForm from '../../components/stock-movements/MovementForm.jsx';
import {
  formatMovementDate,
  formatMovementDateTime,
} from '../../components/stock-movements/MovementTable.jsx';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_ADJUSTMENT_TYPES,
  VALID_ADJUSTMENT_STATUSES,
  ADJUSTMENT_TYPE_META,
  ADJUSTMENT_STATUS_META,
  getMockProductVariants,
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
} from '../../services/stockMovementService.js';

const PAGE_SIZE = 6;

export default function StockAdjustment() {
  const [adjustments, setAdjustments] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVariantsLoading, setIsVariantsLoading] = useState(true);
  const [variantsError, setVariantsError] = useState(null);

  // View toggle: 'list' (Figma UI 18) vs 'create' (Figma UI 19)
  const [activeView, setActiveView] = useState('list');

  // Search, Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Details Modal & Last Created Banner State
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [recentMockBanner, setRecentMockBanner] = useState(null);

  const loadProductVariants = useCallback(async () => {
    setIsVariantsLoading(true);
    setVariantsError(null);
    try {
      const variantsRes = await getMockProductVariants();
      setVariants(Array.isArray(variantsRes.items) ? variantsRes.items : []);
    } catch (err) {
      setVariantsError(
        err instanceof Error
          ? err.message
          : 'Unable to load product variants from the database.'
      );
      setVariants([]);
    } finally {
      setIsVariantsLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (simulateError = false) => {
      setIsLoading(true);
      setError(null);

      const adjustmentsPromise = (async () => {
        try {
          const adjustmentsRes = await getStockAdjustments({ simulateError });
          setAdjustments(
            Array.isArray(adjustmentsRes.items) ? adjustmentsRes.items : []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while loading stock adjustments.'
          );
          setAdjustments([]);
        } finally {
          setIsLoading(false);
        }
      })();

      await Promise.all([adjustmentsPromise, loadProductVariants()]);
    },
    [loadProductVariants]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Escape key closes details modal
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && (selectedAdjustment || detailsError)) {
        setSelectedAdjustment(null);
        setDetailsError(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAdjustment, detailsError]);

  const existingReferences = useMemo(
    () => adjustments.map((adj) => adj.adjustment_reference),
    [adjustments]
  );

  const dateOptions = useMemo(() => {
    const map = new Map();
    adjustments.forEach((adj) => {
      if (adj.adjustment_date) {
        const isoDateKey = adj.adjustment_date.slice(0, 10);
        if (!map.has(isoDateKey)) {
          map.set(isoDateKey, formatMovementDate(adj.adjustment_date));
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [adjustments]);

  const filteredAdjustments = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return adjustments.filter((adj) => {
      if (statusFilter !== 'ALL' && adj.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'ALL' && adj.adjustment_type !== typeFilter) {
        return false;
      }

      if (dateFilter !== 'ALL') {
        const recordDate = (adj.adjustment_date || '').slice(0, 10);
        if (recordDate !== dateFilter) return false;
      }

      if (trimmedQuery) {
        const itemFields = (adj.items || []).flatMap((item) => [
          String(item.variant_id),
          item.sku,
          item.product_name,
          item.category_name,
          item.item_reason,
        ]);

        const searchableFields = [
          String(adj.adjustment_id),
          `rec-${adj.adjustment_id}`,
          adj.adjustment_reference,
          adj.adjustment_type,
          adj.adjustment_type_label,
          adj.category_label,
          adj.status,
          adj.reason,
          ...itemFields,
        ];

        const matches = searchableFields.some(
          (field) => field && String(field).toLowerCase().includes(trimmedQuery)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [adjustments, searchQuery, statusFilter, typeFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdjustments.length / PAGE_SIZE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAdjustments = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAdjustments.slice(start, start + PAGE_SIZE);
  }, [filteredAdjustments, safeCurrentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setDateFilter('ALL');
    setCurrentPage(1);
  };

  const handleViewDetails = async (adjustmentId) => {
    setDetailsError(null);
    try {
      const response = await getStockAdjustmentById(adjustmentId);
      setSelectedAdjustment(response.item);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : 'Unable to load details for the selected stock adjustment.'
      );
    }
  };

  const handleSubmitAdjustment = async (payload) => {
    const response = await createStockAdjustment(payload);
    await loadData(false);
    setCurrentPage(1);
    setRecentMockBanner({
      reference: response.item.adjustment_reference,
      status: response.item.status,
      notice: response.notice,
    });
    return response;
  };

  const handleExportCsv = () => {
    if (!filteredAdjustments.length) return;

    const headers = [
      'adjustment_id',
      'adjustment_reference',
      'adjustment_date',
      'adjustment_type',
      'status',
      'variant_id',
      'sku',
      'product_name',
      'quantity_before',
      'quantity_after',
      'quantity_difference_display',
      'reason',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredAdjustments.map((adj) => {
      const firstItem = adj.primary_item || {};
      return [
        adj.adjustment_id,
        adj.adjustment_reference,
        adj.adjustment_date,
        adj.adjustment_type,
        adj.status,
        firstItem.variant_id ?? '',
        firstItem.sku ?? '',
        firstItem.product_name ?? '',
        firstItem.quantity_before ?? '',
        firstItem.quantity_after ?? '',
        firstItem.quantity_difference ?? '',
        adj.reason,
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock_adjustments_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    dateFilter !== 'ALL';

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(
    startIndex + paginatedAdjustments.length - 1,
    filteredAdjustments.length
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <section
      className="m08-sa-page"
      aria-label="Stock Adjustments Management"
    >
      <style>{`
        .m08-sa-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #F5F7FB;
          color: #0F172A;
          min-height: 100%;
          padding: 32px 36px 48px;
          box-sizing: border-box;
        }

        .m08-sa-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Header matching Figma UI 18 & UI 19 */
        .m08-sa-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .m08-sa-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m08-sa-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .m08-sa-title {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .m08-sa-mock-pill {
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

        .m08-sa-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        .m08-sa-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .m08-sa-btn-primary {
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

        .m08-sa-btn-primary:hover:not(:disabled) {
          background-color: #1D437F;
        }

        .m08-sa-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .m08-sa-btn-primary:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        .m08-sa-btn-secondary {
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

        .m08-sa-btn-secondary:hover:not(:disabled) {
          background-color: #E8ECF4;
        }

        .m08-sa-btn-secondary:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Main White Card matching Figma UI 18 & UI 19 */
        .m08-sa-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF2F7;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          padding: 28px 32px;
        }

        .m08-sa-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .m08-sa-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-sa-card-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        /* Alerts */
        .m08-sa-alert {
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          line-height: 1.5;
        }

        .m08-sa-alert-error {
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
          color: #991B1B;
        }

        .m08-sa-alert-success {
          background-color: #EBF1FF;
          border: 1px solid #BFDBFE;
          color: #1E3A8A;
        }

        .m08-sa-alert-title {
          font-weight: 700;
          margin-bottom: 4px;
        }

        .m08-sa-alert-text {
          margin: 0;
        }

        /* Toolbar matching Figma UI 18 */
        .m08-sa-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .m08-sa-search-wrapper {
          position: relative;
          flex: 1 1 300px;
          min-width: 240px;
        }

        .m08-sa-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          font-size: 14px;
          pointer-events: none;
        }

        .m08-sa-search-input {
          width: 100%;
          background-color: #F4F6FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 14px 11px 36px;
          font-size: 13.5px;
          color: #0F172A;
          box-sizing: border-box;
        }

        .m08-sa-search-input::placeholder {
          color: #8492A6;
        }

        .m08-sa-search-input:focus {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-sa-filter-select {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .m08-sa-filter-select:hover {
          background-color: #EBF0F7;
        }

        .m08-sa-filter-select:focus-visible {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-sa-export-btn {
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
        }

        .m08-sa-export-btn:hover:not(:disabled) {
          background-color: #EBF0F7;
        }

        .m08-sa-export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Directory Table matching Figma UI 18 */
        .m08-sa-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .m08-sa-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 820px;
        }

        .m08-sa-table thead tr {
          background-color: #F4F6FA;
        }

        .m08-sa-table th {
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

        .m08-sa-table th:first-child {
          border-top-left-radius: 8px;
          border-left: 1px solid #EEF2F7;
        }

        .m08-sa-table th:last-child {
          border-top-right-radius: 8px;
          border-right: 1px solid #EEF2F7;
        }

        .m08-sa-table tbody tr {
          background-color: #FFFFFF;
          transition: background-color 0.12s ease;
        }

        .m08-sa-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .m08-sa-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #EEF2F7;
          vertical-align: middle;
          font-size: 13.5px;
        }

        .m08-sa-table td:first-child {
          border-left: 1px solid #EEF2F7;
        }

        .m08-sa-table td:last-child {
          border-right: 1px solid #EEF2F7;
        }

        .m08-sa-record-primary {
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .m08-sa-dot {
          color: #64748B;
        }

        .m08-sa-record-secondary {
          font-size: 12px;
          color: #64748B;
        }

        .m08-sa-category-primary {
          color: #64748B;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .m08-sa-category-secondary {
          font-size: 11.5px;
          color: #94A3B8;
          max-width: 280px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .m08-sa-qty-value {
          display: block;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .m08-sa-qty-sub {
          display: block;
          font-size: 11.5px;
          color: #64748B;
        }

        .m08-sa-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          min-width: 82px;
        }

        .m08-sa-badge-blue {
          background-color: #EBF1FF;
          color: #24539B;
        }

        .m08-sa-badge-amber {
          background-color: #FEF3C7;
          color: #9A6B13;
        }

        .m08-sa-td-date {
          color: #64748B;
          white-space: nowrap;
          font-size: 13px;
        }

        .m08-sa-view-btn {
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

        .m08-sa-view-btn:hover {
          background-color: #EBF1FF;
          color: #1D437F;
        }

        .m08-sa-view-btn:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Pagination Footer matching Figma UI 18 */
        .m08-sa-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .m08-sa-pagination-summary {
          font-size: 12.5px;
          color: #64748B;
        }

        .m08-sa-pagination-controls {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #F4F6FA;
          padding: 5px 10px;
          border-radius: 999px;
        }

        .m08-sa-page-btn {
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

        .m08-sa-page-btn:hover:not(:disabled) {
          background-color: #E2E8F0;
          color: #0F172A;
        }

        .m08-sa-page-btn-active {
          color: #0F172A;
          font-weight: 700;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-sa-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Create Stock Adjustment Form Styles matching Figma UI 19 */
        .m08-sa-form-section-header {
          margin-bottom: 24px;
        }

        .m08-sa-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 32px;
          row-gap: 24px;
          margin-bottom: 32px;
        }

        .m08-sa-subgrid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .m08-sa-subgrid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .m08-sa-field {
          display: flex;
          flex-direction: column;
        }

        .m08-sa-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .m08-sa-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 8px;
        }

        .m08-sa-link-btn {
          background: transparent;
          border: none;
          color: #24539B;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 8px;
        }

        .m08-sa-link-btn:hover {
          text-decoration: underline;
        }

        .m08-sa-input {
          width: 100%;
          background-color: #F4F6FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 13.5px;
          font-weight: 500;
          color: #0F172A;
          box-sizing: border-box;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .m08-sa-input::placeholder {
          color: #64748B;
        }

        .m08-sa-input:focus {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-sa-input-readonly {
          color: #334155;
          background-color: #F4F6FA;
          cursor: default;
          font-weight: 600;
        }

        .m08-sa-input-error {
          border-color: #EF4444;
          background-color: #FEF2F2;
        }

        .m08-sa-field-hint {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 6px;
          line-height: 1.4;
        }

        .m08-sa-field-error {
          font-size: 12px;
          color: #DC2626;
          font-weight: 600;
          margin-top: 6px;
        }

        .m08-sa-form-footer {
          border-top: 1px solid #EEF2F7;
          padding-top: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .m08-sa-footer-note {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .m08-sa-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* States & Modals */
        .m08-sa-state-box {
          padding: 48px 24px;
          text-align: center;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          background-color: #F8FAFC;
        }

        .m08-sa-state-error {
          border-color: #FCA5A5;
          background-color: #FEF2F2;
        }

        .m08-sa-state-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
        }

        .m08-sa-state-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 16px 0;
        }

        .m08-sa-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #E2E8F0;
          border-top-color: #24539B;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: m08-sa-spin 0.8s linear infinite;
        }

        @keyframes m08-sa-spin {
          to { transform: rotate(360deg); }
        }

        .m08-sa-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .m08-sa-modal {
          background-color: #FFFFFF;
          border-radius: 16px;
          max-width: 680px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .m08-sa-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          border-bottom: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        .m08-sa-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-sa-modal-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .m08-sa-modal-close {
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 16px;
          color: #64748B;
          cursor: pointer;
        }

        .m08-sa-modal-body {
          padding: 24px 26px;
          max-height: 75vh;
          overflow-y: auto;
        }

        .m08-sa-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .m08-sa-detail-item {
          background-color: #F8FAFC;
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .m08-sa-detail-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 4px;
        }

        .m08-sa-detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .m08-sa-items-box {
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 16px;
        }

        .m08-sa-items-header {
          background-color: #F4F6FA;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          border-bottom: 1px solid #EEF2F7;
        }

        .m08-sa-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 26px;
          border-top: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        @media (max-width: 860px) {
          .m08-sa-page {
            padding: 20px 16px 32px;
          }
          .m08-sa-card {
            padding: 20px 16px;
          }
          .m08-sa-form-grid,
          .m08-sa-subgrid-2,
          .m08-sa-subgrid-3,
          .m08-sa-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="m08-sa-container">
        {activeView === 'create' ? (
          <MovementForm
            variants={variants}
            isVariantsLoading={isVariantsLoading}
            variantsError={variantsError}
            onRetryLoadVariants={loadProductVariants}
            existingReferences={existingReferences}
            onSubmitAdjustment={handleSubmitAdjustment}
            onCancel={() => setActiveView('list')}
          />
        ) : (
          <>
            {/* Top Header matching Figma UI 18 */}
            <header className="m08-sa-header">
              <div className="m08-sa-title-group">
                <div className="m08-sa-title-row">
                  <h1 className="m08-sa-title">Stock Adjustments</h1>
                  {IS_DEVELOPMENT_MOCK_MODE && (
                    <span
                      className="m08-sa-mock-pill"
                      title={`Using local development mock dataset (${API_ENDPOINTS.LIST_STOCK_ADJUSTMENTS})`}
                    >
                      Dev Mock Mode
                    </span>
                  )}
                </div>
                <p className="m08-sa-subtitle">
                  Reconcile stock counts and explain adjustments
                </p>
              </div>

              <div className="m08-sa-header-actions">
                <button
                  type="button"
                  className="m08-sa-btn-primary"
                  onClick={() => setActiveView('create')}
                >
                  <span aria-hidden="true">+</span>
                  <span>New record</span>
                </button>
              </div>
            </header>

            {/* Main White Content Panel matching Figma UI 18 */}
            <div className="m08-sa-card">
              <div className="m08-sa-card-header">
                <div>
                  <h2 className="m08-sa-card-title">
                    Stock Adjustments directory
                  </h2>
                  <p className="m08-sa-card-subtitle">
                    Search, filter and review operational records
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="m08-sa-btn-secondary"
                    onClick={handleResetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {recentMockBanner && (
                <div
                  className="m08-sa-alert m08-sa-alert-success"
                  role="status"
                >
                  <div className="m08-sa-alert-title">
                    {IS_DEVELOPMENT_MOCK_MODE
                      ? 'Recent Mock Submission:'
                      : 'Recent Adjustment Submission (PENDING):'}{' '}
                    {recentMockBanner.reference} ({recentMockBanner.status})
                  </div>
                  <p className="m08-sa-alert-text">
                    {recentMockBanner.notice}
                  </p>
                </div>
              )}

              {/* Search & Filter Controls matching Figma UI 18 */}
              <div
                className="m08-sa-toolbar"
                role="search"
                aria-label="Filter stock adjustments"
              >
                <div className="m08-sa-search-wrapper">
                  <span className="m08-sa-search-icon" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    type="search"
                    className="m08-sa-search-input"
                    placeholder="Search by name, ID or SKU..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Search stock adjustments by reference, ID, product name, SKU, or reason"
                  />
                </div>

                <select
                  className="m08-sa-filter-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by adjustment status"
                >
                  <option value="ALL">Status: All</option>
                  {VALID_ADJUSTMENT_STATUSES.map((statusCode) => (
                    <option key={statusCode} value={statusCode}>
                      {ADJUSTMENT_STATUS_META[statusCode]?.label || statusCode}{' '}
                      ({statusCode})
                    </option>
                  ))}
                </select>

                <select
                  className="m08-sa-filter-select"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by adjustment type"
                >
                  <option value="ALL">Category</option>
                  {VALID_ADJUSTMENT_TYPES.map((typeCode) => (
                    <option key={typeCode} value={typeCode}>
                      {ADJUSTMENT_TYPE_META[typeCode]?.label || typeCode} (
                      {typeCode})
                    </option>
                  ))}
                </select>

                <select
                  className="m08-sa-filter-select"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by adjustment date"
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
                  className="m08-sa-export-btn"
                  onClick={handleExportCsv}
                  disabled={isLoading || filteredAdjustments.length === 0}
                >
                  <span>Export CSV</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>

              {/* Loading, Error, Empty, or Table State */}
              {isLoading ? (
                <div
                  className="m08-sa-state-box"
                  role="status"
                  aria-busy="true"
                >
                  <div className="m08-sa-spinner" aria-hidden="true" />
                  <p className="m08-sa-state-title">
                    Loading stock adjustments...
                  </p>
                  <p className="m08-sa-state-subtitle">
                    Preparing stock_adjustments and stock_adjustment_items records.
                  </p>
                </div>
              ) : error ? (
                <div
                  className="m08-sa-state-box m08-sa-state-error"
                  role="alert"
                >
                  <p className="m08-sa-state-title">
                    Unable to load stock adjustments
                  </p>
                  <p className="m08-sa-state-subtitle">{error}</p>
                  <button
                    type="button"
                    className="m08-sa-btn-secondary"
                    onClick={() => loadData(false)}
                  >
                    Retry loading
                  </button>
                </div>
              ) : filteredAdjustments.length === 0 ? (
                <div className="m08-sa-state-box" role="status">
                  <p className="m08-sa-state-title">
                    No matching stock adjustments found
                  </p>
                  <p className="m08-sa-state-subtitle">
                    No adjustment records match your active search or filters.
                  </p>
                  <button
                    type="button"
                    className="m08-sa-btn-secondary"
                    onClick={handleResetFilters}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="m08-sa-table-scroll">
                    <table
                      className="m08-sa-table"
                      aria-label="Stock Adjustments directory table"
                    >
                      <thead>
                        <tr>
                          <th scope="col">RECORD</th>
                          <th scope="col">CATEGORY / TYPE</th>
                          <th scope="col">QUANTITY / VALUE</th>
                          <th scope="col">STATUS</th>
                          <th scope="col">UPDATED</th>
                          <th scope="col">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAdjustments.map((adj) => {
                          const item = adj.primary_item;
                          const diff = adj.net_quantity_difference;
                          const diffText = `${diff > 0 ? '+' : ''}${diff} units`;

                          return (
                            <tr key={adj.adjustment_id}>
                              <td>
                                <div className="m08-sa-record-primary">
                                  <span>{adj.adjustment_reference}</span>
                                  <span
                                    className="m08-sa-dot"
                                    aria-hidden="true"
                                  >
                                    ·
                                  </span>
                                  <span>
                                    {item
                                      ? item.product_name
                                      : 'Stock Adjustment'}
                                  </span>
                                </div>
                                <div className="m08-sa-record-secondary">
                                  Adjustment #{adj.adjustment_id}
                                  {item
                                    ? ` · SKU: ${item.sku} (Variant #${item.variant_id})`
                                    : ''}
                                </div>
                              </td>

                              <td>
                                <div className="m08-sa-category-primary">
                                  {adj.category_label} ·{' '}
                                  {adj.adjustment_type_label}
                                </div>
                                <div
                                  className="m08-sa-category-secondary"
                                  title={adj.reason}
                                >
                                  {adj.reason}
                                </div>
                              </td>

                              <td>
                                <span className="m08-sa-qty-value">
                                  {diffText}
                                </span>
                                {item && (
                                  <span className="m08-sa-qty-sub">
                                    Before: {item.quantity_before} → After:{' '}
                                    {item.quantity_after}
                                  </span>
                                )}
                              </td>

                              <td>
                                <span
                                  className={`m08-sa-badge ${
                                    adj.badge_tone === 'amber'
                                      ? 'm08-sa-badge-amber'
                                      : 'm08-sa-badge-blue'
                                  }`}
                                >
                                  {adj.status_label}
                                </span>
                              </td>

                              <td className="m08-sa-td-date">
                                {formatMovementDate(adj.adjustment_date)}
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="m08-sa-view-btn"
                                  onClick={() =>
                                    handleViewDetails(adj.adjustment_id)
                                  }
                                  aria-label={`View details for ${adj.adjustment_reference}`}
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

                  {/* Pagination Footer matching Figma UI 18 */}
                  <div className="m08-sa-pagination-bar">
                    <div
                      className="m08-sa-pagination-summary"
                      aria-live="polite"
                    >
                      Showing {startIndex}–{endIndex} of{' '}
                      {filteredAdjustments.length} records
                    </div>

                    <nav
                      className="m08-sa-pagination-controls"
                      aria-label="Stock adjustments pagination"
                    >
                      {safeCurrentPage > 1 && (
                        <button
                          type="button"
                          className="m08-sa-page-btn"
                          onClick={() => setCurrentPage(safeCurrentPage - 1)}
                          aria-label="Previous page"
                        >
                          ←
                        </button>
                      )}

                      {pageNumbers.map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`m08-sa-page-btn ${
                            num === safeCurrentPage
                              ? 'm08-sa-page-btn-active'
                              : ''
                          }`}
                          onClick={() => setCurrentPage(num)}
                          aria-current={
                            num === safeCurrentPage ? 'page' : undefined
                          }
                          aria-label={`Page ${num}`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="m08-sa-page-btn"
                        onClick={() =>
                          safeCurrentPage < totalPages &&
                          setCurrentPage(safeCurrentPage + 1)
                        }
                        disabled={safeCurrentPage >= totalPages}
                        aria-label="Next page"
                      >
                        →
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stock Adjustment Details Modal (GET /api/v1/stock-adjustments/{id}) */}
      {(selectedAdjustment || detailsError) && (
        <div
          className="m08-sa-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m08-sa-detail-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedAdjustment(null);
              setDetailsError(null);
            }
          }}
        >
          <div className="m08-sa-modal">
            <div className="m08-sa-modal-header">
              <div>
                <h3
                  id="m08-sa-detail-modal-title"
                  className="m08-sa-modal-title"
                >
                  {selectedAdjustment
                    ? `${selectedAdjustment.adjustment_reference} · ${selectedAdjustment.adjustment_type_label}`
                    : 'Adjustment Details Error'}
                </h3>
                <p className="m08-sa-modal-subtitle">
                  {selectedAdjustment
                    ? `Endpoint: ${API_ENDPOINTS.GET_STOCK_ADJUSTMENT_BY_ID(
                        selectedAdjustment.adjustment_id
                      )} (${
                        IS_DEVELOPMENT_MOCK_MODE
                          ? 'Development Mock Data'
                          : 'Live Database Record'
                      })`
                    : 'Unable to retrieve record'}
                </p>
              </div>
              <button
                type="button"
                className="m08-sa-modal-close"
                onClick={() => {
                  setSelectedAdjustment(null);
                  setDetailsError(null);
                }}
                aria-label="Close adjustment details dialog"
              >
                ✕
              </button>
            </div>

            <div className="m08-sa-modal-body">
              {detailsError ? (
                <p className="m08-sa-state-subtitle">{detailsError}</p>
              ) : (
                <>
                  <div className="m08-sa-detail-grid">
                    <div className="m08-sa-detail-item">
                      <div className="m08-sa-detail-label">
                        Adjustment ID &amp; Reference
                      </div>
                      <div className="m08-sa-detail-value">
                        #{selectedAdjustment.adjustment_id} ·{' '}
                        {selectedAdjustment.adjustment_reference}
                      </div>
                    </div>

                    <div className="m08-sa-detail-item">
                      <div className="m08-sa-detail-label">
                        Status &amp; Type (ENUM)
                      </div>
                      <div className="m08-sa-detail-value">
                        <span
                          className={`m08-sa-badge ${
                            selectedAdjustment.badge_tone === 'amber'
                              ? 'm08-sa-badge-amber'
                              : 'm08-sa-badge-blue'
                          }`}
                        >
                          {selectedAdjustment.status}
                        </span>{' '}
                        · {selectedAdjustment.adjustment_type}
                      </div>
                    </div>

                    <div className="m08-sa-detail-item">
                      <div className="m08-sa-detail-label">
                        Adjustment Date (UTC)
                      </div>
                      <div className="m08-sa-detail-value">
                        {formatMovementDateTime(
                          selectedAdjustment.adjustment_date
                        )}
                      </div>
                    </div>

                    <div className="m08-sa-detail-item">
                      <div className="m08-sa-detail-label">
                        Created By / Approved By
                      </div>
                      <div className="m08-sa-detail-value">
                        User #{selectedAdjustment.created_by ?? 'N/A'} /{' '}
                        {selectedAdjustment.approved_by
                          ? `User #${selectedAdjustment.approved_by}`
                          : 'Pending Approval'}
                      </div>
                    </div>
                  </div>

                  <div className="m08-sa-detail-item">
                    <div className="m08-sa-detail-label">
                      Adjustment Reason (stock_adjustments.reason)
                    </div>
                    <div className="m08-sa-detail-value">
                      {selectedAdjustment.reason}
                    </div>
                  </div>

                  {/* Associated stock_adjustment_items Table */}
                  <div className="m08-sa-items-box">
                    <div className="m08-sa-items-header">
                      Associated Adjustment Items (stock_adjustment_items)
                    </div>
                    <div className="m08-sa-table-scroll">
                      <table
                        className="m08-sa-table"
                        style={{ minWidth: '540px' }}
                        aria-label="Associated stock adjustment items"
                      >
                        <thead>
                          <tr>
                            <th scope="col">VARIANT / SKU</th>
                            <th scope="col">QTY BEFORE</th>
                            <th scope="col">QTY AFTER</th>
                            <th scope="col">DIFFERENCE (GENERATED)</th>
                            <th scope="col">ITEM REASON</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedAdjustment.items || []).map((item) => (
                            <tr key={item.adjustment_item_id}>
                              <td>
                                <div className="m08-sa-record-primary">
                                  {item.sku} · {item.product_name}
                                </div>
                                <div className="m08-sa-record-secondary">
                                  Variant #{item.variant_id} ({item.size_name} /{' '}
                                  {item.colour_name})
                                </div>
                              </td>
                              <td>{item.quantity_before} units</td>
                              <td>{item.quantity_after} units</td>
                              <td>
                                <strong>
                                  {item.quantity_difference > 0 ? '+' : ''}
                                  {item.quantity_difference} units
                                </strong>
                              </td>
                              <td>{item.item_reason || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="m08-sa-modal-footer">
              <button
                type="button"
                className="m08-sa-btn-primary"
                onClick={() => {
                  setSelectedAdjustment(null);
                  setDetailsError(null);
                }}
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
