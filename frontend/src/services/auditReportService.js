// Owner: Member 08
// Audit Report Service (Read-Only)
// Designed around assignment API endpoints:
//   - GET /api/v1/audit-reports
//   - GET /api/v1/audit-reports/stock
//
// ============================================================================
// MEMBER 10 SCHEMA DEPENDENCY & DEVELOPMENT MOCK MODE NOTICE
// ============================================================================
// 1. Per README.md Section 7.1 and Section 8:
//    - Member 10 owns the `audit_logs` table (database/modules/auditing/01_create_audit_logs_table.sql)
//      and audit triggers (database/adbms/auditing/01..03_audit_*_triggers.sql).
//    - Member 08's Audit Reports module is strictly READ-ONLY.
// 2. Current Repository Status:
//    - `database/modules/auditing/01_create_audit_logs_table.sql` is currently an
//      unimplemented 2-line stub (`-- Owner: Member 10` / `-- TODO: write SQL`).
// 3. Provisional Mock Structure:
//    - Until Member 10 finalizes the `audit_logs` column list, this service provides
//      development-only read-only audit report records derived from Member 08's
//      confirmed SQL tables (`stock_movements`, `stock_adjustments`,
//      `stock_adjustment_items`, `sales_returns`, `sales_return_items`) and
//      confirmed `users` / `roles` schema (`03_create_users_table.sql`).
//    - No network calls or database mutations are performed.
// ============================================================================

import {
  getStockMovements,
  getStockAdjustments,
  getSalesReturns,
} from './stockMovementService.js';
import {
  IS_DEVELOPMENT_MOCK_MODE as _IS_DEV_MOCK_MODE,
  m08FetchJson,
} from './m08LiveApi.js';

export const IS_DEVELOPMENT_MOCK_MODE = _IS_DEV_MOCK_MODE;

export const AUDIT_REPORT_ENDPOINTS = Object.freeze({
  GET_AUDIT_REPORTS: '/api/v1/audit-reports',
  GET_STOCK_AUDIT_REPORTS: '/api/v1/audit-reports/stock',
});

export const AUDIT_MOCK_SCHEMA_DEPENDENCY_NOTICE =
  'Provisional Development Mock Mode: database/modules/auditing/01_create_audit_logs_table.sql (owned by Member 10) is currently a TODO stub. Audit records below are derived read-only from confirmed stock_movements, stock_adjustments, sales_returns, and trigger guard events.';

export const AUDIT_LIVE_SCHEMA_DEPENDENCY_NOTICE =
  "Live operational audit data from stock movements, stock adjustments, and sales returns. Member 10's audit_logs integration is still pending. These records are derived read-only from operational tables.";

export const AUDIT_SCHEMA_DEPENDENCY_NOTICE = IS_DEVELOPMENT_MOCK_MODE
  ? AUDIT_MOCK_SCHEMA_DEPENDENCY_NOTICE
  : AUDIT_LIVE_SCHEMA_DEPENDENCY_NOTICE;

export const AUDIT_ENTITY_TABLES = Object.freeze([
  'stock_movements',
  'stock_adjustments',
  'sales_returns',
  'inventory_trigger_guard',
]);

export const AUDIT_ACTION_TYPES = Object.freeze([
  'LEDGER_INSERT',
  'ADJUSTMENT_COMPLETED',
  'ADJUSTMENT_PENDING',
  'ADJUSTMENT_APPROVED',
  'ADJUSTMENT_REJECTED',
  'RETURN_COMPLETED',
  'RETURN_PENDING',
  'RETURN_APPROVED',
  'RETURN_REJECTED',
  'TRIGGER_GUARD_BLOCK',
]);

export const AUDIT_ACTORS = Object.freeze({
  1: {
    user_id: 1,
    employee_code: 'EMP-001',
    username: 'sysadmin',
    full_name: 'System Admin',
    role_name: 'ADMIN',
  },
  2: {
    user_id: 2,
    employee_code: 'EMP-002',
    username: 'store_mgr',
    full_name: 'Store Operations Manager',
    role_name: 'MANAGER',
  },
  3: {
    user_id: 3,
    employee_code: 'EMP-003',
    username: 'cashier_01',
    full_name: 'Retail Counter Cashier',
    role_name: 'CASHIER',
  },
  4: {
    user_id: 4,
    employee_code: 'EMP-004',
    username: 'inv_mgr',
    full_name: 'Inventory & Stock Manager',
    role_name: 'INVENTORY_MANAGER',
  },
});

/**
 * Additional read-only trigger guard & administrative audit events that complement
 * the stock movement, adjustment, and return records in GET /api/v1/audit-reports.
 */
const SUPPLEMENTAL_TRIGGER_AUDIT_EVENTS = Object.freeze([
  {
    audit_id: 'AUD-9001',
    entity_table: 'stock_movements',
    entity_id: 1001,
    reference_code: 'MOV-1001',
    action_type: 'TRIGGER_GUARD_BLOCK',
    action_label: 'Blocked Direct UPDATE (SQLSTATE 45000)',
    outcome: 'BLOCKED_45000',
    badge_tone: 'amber',
    is_stock_audit: true,
    actor: AUDIT_ACTORS[4],
    variant_id: 101,
    sku: 'SPA-OXF-NVY-M',
    product_name: 'Classic Oxford Button-Down Shirt',
    quantity_impact: '0 units (Mutation Rejected)',
    event_timestamp: '2026-11-17T17:45:00Z',
    summary:
      'trg_before_stock_movement_update_block prevented direct UPDATE on movement_id #1001; original quantity (248 units) preserved.',
    before_state: 'quantity = 248, movement_type = PURCHASE',
    after_state: 'Unchanged (SIGNAL SQLSTATE 45000 raised)',
  },
  {
    audit_id: 'AUD-9002',
    entity_table: 'stock_movements',
    entity_id: 1003,
    reference_code: 'MOV-1003',
    action_type: 'TRIGGER_GUARD_BLOCK',
    action_label: 'Blocked Direct DELETE (SQLSTATE 45000)',
    outcome: 'BLOCKED_45000',
    badge_tone: 'amber',
    is_stock_audit: true,
    actor: AUDIT_ACTORS[4],
    variant_id: 102,
    sku: 'SPA-POL-WHT-L',
    product_name: 'Pima Cotton Pique Polo',
    quantity_impact: '0 units (Deletion Rejected)',
    event_timestamp: '2026-11-17T16:50:00Z',
    summary:
      'trg_before_stock_movement_delete_block prevented direct DELETE on movement_id #1003; damage audit trail preserved.',
    before_state: 'movement_id = 1003, quantity = 14, movement_type = DAMAGE',
    after_state: 'Row retained intact (SIGNAL SQLSTATE 45000 raised)',
  },
  {
    audit_id: 'AUD-9003',
    entity_table: 'inventory_trigger_guard',
    entity_id: 104,
    reference_code: 'INV-VAR-104',
    action_type: 'TRIGGER_GUARD_BLOCK',
    action_label: 'Inventory Procedure Policy Verification',
    outcome: 'LOGGED',
    badge_tone: 'blue',
    is_stock_audit: false,
    actor: AUDIT_ACTORS[1],
    variant_id: 104,
    sku: 'SPA-CHN-KHK-32',
    product_name: 'Stretch Chino Trousers',
    quantity_impact: '154 units on hand verified',
    event_timestamp: '2026-11-17T12:00:00Z',
    summary:
      'Verified inventory.quantity_on_hand for Variant #104 matches cumulative stock_movements and sp_update_inventory policy.',
    before_state: 'quantity_on_hand = 154',
    after_state: 'quantity_on_hand = 154 (Verified Consistent)',
  },
]);

/**
 * Builds the complete read-only list of audit report entries from Member 08's
 * mock stock movements, stock adjustments, sales returns, and trigger guard events.
 */
async function buildAllAuditReportRecords() {
  const [movementsRes, adjustmentsRes, returnsRes] = await Promise.all([
    getStockMovements(),
    getStockAdjustments(),
    getSalesReturns(),
  ]);

  const movementAudits = (movementsRes.items || []).map((mov) => {
    const actor =
      mov.movement_type === 'SALE' || mov.movement_type === 'CUSTOMER_RETURN'
        ? AUDIT_ACTORS[3]
        : AUDIT_ACTORS[4];

    return {
      audit_id: `AUD-MOV-${mov.movement_id}`,
      entity_table: 'stock_movements',
      entity_id: mov.movement_id,
      reference_code: `MOV-${mov.movement_id}`,
      action_type: 'LEDGER_INSERT',
      action_label: `Ledger Insert · ${mov.movement_label}`,
      outcome: 'LOGGED',
      badge_tone: mov.badge_tone,
      is_stock_audit: true,
      actor,
      variant_id: mov.variant_id,
      sku: mov.sku,
      product_name: mov.product_name,
      quantity_impact: `${mov.sign}${mov.quantity} units (${mov.movement_type})`,
      event_timestamp: mov.movement_date,
      summary: `Recorded immutable ${mov.movement_type} movement (${mov.sign}${mov.quantity} units) for ${mov.sku} (${mov.reference_code}). ${mov.notes || ''}`.trim(),
      before_state: `Reference: ${mov.reference_code}`,
      after_state: `movement_id = ${mov.movement_id}, quantity = ${mov.quantity}, type = ${mov.movement_type}`,
    };
  });

  const adjustmentAudits = (adjustmentsRes.items || []).map((adj) => {
    const item = adj.primary_item;
    const actor = AUDIT_ACTORS[adj.created_by] || AUDIT_ACTORS[4];
    const approver = adj.approved_by ? AUDIT_ACTORS[adj.approved_by] : null;
    const diff = adj.net_quantity_difference;
    const diffStr = `${diff > 0 ? '+' : ''}${diff} units`;

    return {
      audit_id: `AUD-ADJ-${adj.adjustment_id}`,
      entity_table: 'stock_adjustments',
      entity_id: adj.adjustment_id,
      reference_code: adj.adjustment_reference,
      action_type: `ADJUSTMENT_${adj.status}`,
      action_label: `Adjustment ${adj.status_label} · ${adj.adjustment_type_label}`,
      outcome: adj.status === 'PENDING' ? 'PENDING_REVIEW' : adj.status,
      badge_tone: adj.badge_tone,
      is_stock_audit: true,
      actor,
      approver,
      variant_id: item?.variant_id || null,
      sku: item?.sku || 'N/A',
      product_name: item?.product_name || 'Stock Adjustment',
      quantity_impact: item
        ? `${diffStr} (${item.quantity_before} → ${item.quantity_after})`
        : diffStr,
      event_timestamp: adj.updated_at || adj.adjustment_date,
      summary: `${adj.adjustment_reference} (${adj.adjustment_type}) marked ${adj.status}: ${adj.reason}`,
      before_state: item
        ? `quantity_before = ${item.quantity_before} units`
        : 'N/A',
      after_state: item
        ? `quantity_after = ${item.quantity_after} units (diff = ${diffStr}, status = ${adj.status})`
        : `status = ${adj.status}`,
    };
  });

  const returnAudits = (returnsRes.items || []).map((ret) => {
    const item = ret.primary_item;
    const actor =
      ret.return_status === 'COMPLETED' || ret.return_status === 'APPROVED'
        ? AUDIT_ACTORS[2]
        : AUDIT_ACTORS[3];

    return {
      audit_id: `AUD-RET-${ret.return_id}`,
      entity_table: 'sales_returns',
      entity_id: ret.return_id,
      reference_code: `${ret.return_code} (${ret.invoice_number})`,
      action_type: `RETURN_${ret.return_status}`,
      action_label: `Sales Return ${ret.status_label}`,
      outcome:
        ret.return_status === 'PENDING' ? 'PENDING_REVIEW' : ret.return_status,
      badge_tone: ret.badge_tone,
      is_stock_audit: true,
      actor,
      variant_id: item?.variant_id || null,
      sku: item?.sku || 'N/A',
      product_name: item?.product_name || ret.sale_label,
      quantity_impact: `+${ret.total_quantity_returned} units returned (INR ${Number(
        ret.total_refund_amount
      ).toLocaleString('en-IN')})`,
      event_timestamp: ret.return_date,
      summary: `${ret.return_code} against ${ret.invoice_number} (${ret.return_status}): ${ret.return_reason}`,
      before_state: item
        ? `Sold quantity = ${item.quantity_sold ?? 'N/A'} units on ${ret.invoice_number}`
        : `Sale ${ret.invoice_number}`,
      after_state: `Returned = ${ret.total_quantity_returned} units, Refund = INR ${ret.total_refund_amount}, Status = ${ret.return_status}`,
    };
  });

  const allRecords = [
    ...SUPPLEMENTAL_TRIGGER_AUDIT_EVENTS,
    ...movementAudits,
    ...adjustmentAudits,
    ...returnAudits,
  ];

  return allRecords.sort(
    (a, b) =>
      (new Date(b.event_timestamp).getTime() || 0) -
      (new Date(a.event_timestamp).getTime() || 0)
  );
}

/**
 * Computes summary KPI metrics, 10-bar timeline buckets, operations snapshot counts,
 * and recent activity highlights from a set of audit report records.
 */
export function computeAuditReportSummary(records = []) {
  const totalEvents = records.length;
  const stockLedgerEvents = records.filter(
    (r) =>
      r.entity_table === 'stock_movements' ||
      r.source_table === 'stock_movements'
  ).length;
  const adjustmentAudits = records.filter(
    (r) =>
      r.entity_table === 'stock_adjustments' ||
      r.source_table === 'stock_adjustments'
  ).length;
  const returnAudits = records.filter(
    (r) =>
      r.entity_table === 'sales_returns' || r.source_table === 'sales_returns'
  ).length;
  const needsReviewCount = records.filter(
    (r) =>
      r.outcome === 'PENDING_REVIEW' ||
      r.outcome === 'NEEDS_REVIEW' ||
      r.outcome === 'REJECTED' ||
      r.outcome === 'BLOCKED_45000' ||
      r.outcome === 'BLOCKED'
  ).length;
  const triggerGuardBlocks = records.filter(
    (r) => r.action_type === 'TRIGGER_GUARD_BLOCK' || r.outcome === 'BLOCKED'
  ).length;

  let chartSeries = [];

  if (!IS_DEVELOPMENT_MOCK_MODE) {
    const monthAbbrs = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const parsedDates = records
      .map((r) => new Date(r.event_timestamp))
      .filter((d) => !Number.isNaN(d.getTime()));

    const anchorDate =
      parsedDates.length > 0
        ? new Date(Math.max(...parsedDates.map((d) => d.getTime())))
        : new Date();

    const anchorYear = anchorDate.getUTCFullYear();
    const anchorMonth = anchorDate.getUTCMonth() + 1;
    const anchorTotalMonths = anchorYear * 12 + (anchorMonth - 1);

    const windowMonths = [];
    for (let offset = 9; offset >= 0; offset -= 1) {
      const totalM = anchorTotalMonths - offset;
      const year = Math.floor(totalM / 12);
      const month = (totalM % 12) + 1;
      const key = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
      windowMonths.push({
        key,
        label: monthAbbrs[month - 1],
        year,
        month,
        count: 0,
      });
    }

    for (const d of parsedDates) {
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const bucket = windowMonths.find((b) => b.year === y && b.month === m);
      if (bucket) {
        bucket.count += 1;
      }
    }

    chartSeries = windowMonths.map(({ key, label, count }) => ({
      key,
      label,
      count,
    }));
  } else {
    // Build 10 chronological date/category buckets for the Figma UI 48 vertical bar chart in mock mode
    const dateBuckets = [
      { key: '2026-11-10', label: '10 Nov' },
      { key: '2026-11-11', label: '11 Nov' },
      { key: '2026-11-12', label: '12 Nov' },
      { key: '2026-11-13', label: '13 Nov' },
      { key: '2026-11-14', label: '14 Nov' },
      { key: '2026-11-15', label: '15 Nov' },
      { key: '2026-11-16', label: '16 Nov' },
      { key: '2026-11-17-AM', label: '17 Nov AM' },
      { key: '2026-11-17-PM', label: '17 Nov PM' },
      { key: 'TRIGGERS', label: 'Guards' },
    ];

    chartSeries = dateBuckets.map((bucket) => {
      let count = 0;
      if (bucket.key === 'TRIGGERS') {
        count = records.filter(
          (r) => r.action_type === 'TRIGGER_GUARD_BLOCK'
        ).length;
      } else if (bucket.key === '2026-11-17-AM') {
        count = records.filter((r) => {
          const ts = r.event_timestamp || '';
          if (!ts.startsWith('2026-11-17')) return false;
          const hour = Number(ts.slice(11, 13)) || 0;
          return hour < 14;
        }).length;
      } else if (bucket.key === '2026-11-17-PM') {
        count = records.filter((r) => {
          const ts = r.event_timestamp || '';
          if (!ts.startsWith('2026-11-17')) return false;
          const hour = Number(ts.slice(11, 13)) || 0;
          return hour >= 14;
        }).length;
      } else {
        count = records.filter((r) =>
          (r.event_timestamp || '').startsWith(bucket.key)
        ).length;
      }

      return {
        key: bucket.key,
        label: bucket.label,
        count,
      };
    });
  }

  const maxBucketCount = Math.max(1, ...chartSeries.map((b) => b.count));
  const normalizedChartSeries = chartSeries.map((b) => ({
    ...b,
    heightPercent:
      b.count === 0 ? 12 : Math.max(22, Math.round((b.count / maxBucketCount) * 100)),
  }));

  return {
    totalEvents,
    stockLedgerEvents,
    adjustmentAudits,
    returnAudits,
    reconciliationsAndReturns: adjustmentAudits + returnAudits,
    needsReviewCount,
    triggerGuardBlocks,
    chartSeries: normalizedChartSeries,
    recentHighlights: records.slice(0, 4),
  };
}

function normalizeLiveAuditItem(item) {
  return {
    ...item,
    entity_table: item.entity_table || item.source_table || 'stock_movements',
    source_table: item.source_table || item.entity_table || 'stock_movements',
    actor: item.actor || {
      user_id: null,
      employee_code: 'SYS',
      username: 'system_ledger',
      full_name: 'CloudDB Ledger Engine',
      role_name: 'SYSTEM',
    },
  };
}

/**
 * Fetch general & stock audit reports.
 * Maps to assignment endpoint: GET /api/v1/audit-reports
 *
 * @param {Object} [options]
 * @param {boolean} [options.simulateError=false]
 */
export async function getAuditReports(options = {}) {
  const {
    simulateError = false,
    search,
    source_table,
    action_type,
    outcome,
    actor_user_id,
    variant_id,
    from_date,
    to_date,
  } = options;

  if (simulateError) {
    throw new Error(
      'Simulated error while loading audit report records.'
    );
  }

  if (IS_DEVELOPMENT_MOCK_MODE) {
    const items = await buildAllAuditReportRecords();
    return {
      items,
      total: items.length,
      summary: computeAuditReportSummary(items),
      isMockMode: true,
      endpoint: AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS,
      schemaDependencyNotice: AUDIT_SCHEMA_DEPENDENCY_NOTICE,
    };
  }

  const data = await m08FetchJson(AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS, {
    method: 'GET',
    query: {
      search,
      source_table,
      action_type,
      outcome,
      actor_user_id,
      variant_id,
      from_date,
      to_date,
    },
  });
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
  const items = rawItems.map(normalizeLiveAuditItem);

  return {
    items,
    total: typeof data?.total === 'number' ? data.total : items.length,
    summary: data?.summary || computeAuditReportSummary(items),
    isMockMode: false,
    endpoint: AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS,
    auditLogsTableAvailable: Boolean(data?.audit_logs_table_available),
    schemaDependencyNotice: AUDIT_LIVE_SCHEMA_DEPENDENCY_NOTICE,
  };
}

/**
 * Fetch stock-specific audit reports.
 * Maps to assignment endpoint: GET /api/v1/audit-reports/stock
 *
 * @param {Object} [options]
 * @param {boolean} [options.simulateError=false]
 */
export async function getStockAuditReports(options = {}) {
  const {
    simulateError = false,
    search,
    source_table,
    action_type,
    outcome,
    actor_user_id,
    variant_id,
    from_date,
    to_date,
  } = options;

  if (simulateError) {
    throw new Error(
      'Simulated error while loading stock audit report records.'
    );
  }

  if (IS_DEVELOPMENT_MOCK_MODE) {
    const allItems = await buildAllAuditReportRecords();
    const stockItems = allItems.filter((item) => item.is_stock_audit);

    return {
      items: stockItems,
      total: stockItems.length,
      summary: computeAuditReportSummary(stockItems),
      isMockMode: true,
      endpoint: AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS,
      schemaDependencyNotice: AUDIT_SCHEMA_DEPENDENCY_NOTICE,
    };
  }

  const data = await m08FetchJson(
    AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS,
    {
      method: 'GET',
      query: {
        search,
        source_table,
        action_type,
        outcome,
        actor_user_id,
        variant_id,
        from_date,
        to_date,
      },
    }
  );
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
  const items = rawItems.map(normalizeLiveAuditItem);

  return {
    items,
    total: typeof data?.total === 'number' ? data.total : items.length,
    summary: data?.summary || computeAuditReportSummary(items),
    isMockMode: false,
    endpoint: AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS,
    auditLogsTableAvailable: Boolean(data?.audit_logs_table_available),
    schemaDependencyNotice: AUDIT_LIVE_SCHEMA_DEPENDENCY_NOTICE,
  };
}

export default {
  IS_DEVELOPMENT_MOCK_MODE,
  AUDIT_REPORT_ENDPOINTS,
  AUDIT_SCHEMA_DEPENDENCY_NOTICE,
  AUDIT_ENTITY_TABLES,
  AUDIT_ACTION_TYPES,
  AUDIT_ACTORS,
  computeAuditReportSummary,
  getAuditReports,
  getStockAuditReports,
};
