// Owner: Member 08
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  formatMovementDate,
  formatMovementDateTime,
} from '../../components/stock-movements/MovementTable.jsx';
import { formatCurrencyINR } from '../../components/stock-movements/MovementForm.jsx';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_MOVEMENT_TYPES,
  MOVEMENT_TYPE_META,
  VALID_ADJUSTMENT_TYPES,
  VALID_ADJUSTMENT_STATUSES,
  VALID_RETURN_STATUSES,
  getMovementHistorySnapshot,
} from '../../services/stockMovementService.js';

const PAGE_SIZE = 6;

const HISTORY_TABS = Object.freeze([
  {
    id: 'MOVEMENTS',
    label: 'Stock Movement Ledger',
    tableHint: 'stock_movements (Immutable)',
  },
  {
    id: 'ADJUSTMENTS',
    label: 'Adjustment History',
    tableHint: 'stock_adjustments',
  },
  {
    id: 'RETURNS',
    label: 'Return History',
    tableHint: 'sales_returns',
  },
  {
    id: 'COMBINED',
    label: 'Combined Chronological Timeline',
    tableHint: 'All Member 08 Streams',
  },
]);

export default function MovementHistory() {
  const [movements, setMovements] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active History View & Filters
  const [activeTab, setActiveTab] = useState('MOVEMENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [variantFilter, setVariantFilter] = useState('ALL');
  const [subTypeFilter, setSubTypeFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Record for Read-Only Details Modal
  const [selectedEntry, setSelectedEntry] = useState(null);

  const loadHistory = useCallback(async (simulateError = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await getMovementHistorySnapshot({ simulateError });
      setMovements(Array.isArray(snapshot.movements) ? snapshot.movements : []);
      setAdjustments(
        Array.isArray(snapshot.adjustments) ? snapshot.adjustments : []
      );
      setReturns(Array.isArray(snapshot.returns) ? snapshot.returns : []);
      setVariants(Array.isArray(snapshot.variants) ? snapshot.variants : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading movement history.'
      );
      setMovements([]);
      setAdjustments([]);
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(false);
  }, [loadHistory]);

  // Escape key closes details modal
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && selectedEntry) {
        setSelectedEntry(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntry]);

  // Summary KPIs across the loaded datasets
  const summaryStats = useMemo(() => {
    const inboundUnits = movements
      .filter((m) => m.direction === 'INBOUND')
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const outboundUnits = movements
      .filter((m) => m.direction === 'OUTBOUND')
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const completedAdjustments = adjustments.filter(
      (a) => a.status === 'COMPLETED'
    ).length;
    const pendingAdjustments = adjustments.filter(
      (a) => a.status === 'PENDING'
    ).length;
    const totalRefundValue = returns
      .filter((r) => r.return_status !== 'REJECTED')
      .reduce((sum, r) => sum + (Number(r.total_refund_amount) || 0), 0);

    return {
      totalMovements: movements.length,
      inboundUnits,
      outboundUnits,
      totalAdjustments: adjustments.length,
      completedAdjustments,
      pendingAdjustments,
      totalReturns: returns.length,
      totalRefundValue,
    };
  }, [movements, adjustments, returns]);

  // Normalize entries into a consistent structure while keeping raw original record untouched
  const normalizedEntries = useMemo(() => {
    const movementEntries = movements.map((m) => ({
      uniqueKey: `MOVEMENT-${m.movement_id}`,
      recordSource: 'STOCK_MOVEMENT',
      recordSourceLabel: 'Stock Movement',
      sourceBadgeTone: 'navy',
      primaryCode: `MOV-${m.movement_id}`,
      title: m.product_name,
      subtitle: `SKU: ${m.sku} · Variant #${m.variant_id} (${m.size_name} / ${m.colour_name})`,
      variantIds: [Number(m.variant_id)],
      categoryText: m.category_name,
      typeOrReferenceText: `${m.movement_type} · ${m.reference_code}`,
      filterCode: m.movement_type,
      direction: m.direction,
      quantityPrimary: `${m.sign}${m.quantity} units`,
      quantitySecondary:
        m.direction === 'INBOUND' ? 'Inbound Addition' : 'Outbound Reduction',
      statusLabel: m.movement_label,
      statusCode: m.movement_type,
      badgeTone: m.badge_tone,
      timestampIso: m.movement_date,
      notesText: m.notes || '',
      rawRecord: m,
    }));

    const adjustmentEntries = adjustments.map((a) => {
      const item = a.primary_item;
      const diff = a.net_quantity_difference;
      const linkedMovement = movements.find(
        (m) =>
          m.reference_type === 'STOCK_ADJUSTMENT' &&
          Number(m.reference_id) === Number(a.adjustment_id)
      );

      return {
        uniqueKey: `ADJUSTMENT-${a.adjustment_id}`,
        recordSource: 'STOCK_ADJUSTMENT',
        recordSourceLabel: 'Stock Adjustment',
        sourceBadgeTone: 'blue',
        primaryCode: a.adjustment_reference,
        title: item ? item.product_name : 'Stock Adjustment',
        subtitle: item
          ? `Adjustment #${a.adjustment_id} · SKU: ${item.sku} (Variant #${item.variant_id})`
          : `Adjustment #${a.adjustment_id}`,
        variantIds: (a.items || []).map((i) => Number(i.variant_id)),
        categoryText: `${a.category_label} · ${a.adjustment_type_label}`,
        typeOrReferenceText: linkedMovement
          ? `${a.adjustment_type} · Linked to MOV-${linkedMovement.movement_id}`
          : `${a.adjustment_type} · Reason: ${a.reason}`,
        filterCode: a.status,
        adjustmentTypeCode: a.adjustment_type,
        quantityPrimary: `${diff > 0 ? '+' : ''}${diff} units`,
        quantitySecondary: item
          ? `Before: ${item.quantity_before} → After: ${item.quantity_after}`
          : `${a.item_count} item(s)`,
        statusLabel: a.status_label,
        statusCode: a.status,
        badgeTone: a.badge_tone,
        timestampIso: a.adjustment_date,
        notesText: a.reason || '',
        linkedMovement,
        rawRecord: a,
      };
    });

    const returnEntries = returns.map((r) => {
      const item = r.primary_item;
      const linkedMovement = movements.find(
        (m) =>
          m.reference_type === 'SALES_RETURN' &&
          Number(m.reference_id) === Number(r.return_id)
      );

      return {
        uniqueKey: `RETURN-${r.return_id}`,
        recordSource: 'SALES_RETURN',
        recordSourceLabel: 'Sales Return',
        sourceBadgeTone: 'teal',
        primaryCode: `${r.return_code} (${r.sale_code})`,
        title: item ? item.product_name : r.sale_label,
        subtitle: `Invoice: ${r.invoice_number} · Customer: ${r.customer_name}${
          item ? ` · SKU: ${item.sku} (Variant #${item.variant_id})` : ''
        }`,
        variantIds: (r.items || [])
          .map((i) => Number(i.variant_id))
          .filter(Boolean),
        categoryText: r.category_label,
        typeOrReferenceText: linkedMovement
          ? `Linked to MOV-${linkedMovement.movement_id} · ${r.return_reason}`
          : r.return_reason,
        filterCode: r.return_status,
        quantityPrimary: formatCurrencyINR(r.total_refund_amount),
        quantitySecondary: `${r.total_quantity_returned} units returned`,
        statusLabel: r.status_label,
        statusCode: r.return_status,
        badgeTone: r.badge_tone,
        timestampIso: r.return_date,
        notesText: `${r.return_reason} ${r.notes || ''}`,
        linkedMovement,
        rawRecord: r,
      };
    });

    if (activeTab === 'MOVEMENTS') return movementEntries;
    if (activeTab === 'ADJUSTMENTS') return adjustmentEntries;
    if (activeTab === 'RETURNS') return returnEntries;
    return [...movementEntries, ...adjustmentEntries, ...returnEntries];
  }, [activeTab, movements, adjustments, returns]);

  // Apply search, variant filter, subtype/status filter, date range filter, and chronological sort
  const filteredAndSortedEntries = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    const filtered = normalizedEntries.filter((entry) => {
      // 1. Variant filter
      if (variantFilter !== 'ALL') {
        const targetVariantId = Number(variantFilter);
        if (!entry.variantIds.includes(targetVariantId)) {
          return false;
        }
      }

      // 2. Sub-type / status / direction filter
      if (subTypeFilter !== 'ALL') {
        if (subTypeFilter === 'DIRECTION_INBOUND') {
          if (entry.direction !== 'INBOUND') return false;
        } else if (subTypeFilter === 'DIRECTION_OUTBOUND') {
          if (entry.direction !== 'OUTBOUND') return false;
        } else if (subTypeFilter.startsWith('SOURCE_')) {
          const targetSource = subTypeFilter.replace('SOURCE_', '');
          if (entry.recordSource !== targetSource) return false;
        } else if (subTypeFilter.startsWith('ADJTYPE_')) {
          const targetAdjType = subTypeFilter.replace('ADJTYPE_', '');
          if (entry.adjustmentTypeCode !== targetAdjType) return false;
        } else if (
          entry.filterCode !== subTypeFilter &&
          entry.statusCode !== subTypeFilter
        ) {
          return false;
        }
      }

      // 3. Date range filters (YYYY-MM-DD comparison)
      const entryDate = (entry.timestampIso || '').slice(0, 10);
      if (fromDate && entryDate < fromDate) {
        return false;
      }
      if (toDate && entryDate > toDate) {
        return false;
      }

      // 4. Search query
      if (trimmedQuery) {
        const searchable = [
          entry.primaryCode,
          entry.recordSourceLabel,
          entry.title,
          entry.subtitle,
          entry.categoryText,
          entry.typeOrReferenceText,
          entry.statusLabel,
          entry.statusCode,
          entry.notesText,
        ];
        const matches = searchable.some(
          (val) => val && String(val).toLowerCase().includes(trimmedQuery)
        );
        if (!matches) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestampIso).getTime() || 0;
      const timeB = new Date(b.timestampIso).getTime() || 0;
      return sortOrder === 'ASC' ? timeA - timeB : timeB - timeA;
    });
  }, [
    normalizedEntries,
    variantFilter,
    subTypeFilter,
    fromDate,
    toDate,
    searchQuery,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedEntries.length / PAGE_SIZE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAndSortedEntries.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedEntries, safeCurrentPage]);

  const handleTabChange = (nextTabId) => {
    setActiveTab(nextTabId);
    setSubTypeFilter('ALL');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setVariantFilter('ALL');
    setSubTypeFilter('ALL');
    setFromDate('');
    setToDate('');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (!filteredAndSortedEntries.length) return;

    const headers = [
      'record_source',
      'primary_code',
      'title',
      'category_or_type',
      'reference_or_reason',
      'quantity_or_amount',
      'status_or_movement_type',
      'timestamp_utc',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredAndSortedEntries.map((entry) =>
      [
        entry.recordSource,
        entry.primaryCode,
        entry.title,
        entry.categoryText,
        entry.typeOrReferenceText,
        entry.quantityPrimary,
        entry.statusCode,
        entry.timestampIso,
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
      `movement_history_${activeTab.toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    variantFilter !== 'ALL' ||
    subTypeFilter !== 'ALL' ||
    fromDate !== '' ||
    toDate !== '' ||
    sortOrder !== 'DESC';

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(
    startIndex + paginatedEntries.length - 1,
    filteredAndSortedEntries.length
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <section
      className="m08-mh-page"
      aria-labelledby="m08-mh-page-title"
    >
      <style>{`
        .m08-mh-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #F5F7FB;
          color: #0F172A;
          min-height: 100vh;
          padding: 32px 36px 48px;
          box-sizing: border-box;
        }

        .m08-mh-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Header consistent with UI 17 / 18 / 20 */
        .m08-mh-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .m08-mh-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m08-mh-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .m08-mh-title {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .m08-mh-mock-pill {
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

        .m08-mh-readonly-pill {
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

        .m08-mh-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        /* KPI Summary Strip */
        .m08-mh-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .m08-mh-kpi-card {
          background-color: #FFFFFF;
          border: 1px solid #EEF2F7;
          border-radius: 14px;
          padding: 18px 22px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
        }

        .m08-mh-kpi-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 6px;
        }

        .m08-mh-kpi-value {
          font-size: 22px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .m08-mh-kpi-meta {
          font-size: 12.5px;
          color: #64748B;
        }

        /* Main White Card */
        .m08-mh-card {
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #EEF2F7;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
          padding: 28px 32px;
        }

        .m08-mh-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .m08-mh-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-mh-card-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        /* Segmented History Tabs */
        .m08-mh-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #F4F6FA;
          padding: 6px;
          border-radius: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .m08-mh-tab-btn {
          background: transparent;
          border: none;
          border-radius: 8px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .m08-mh-tab-btn:hover {
          color: #0F172A;
        }

        .m08-mh-tab-btn-active {
          background-color: #24539B;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
        }

        .m08-mh-tab-btn-active:hover {
          color: #FFFFFF;
        }

        .m08-mh-tab-btn:focus-visible {
          outline: 2px solid #24539B;
          outline-offset: 2px;
        }

        /* Toolbar */
        .m08-mh-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .m08-mh-search-wrapper {
          position: relative;
          flex: 1 1 260px;
          min-width: 220px;
        }

        .m08-mh-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          font-size: 14px;
          pointer-events: none;
        }

        .m08-mh-search-input {
          width: 100%;
          background-color: #F4F6FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 11px 14px 11px 36px;
          font-size: 13.5px;
          color: #0F172A;
          box-sizing: border-box;
        }

        .m08-mh-search-input:focus {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-mh-filter-select,
        .m08-mh-date-input {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .m08-mh-filter-select:hover,
        .m08-mh-date-input:hover {
          background-color: #EBF0F7;
        }

        .m08-mh-filter-select:focus-visible,
        .m08-mh-date-input:focus-visible {
          outline: none;
          background-color: #FFFFFF;
          border-color: #24539B;
          box-shadow: 0 0 0 3px rgba(36, 83, 155, 0.12);
        }

        .m08-mh-btn-secondary {
          background-color: #F4F6FA;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .m08-mh-btn-secondary:hover {
          background-color: #E8ECF4;
        }

        .m08-mh-btn-primary {
          background-color: #24539B;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Table Styles matching UI 17 / 18 / 20 */
        .m08-mh-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .m08-mh-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 860px;
        }

        .m08-mh-table thead tr {
          background-color: #F4F6FA;
        }

        .m08-mh-table th {
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

        .m08-mh-table th:first-child {
          border-top-left-radius: 8px;
          border-left: 1px solid #EEF2F7;
        }

        .m08-mh-table th:last-child {
          border-top-right-radius: 8px;
          border-right: 1px solid #EEF2F7;
        }

        .m08-mh-table tbody tr {
          background-color: #FFFFFF;
          transition: background-color 0.12s ease;
        }

        .m08-mh-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .m08-mh-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #EEF2F7;
          vertical-align: middle;
          font-size: 13.5px;
        }

        .m08-mh-table td:first-child {
          border-left: 1px solid #EEF2F7;
        }

        .m08-mh-table td:last-child {
          border-right: 1px solid #EEF2F7;
        }

        .m08-mh-source-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 6px;
          margin-right: 8px;
        }

        .m08-mh-source-navy {
          background-color: #E2E8F0;
          color: #0F172A;
        }

        .m08-mh-source-blue {
          background-color: #DBEAFE;
          color: #1E40AF;
        }

        .m08-mh-source-teal {
          background-color: #CCFBF1;
          color: #115E59;
        }

        .m08-mh-record-primary {
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
          flex-wrap: wrap;
        }

        .m08-mh-record-secondary {
          font-size: 12px;
          color: #64748B;
        }

        .m08-mh-category-primary {
          color: #64748B;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .m08-mh-category-secondary {
          font-size: 11.5px;
          color: #94A3B8;
          max-width: 280px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .m08-mh-qty-value {
          display: block;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .m08-mh-qty-sub {
          display: block;
          font-size: 11.5px;
          color: #64748B;
        }

        .m08-mh-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          min-width: 82px;
        }

        .m08-mh-badge-blue {
          background-color: #EBF1FF;
          color: #24539B;
        }

        .m08-mh-badge-amber {
          background-color: #FEF3C7;
          color: #9A6B13;
        }

        .m08-mh-td-date {
          color: #64748B;
          white-space: nowrap;
          font-size: 13px;
        }

        .m08-mh-view-btn {
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

        .m08-mh-view-btn:hover {
          background-color: #EBF1FF;
          color: #1D437F;
        }

        /* Pagination Footer */
        .m08-mh-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .m08-mh-pagination-summary {
          font-size: 12.5px;
          color: #64748B;
        }

        .m08-mh-pagination-controls {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #F4F6FA;
          padding: 5px 10px;
          border-radius: 999px;
        }

        .m08-mh-page-btn {
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

        .m08-mh-page-btn-active {
          color: #0F172A;
          font-weight: 700;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .m08-mh-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* States & Modals */
        .m08-mh-state-box {
          padding: 48px 24px;
          text-align: center;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          background-color: #F8FAFC;
        }

        .m08-mh-state-error {
          border-color: #FCA5A5;
          background-color: #FEF2F2;
        }

        .m08-mh-state-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
        }

        .m08-mh-state-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 16px 0;
        }

        .m08-mh-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #E2E8F0;
          border-top-color: #24539B;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: m08-mh-spin 0.8s linear infinite;
        }

        @keyframes m08-mh-spin {
          to { transform: rotate(360deg); }
        }

        .m08-mh-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .m08-mh-modal {
          background-color: #FFFFFF;
          border-radius: 16px;
          max-width: 680px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .m08-mh-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          border-bottom: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        .m08-mh-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .m08-mh-modal-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .m08-mh-modal-close {
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 16px;
          color: #64748B;
          cursor: pointer;
        }

        .m08-mh-modal-body {
          padding: 24px 26px;
          max-height: 75vh;
          overflow-y: auto;
        }

        .m08-mh-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .m08-mh-detail-item {
          background-color: #F8FAFC;
          border: 1px solid #EEF2F7;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .m08-mh-detail-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 4px;
        }

        .m08-mh-detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .m08-mh-immutable-notice {
          background-color: #EBF1FF;
          border: 1px solid #BFDBFE;
          color: #1E3A8A;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12.5px;
          line-height: 1.5;
          margin-top: 14px;
        }

        .m08-mh-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 26px;
          border-top: 1px solid #EEF2F7;
          background-color: #F8FAFC;
        }

        @media (max-width: 860px) {
          .m08-mh-page {
            padding: 20px 16px 32px;
          }
          .m08-mh-card {
            padding: 20px 16px;
          }
          .m08-mh-kpi-grid,
          .m08-mh-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="m08-mh-container">
        {/* Top Page Heading */}
        <header className="m08-mh-header">
          <div className="m08-mh-title-group">
            <div className="m08-mh-title-row">
              <h1 id="m08-mh-page-title" className="m08-mh-title">
                Movement History
              </h1>
              <span className="m08-mh-readonly-pill">
                Read-Only Chronological Ledger
              </span>
              {IS_DEVELOPMENT_MOCK_MODE && (
                <span
                  className="m08-mh-mock-pill"
                  title="Using local development mock datasets"
                >
                  Dev Mock Mode
                </span>
              )}
            </div>
            <p className="m08-mh-subtitle">
              Chronological stock movement ledger, stock adjustment history, and
              sales return history
            </p>
          </div>
        </header>

        {/* Summary KPI Strip */}
        <div className="m08-mh-kpi-grid" aria-label="History summary metrics">
          <div className="m08-mh-kpi-card">
            <div className="m08-mh-kpi-label">
              Immutable Stock Movements (stock_movements)
            </div>
            <div className="m08-mh-kpi-value">
              {summaryStats.totalMovements} records
            </div>
            <div className="m08-mh-kpi-meta">
              +{summaryStats.inboundUnits} units inbound · −
              {summaryStats.outboundUnits} units outbound
            </div>
          </div>

          <div className="m08-mh-kpi-card">
            <div className="m08-mh-kpi-label">
              Adjustment History (stock_adjustments)
            </div>
            <div className="m08-mh-kpi-value">
              {summaryStats.totalAdjustments} records
            </div>
            <div className="m08-mh-kpi-meta">
              {summaryStats.completedAdjustments} completed ·{' '}
              {summaryStats.pendingAdjustments} pending approval
            </div>
          </div>

          <div className="m08-mh-kpi-card">
            <div className="m08-mh-kpi-label">
              Return History (sales_returns)
            </div>
            <div className="m08-mh-kpi-value">
              {summaryStats.totalReturns} records
            </div>
            <div className="m08-mh-kpi-meta">
              Active refund value:{' '}
              {formatCurrencyINR(summaryStats.totalRefundValue)}
            </div>
          </div>
        </div>

        {/* Main History Card */}
        <div className="m08-mh-card">
          <div className="m08-mh-card-header">
            <div>
              <h2 className="m08-mh-card-title">
                Chronological History Explorer
              </h2>
              <p className="m08-mh-card-subtitle">
                Trace variant movements, stock adjustment reconciliations, and
                customer return timelines
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                className="m08-mh-btn-secondary"
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            )}
          </div>

          {/* History Stream Selector Tabs */}
          <div
            className="m08-mh-tabs"
            role="tablist"
            aria-label="History stream views"
          >
            {HISTORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`m08-mh-tab-btn ${
                    isActive ? 'm08-mh-tab-btn-active' : ''
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Filters Toolbar */}
          <div
            className="m08-mh-toolbar"
            role="search"
            aria-label="Filter chronological history"
          >
            <div className="m08-mh-search-wrapper">
              <span className="m08-mh-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                className="m08-mh-search-input"
                placeholder="Search by code, SKU, product, reference or notes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search history by record code, SKU, product name, reference, or notes"
              />
            </div>

            {/* Product Variant Audit Trail Filter */}
            <select
              className="m08-mh-filter-select"
              value={variantFilter}
              onChange={(e) => {
                setVariantFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter history by product variant"
            >
              <option value="ALL">Variant: All SKUs</option>
              {variants.map((v) => (
                <option key={v.variant_id} value={v.variant_id}>
                  {v.sku} · {v.product_name} (#{v.variant_id})
                </option>
              ))}
            </select>

            {/* Context-Aware Type / Status Filter */}
            <select
              className="m08-mh-filter-select"
              value={subTypeFilter}
              onChange={(e) => {
                setSubTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by movement type, status, or record source"
            >
              <option value="ALL">Type / Status: All</option>
              {activeTab === 'MOVEMENTS' && (
                <>
                  <optgroup label="Direction">
                    <option value="DIRECTION_INBOUND">
                      Inbound (Additions)
                    </option>
                    <option value="DIRECTION_OUTBOUND">
                      Outbound (Reductions)
                    </option>
                  </optgroup>
                  <optgroup label="SQL movement_type (ENUM)">
                    {VALID_MOVEMENT_TYPES.map((typeCode) => (
                      <option key={typeCode} value={typeCode}>
                        {MOVEMENT_TYPE_META[typeCode]?.label || typeCode} (
                        {typeCode})
                      </option>
                    ))}
                  </optgroup>
                </>
              )}

              {activeTab === 'ADJUSTMENTS' && (
                <>
                  <optgroup label="Adjustment Status (ENUM)">
                    {VALID_ADJUSTMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        Status: {st}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Adjustment Type (ENUM)">
                    {VALID_ADJUSTMENT_TYPES.map((t) => (
                      <option key={t} value={`ADJTYPE_${t}`}>
                        Type: {t}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}

              {activeTab === 'RETURNS' && (
                <optgroup label="Return Status (ENUM)">
                  {VALID_RETURN_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      Status: {st}
                    </option>
                  ))}
                </optgroup>
              )}

              {activeTab === 'COMBINED' && (
                <optgroup label="Record Source Table">
                  <option value="SOURCE_STOCK_MOVEMENT">
                    Stock Movement (stock_movements)
                  </option>
                  <option value="SOURCE_STOCK_ADJUSTMENT">
                    Stock Adjustment (stock_adjustments)
                  </option>
                  <option value="SOURCE_SALES_RETURN">
                    Sales Return (sales_returns)
                  </option>
                </optgroup>
              )}
            </select>

            {/* Date Range Filter (From / To) */}
            <input
              type="date"
              className="m08-mh-date-input"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="From date"
              title="Filter from date"
            />
            <input
              type="date"
              className="m08-mh-date-input"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="To date"
              title="Filter to date"
            />

            {/* Chronological Sort Order */}
            <select
              className="m08-mh-filter-select"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Chronological sort order"
            >
              <option value="DESC">Sort: Newest First</option>
              <option value="ASC">Sort: Oldest First</option>
            </select>

            <button
              type="button"
              className="m08-mh-btn-secondary"
              onClick={handleExportCsv}
              disabled={isLoading || filteredAndSortedEntries.length === 0}
            >
              Export CSV ↗
            </button>
          </div>

          {/* Loading, Error, Empty, or Table State */}
          {isLoading ? (
            <div
              className="m08-mh-state-box"
              role="status"
              aria-busy="true"
            >
              <div className="m08-mh-spinner" aria-hidden="true" />
              <p className="m08-mh-state-title">
                Loading chronological movement history...
              </p>
              <p className="m08-mh-state-subtitle">
                Synchronizing stock_movements, stock_adjustments, and
                sales_returns timelines.
              </p>
            </div>
          ) : error ? (
            <div
              className="m08-mh-state-box m08-mh-state-error"
              role="alert"
            >
              <p className="m08-mh-state-title">
                Unable to load movement history
              </p>
              <p className="m08-mh-state-subtitle">{error}</p>
              <button
                type="button"
                className="m08-mh-btn-secondary"
                onClick={() => loadHistory(false)}
              >
                Retry loading
              </button>
            </div>
          ) : filteredAndSortedEntries.length === 0 ? (
            <div className="m08-mh-state-box" role="status">
              <p className="m08-mh-state-title">
                No matching history records found
              </p>
              <p className="m08-mh-state-subtitle">
                No chronological records match your active variant, type, date
                range, or search criteria.
              </p>
              <button
                type="button"
                className="m08-mh-btn-secondary"
                onClick={handleResetFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="m08-mh-table-scroll">
                <table
                  className="m08-mh-table"
                  aria-label="Chronological Movement History table"
                >
                  <thead>
                    <tr>
                      <th scope="col">RECORD / SOURCE</th>
                      <th scope="col">CATEGORY / REFERENCE</th>
                      <th scope="col">QUANTITY / VALUE</th>
                      <th scope="col">TYPE / STATUS</th>
                      <th scope="col">TIMESTAMP (UTC)</th>
                      <th scope="col">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((entry) => (
                      <tr key={entry.uniqueKey}>
                        <td>
                          <div className="m08-mh-record-primary">
                            <span
                              className={`m08-mh-source-tag m08-mh-source-${entry.sourceBadgeTone}`}
                            >
                              {entry.recordSourceLabel}
                            </span>
                            <span>{entry.primaryCode}</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.title}</span>
                          </div>
                          <div className="m08-mh-record-secondary">
                            {entry.subtitle}
                          </div>
                        </td>

                        <td>
                          <div className="m08-mh-category-primary">
                            {entry.categoryText}
                          </div>
                          <div
                            className="m08-mh-category-secondary"
                            title={entry.typeOrReferenceText}
                          >
                            {entry.typeOrReferenceText}
                          </div>
                        </td>

                        <td>
                          <span className="m08-mh-qty-value">
                            {entry.quantityPrimary}
                          </span>
                          <span className="m08-mh-qty-sub">
                            {entry.quantitySecondary}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`m08-mh-badge ${
                              entry.badgeTone === 'amber'
                                ? 'm08-mh-badge-amber'
                                : 'm08-mh-badge-blue'
                            }`}
                          >
                            {entry.statusLabel}
                          </span>
                        </td>

                        <td className="m08-mh-td-date">
                          <div>{formatMovementDate(entry.timestampIso)}</div>
                          <div
                            style={{ fontSize: '11.5px', color: '#94A3B8' }}
                          >
                            {formatMovementDateTime(entry.timestampIso).split(
                              ', '
                            )[1] || ''}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="m08-mh-view-btn"
                            onClick={() => setSelectedEntry(entry)}
                            aria-label={`Inspect history details for ${entry.primaryCode}`}
                          >
                            <span>View</span>
                            <span aria-hidden="true">→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="m08-mh-pagination-bar">
                <div className="m08-mh-pagination-summary" aria-live="polite">
                  Showing {startIndex}–{endIndex} of{' '}
                  {filteredAndSortedEntries.length} history records
                </div>

                <nav
                  className="m08-mh-pagination-controls"
                  aria-label="Movement history pagination"
                >
                  {safeCurrentPage > 1 && (
                    <button
                      type="button"
                      className="m08-mh-page-btn"
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
                      className={`m08-mh-page-btn ${
                        num === safeCurrentPage ? 'm08-mh-page-btn-active' : ''
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
                    className="m08-mh-page-btn"
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
      </div>

      {/* Read-Only History Record Details Modal */}
      {selectedEntry && (
        <div
          className="m08-mh-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m08-mh-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEntry(null);
            }
          }}
        >
          <div className="m08-mh-modal">
            <div className="m08-mh-modal-header">
              <div>
                <h3 id="m08-mh-detail-title" className="m08-mh-modal-title">
                  {selectedEntry.recordSourceLabel}: {selectedEntry.primaryCode}{' '}
                  · {selectedEntry.title}
                </h3>
                <p className="m08-mh-modal-subtitle">
                  {selectedEntry.recordSource === 'STOCK_MOVEMENT' &&
                    `Table: stock_movements · Endpoint: ${API_ENDPOINTS.LIST_STOCK_MOVEMENTS}`}
                  {selectedEntry.recordSource === 'STOCK_ADJUSTMENT' &&
                    `Table: stock_adjustments / stock_adjustment_items · Endpoint: ${API_ENDPOINTS.LIST_STOCK_ADJUSTMENTS}`}
                  {selectedEntry.recordSource === 'SALES_RETURN' &&
                    `Table: sales_returns / sales_return_items · Endpoint: ${API_ENDPOINTS.LIST_RETURNS}`}
                </p>
              </div>
              <button
                type="button"
                className="m08-mh-modal-close"
                onClick={() => setSelectedEntry(null)}
                aria-label="Close history details dialog"
              >
                ✕
              </button>
            </div>

            <div className="m08-mh-modal-body">
              <div className="m08-mh-detail-grid">
                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">
                    Record Source &amp; Primary Key
                  </div>
                  <div className="m08-mh-detail-value">
                    {selectedEntry.recordSourceLabel} ({selectedEntry.primaryCode}
                    )
                  </div>
                </div>

                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">
                    Type / Status (SQL ENUM)
                  </div>
                  <div className="m08-mh-detail-value">
                    <span
                      className={`m08-mh-badge ${
                        selectedEntry.badgeTone === 'amber'
                          ? 'm08-mh-badge-amber'
                          : 'm08-mh-badge-blue'
                      }`}
                    >
                      {selectedEntry.statusCode}
                    </span>
                  </div>
                </div>

                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">
                    Quantity / Value Impact
                  </div>
                  <div className="m08-mh-detail-value">
                    {selectedEntry.quantityPrimary} (
                    {selectedEntry.quantitySecondary})
                  </div>
                </div>

                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">Timestamp (UTC)</div>
                  <div className="m08-mh-detail-value">
                    {formatMovementDateTime(selectedEntry.timestampIso)}
                  </div>
                </div>

                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">
                    Variant / Context Metadata
                  </div>
                  <div className="m08-mh-detail-value">
                    {selectedEntry.subtitle}
                  </div>
                </div>

                <div className="m08-mh-detail-item">
                  <div className="m08-mh-detail-label">
                    Reference / Cross-Link
                  </div>
                  <div className="m08-mh-detail-value">
                    {selectedEntry.linkedMovement
                      ? `Linked Immutable Ledger Entry: MOV-${selectedEntry.linkedMovement.movement_id} (${selectedEntry.linkedMovement.movement_type})`
                      : selectedEntry.typeOrReferenceText}
                  </div>
                </div>
              </div>

              <div className="m08-mh-detail-item">
                <div className="m08-mh-detail-label">
                  Notes / Reason
                </div>
                <div className="m08-mh-detail-value">
                  {selectedEntry.notesText || 'No additional notes recorded.'}
                </div>
              </div>

              <div className="m08-mh-immutable-notice">
                <strong>ADBMS Ledger &amp; History Policy:</strong>{' '}
                {selectedEntry.recordSource === 'STOCK_MOVEMENT'
                  ? 'This stock_movements entry is protected by MySQL BEFORE UPDATE and BEFORE DELETE triggers (trg_before_stock_movement_update_block & trg_before_stock_movement_delete_block) and is permanently immutable.'
                  : 'Completed stock adjustments and sales returns generate corresponding immutable entries in stock_movements via Member 05’s sp_update_inventory stored procedure.'}
              </div>
            </div>

            <div className="m08-mh-modal-footer">
              <button
                type="button"
                className="m08-mh-btn-primary"
                onClick={() => setSelectedEntry(null)}
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
