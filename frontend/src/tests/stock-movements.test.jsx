// Owner: Member 08
/**
 * Automated Frontend Service & Component Verification Suite for Member 08:
 *   - Stock Movements List (UI 17)
 *   - Stock Adjustments & Create Stock Adjustment (UI 18 / UI 19)
 *   - Sales Returns & Create Return (UI 20 / UI 21)
 *   - Movement History
 *   - Audit Reports (UI 48)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  API_ENDPOINTS,
  VALID_MOVEMENT_TYPES,
  VALID_ADJUSTMENT_TYPES,
  VALID_ADJUSTMENT_STATUSES,
  VALID_RETURN_STATUSES,
  getStockMovements,
  getStockMovementById,
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
  getSalesReturns,
  createSalesReturn,
  getMovementHistorySnapshot,
} from '../services/stockMovementService.js';

import {
  AUDIT_REPORT_ENDPOINTS,
  getAuditReports,
  getStockAuditReports,
} from '../services/auditReportService.js';

test('Stock Movements service returns immutable SQL-aligned movement records', async () => {
  const res = await getStockMovements();
  assert.equal(res.endpoint, API_ENDPOINTS.LIST_STOCK_MOVEMENTS);
  assert.ok(Array.isArray(res.items));
  assert.ok(res.items.length >= 10);

  for (const item of res.items) {
    assert.ok(Number.isInteger(item.movement_id) && item.movement_id > 0);
    assert.ok(Number.isInteger(item.variant_id) && item.variant_id > 0);
    assert.ok(VALID_MOVEMENT_TYPES.includes(item.movement_type));
    assert.ok(Number.isInteger(item.quantity) && item.quantity > 0);
  }

  const single = await getStockMovementById(1001);
  assert.equal(single.item.movement_id, 1001);

  await assert.rejects(() => getStockMovementById(999999), /not found/i);
});

test('Stock Adjustments service creates PENDING adjustment and enforces generated column & non-negative rules', async () => {
  const beforeList = await getStockAdjustments();
  const initialCount = beforeList.items.length;
  assert.ok(initialCount >= 5);

  for (const adj of beforeList.items) {
    assert.ok(VALID_ADJUSTMENT_TYPES.includes(adj.adjustment_type));
    assert.ok(VALID_ADJUSTMENT_STATUSES.includes(adj.status));
  }

  const singleAdj = await getStockAdjustmentById(2101);
  assert.equal(singleAdj.item.adjustment_id, 2101);

  const created = await createStockAdjustment({
    adjustment_reference: 'ADJ-2026-9901',
    adjustment_type: 'PHYSICAL_COUNT',
    reason: 'Automated test cycle count reconciliation',
    items: [
      {
        variant_id: 101,
        quantity_before: 240,
        quantity_after: 246,
        item_reason: 'Six units found in reserve bin',
      },
    ],
  });

  assert.equal(created.item.status, 'PENDING');
  assert.equal(created.item.adjustment_reference, 'ADJ-2026-9901');
  assert.equal(created.item.items[0].quantity_difference, 6);

  // Reject duplicate adjustment_reference
  await assert.rejects(
    () =>
      createStockAdjustment({
        adjustment_reference: 'ADJ-2026-9901',
        adjustment_type: 'CORRECTION',
        reason: 'Duplicate ref check',
        items: [{ variant_id: 101, quantity_before: 240, quantity_after: 240 }],
      }),
    /already exists/i
  );

  // Reject manual quantity_difference submission
  await assert.rejects(
    () =>
      createStockAdjustment({
        adjustment_reference: 'ADJ-2026-9902',
        adjustment_type: 'CORRECTION',
        reason: 'Manual diff check',
        items: [
          {
            variant_id: 101,
            quantity_before: 240,
            quantity_after: 235,
            quantity_difference: -5,
          },
        ],
      }),
    /GENERATED ALWAYS STORED/i
  );
});

test('Sales Returns service creates PENDING return and validates sale item quantities', async () => {
  const listRes = await getSalesReturns();
  assert.equal(listRes.endpoint, API_ENDPOINTS.LIST_RETURNS);
  assert.ok(listRes.items.length >= 5);

  for (const ret of listRes.items) {
    assert.ok(VALID_RETURN_STATUSES.includes(ret.return_status));
  }

  // Create valid PENDING sales return
  const created = await createSalesReturn({
    sale_id: 2047,
    return_reason: 'Automated test return for minor fabric pull',
    notes: 'Verified receipt',
    items: [
      {
        sale_item_id: 7004,
        quantity: 1,
      },
    ],
  });

  assert.equal(created.item.return_status, 'PENDING');
  assert.equal(created.item.sale_id, 2047);
  assert.ok(created.item.total_refund_amount > 0);
  assert.equal(
    created.item.items[0].refund_subtotal,
    created.item.total_refund_amount
  );

  // Reject manual refund_subtotal
  await assert.rejects(
    () =>
      createSalesReturn({
        sale_id: 2047,
        return_reason: 'Manual subtotal check',
        items: [
          {
            sale_item_id: 7004,
            quantity: 1,
            refund_subtotal: 100,
          },
        ],
      }),
    /GENERATED ALWAYS STORED/i
  );

  // Reject quantity exceeding remaining eligible quantity
  await assert.rejects(
    () =>
      createSalesReturn({
        sale_id: 2047,
        return_reason: 'Excess return quantity check',
        items: [
          {
            sale_item_id: 7004,
            quantity: 999,
          },
        ],
      }),
    /exceeds remaining eligible quantity/i
  );
});

test('Movement History and Audit Reports services aggregate cross-referenced records accurately', async () => {
  const history = await getMovementHistorySnapshot();
  assert.ok(history.movements.length >= 10);
  assert.ok(history.adjustments.length >= 5);
  assert.ok(history.returns.length >= 5);
  assert.ok(history.variants.length >= 5);

  const auditRes = await getAuditReports();
  assert.equal(auditRes.endpoint, AUDIT_REPORT_ENDPOINTS.GET_AUDIT_REPORTS);
  assert.ok(auditRes.items.length > 0);
  assert.equal(auditRes.summary.totalEvents, auditRes.items.length);
  assert.equal(auditRes.summary.chartSeries.length, 10);

  const stockAuditRes = await getStockAuditReports();
  assert.equal(
    stockAuditRes.endpoint,
    AUDIT_REPORT_ENDPOINTS.GET_STOCK_AUDIT_REPORTS
  );
  assert.ok(stockAuditRes.items.every((item) => item.is_stock_audit === true));
});
