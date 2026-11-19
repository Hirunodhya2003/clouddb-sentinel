// Owner: Member 08
// Stock Movement Service
// Designed around assignment API endpoints:
//   - GET /api/v1/stock-movements
//   - GET /api/v1/stock-movements/{id}
//
// DEVELOPMENT-ONLY MOCK MODE:
// The shared FastAPI backend and frontend/src/services/api.js are not implemented yet.
// While IS_DEVELOPMENT_MOCK_MODE is true, this service returns deterministic local mock
// records that strictly conform to database/modules/stock_movements/01_create_stock_movements_table.sql
// without making network requests.

export const IS_DEVELOPMENT_MOCK_MODE = true;

export const API_ENDPOINTS = Object.freeze({
  LIST_STOCK_MOVEMENTS: '/api/v1/stock-movements',
  GET_STOCK_MOVEMENT_BY_ID: (movementId) => `/api/v1/stock-movements/${movementId}`,
  LIST_STOCK_ADJUSTMENTS: '/api/v1/stock-adjustments',
  CREATE_STOCK_ADJUSTMENT: '/api/v1/stock-adjustments',
  GET_STOCK_ADJUSTMENT_BY_ID: (adjustmentId) =>
    `/api/v1/stock-adjustments/${adjustmentId}`,
});

/**
 * Exact ENUM values defined in database/modules/stock_movements/01_create_stock_movements_table.sql
 */
export const VALID_MOVEMENT_TYPES = Object.freeze([
  'PURCHASE',
  'SALE',
  'CUSTOMER_RETURN',
  'SUPPLIER_RETURN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'DAMAGE',
]);

export const MOVEMENT_TYPE_META = Object.freeze({
  PURCHASE: {
    code: 'PURCHASE',
    label: 'Purchase',
    categoryLabel: 'Procurement / Inbound',
    direction: 'INBOUND',
    sign: '+',
    badgeTone: 'blue',
  },
  SALE: {
    code: 'SALE',
    label: 'Sale',
    categoryLabel: 'Sales / Outbound',
    direction: 'OUTBOUND',
    sign: '-',
    badgeTone: 'blue',
  },
  CUSTOMER_RETURN: {
    code: 'CUSTOMER_RETURN',
    label: 'Customer Return',
    categoryLabel: 'Returns / Inbound',
    direction: 'INBOUND',
    sign: '+',
    badgeTone: 'blue',
  },
  SUPPLIER_RETURN: {
    code: 'SUPPLIER_RETURN',
    label: 'Supplier Return',
    categoryLabel: 'Procurement / Outbound',
    direction: 'OUTBOUND',
    sign: '-',
    badgeTone: 'amber',
  },
  ADJUSTMENT_IN: {
    code: 'ADJUSTMENT_IN',
    label: 'Adjustment In',
    categoryLabel: 'Stock / Adjustment',
    direction: 'INBOUND',
    sign: '+',
    badgeTone: 'blue',
  },
  ADJUSTMENT_OUT: {
    code: 'ADJUSTMENT_OUT',
    label: 'Adjustment Out',
    categoryLabel: 'Stock / Adjustment',
    direction: 'OUTBOUND',
    sign: '-',
    badgeTone: 'amber',
  },
  DAMAGE: {
    code: 'DAMAGE',
    label: 'Damage',
    categoryLabel: 'Write-off / Outbound',
    direction: 'OUTBOUND',
    sign: '-',
    badgeTone: 'amber',
  },
});

/**
 * Development-only mock dataset matching stock_movements schema:
 *   movement_id      BIGINT AUTO_INCREMENT PRIMARY KEY
 *   variant_id       INT NOT NULL (FK -> product_variants.variant_id)
 *   movement_type    ENUM(...) NOT NULL
 *   quantity         INT NOT NULL CHECK (quantity > 0)
 *   reference_type   VARCHAR(50)
 *   reference_id     BIGINT
 *   movement_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
 *   notes            TEXT
 * Plus joined read-only variant/product display fields for UI presentation.
 */
const MOCK_STOCK_MOVEMENTS = Object.freeze([
  {
    movement_id: 1001,
    variant_id: 101,
    movement_type: 'PURCHASE',
    quantity: 248,
    reference_type: 'PURCHASE',
    reference_id: 4001,
    movement_date: '2026-11-17T09:15:00Z',
    notes: 'Opening bulk shipment received from S.P. Apparels Tirupur knitting unit.',
    sku: 'SPA-OXF-NVY-M',
    product_name: 'Classic Oxford Button-Down Shirt',
    category_name: 'Apparel / Retail',
    size_name: 'M',
    colour_name: 'Navy Blue',
  },
  {
    movement_id: 1002,
    variant_id: 104,
    movement_type: 'ADJUSTMENT_IN',
    quantity: 42,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2101,
    movement_date: '2026-11-17T11:40:00Z',
    notes: 'Cycle count surplus reconciled in Rack B-04 during morning warehouse audit.',
    sku: 'SPA-CHN-KHK-32',
    product_name: 'Stretch Chino Trousers',
    category_name: 'Stock / Distribution',
    size_name: '32',
    colour_name: 'Khaki',
  },
  {
    movement_id: 1003,
    variant_id: 102,
    movement_type: 'DAMAGE',
    quantity: 14,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2102,
    movement_date: '2026-11-17T13:05:00Z',
    notes: 'Transit moisture damage identified on outer carton; quarantined and written off.',
    sku: 'SPA-POL-WHT-L',
    product_name: 'Pima Cotton Pique Polo',
    category_name: 'Stock / Quality Control',
    size_name: 'L',
    colour_name: 'Crisp White',
  },
  {
    movement_id: 1004,
    variant_id: 107,
    movement_type: 'SALE',
    quantity: 36,
    reference_type: 'SALE',
    reference_id: 8801,
    movement_date: '2026-11-17T14:22:00Z',
    notes: 'Retail invoice INV-8801 fulfilled for corporate uniform order.',
    sku: 'SPA-BLZ-CHR-40',
    product_name: 'Tailored Merino Blend Blazer',
    category_name: 'Business / Sales',
    size_name: '40',
    colour_name: 'Charcoal',
  },
  {
    movement_id: 1005,
    variant_id: 109,
    movement_type: 'CUSTOMER_RETURN',
    quantity: 6,
    reference_type: 'SALES_RETURN',
    reference_id: 3011,
    movement_date: '2026-11-17T15:50:00Z',
    notes: 'Size exchange return inspected and restocked into main retail inventory.',
    sku: 'SPA-DNM-IND-34',
    product_name: 'Selvedge Slim Denim Jeans',
    category_name: 'Apparel / Retail',
    size_name: '34',
    colour_name: 'Indigo',
  },
  {
    movement_id: 1006,
    variant_id: 105,
    movement_type: 'SUPPLIER_RETURN',
    quantity: 20,
    reference_type: 'PURCHASE',
    reference_id: 3994,
    movement_date: '2026-11-17T17:10:00Z',
    notes: 'Returned off-shade dye batch to supplier under debit note DN-3994.',
    sku: 'SPA-LIN-OLV-L',
    product_name: 'Washed Linen Resort Shirt',
    category_name: 'Stock / Distribution',
    size_name: 'L',
    colour_name: 'Olive Green',
  },
  {
    movement_id: 1007,
    variant_id: 103,
    movement_type: 'PURCHASE',
    quantity: 180,
    reference_type: 'PURCHASE',
    reference_id: 4002,
    movement_date: '2026-11-16T10:00:00Z',
    notes: 'Replenishment delivery for high-demand winter fleece collection.',
    sku: 'SPA-FLC-BLK-XL',
    product_name: 'Heavyweight Brushed Fleece Hoodie',
    category_name: 'Apparel / Retail',
    size_name: 'XL',
    colour_name: 'Jet Black',
  },
  {
    movement_id: 1008,
    variant_id: 106,
    movement_type: 'ADJUSTMENT_OUT',
    quantity: 9,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2098,
    movement_date: '2026-11-16T12:30:00Z',
    notes: 'Physical inventory variance adjustment approved by warehouse manager.',
    sku: 'SPA-TEE-GRY-S',
    product_name: 'Organic Supima Crewneck Tee',
    category_name: 'Stock / Distribution',
    size_name: 'S',
    colour_name: 'Heather Grey',
  },
  {
    movement_id: 1009,
    variant_id: 101,
    movement_type: 'SALE',
    quantity: 54,
    reference_type: 'SALE',
    reference_id: 8795,
    movement_date: '2026-11-16T15:18:00Z',
    notes: 'Multi-item store checkout batch dispatched from central stockroom.',
    sku: 'SPA-OXF-NVY-M',
    product_name: 'Classic Oxford Button-Down Shirt',
    category_name: 'Business / Sales',
    size_name: 'M',
    colour_name: 'Navy Blue',
  },
  {
    movement_id: 1010,
    variant_id: 108,
    movement_type: 'CUSTOMER_RETURN',
    quantity: 4,
    reference_type: 'SALES_RETURN',
    reference_id: 3009,
    movement_date: '2026-11-15T11:12:00Z',
    notes: 'Unworn garments returned within 14-day policy window; tags verified intact.',
    sku: 'SPA-KNT-BRG-M',
    product_name: 'Cable Knit Cotton Cardigan',
    category_name: 'Apparel / Retail',
    size_name: 'M',
    colour_name: 'Burgundy',
  },
  {
    movement_id: 1011,
    variant_id: 110,
    movement_type: 'PURCHASE',
    quantity: 320,
    reference_type: 'PURCHASE',
    reference_id: 3989,
    movement_date: '2026-11-15T14:45:00Z',
    notes: 'Seasonal core essentials restock received and barcode-verified.',
    sku: 'SPA-TEE-WHT-M',
    product_name: 'Organic Supima Crewneck Tee',
    category_name: 'Stock / Distribution',
    size_name: 'M',
    colour_name: 'Optical White',
  },
  {
    movement_id: 1012,
    variant_id: 111,
    movement_type: 'DAMAGE',
    quantity: 7,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2091,
    movement_date: '2026-11-14T09:50:00Z',
    notes: 'Garment steamer scorch marks during display prep; removed from sellable stock.',
    sku: 'SPA-SLK-CMP-S',
    product_name: 'Satin Collar Evening Blouse',
    category_name: 'Stock / Quality Control',
    size_name: 'S',
    colour_name: 'Champagne',
  },
  {
    movement_id: 1013,
    variant_id: 104,
    movement_type: 'SALE',
    quantity: 28,
    reference_type: 'SALE',
    reference_id: 8760,
    movement_date: '2026-11-14T16:05:00Z',
    notes: 'POS completed sale transaction across flagship retail counters.',
    sku: 'SPA-CHN-KHK-32',
    product_name: 'Stretch Chino Trousers',
    category_name: 'Business / Sales',
    size_name: '32',
    colour_name: 'Khaki',
  },
  {
    movement_id: 1014,
    variant_id: 112,
    movement_type: 'ADJUSTMENT_IN',
    quantity: 15,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2085,
    movement_date: '2026-11-13T10:25:00Z',
    notes: 'Unallocated reserve stock box located in mezzanine bin M-12.',
    sku: 'SPA-JCK-OLV-L',
    product_name: 'Quilted Field Utility Jacket',
    category_name: 'Stock / Distribution',
    size_name: 'L',
    colour_name: 'Olive Drab',
  },
  {
    movement_id: 1015,
    variant_id: 102,
    movement_type: 'SUPPLIER_RETURN',
    quantity: 12,
    reference_type: 'PURCHASE',
    reference_id: 3972,
    movement_date: '2026-11-13T13:40:00Z',
    notes: 'Collar stitching defect batch returned to vendor for credit memo.',
    sku: 'SPA-POL-WHT-L',
    product_name: 'Pima Cotton Pique Polo',
    category_name: 'Stock / Distribution',
    size_name: 'L',
    colour_name: 'Crisp White',
  },
  {
    movement_id: 1016,
    variant_id: 107,
    movement_type: 'PURCHASE',
    quantity: 95,
    reference_type: 'PURCHASE',
    reference_id: 3965,
    movement_date: '2026-11-12T08:55:00Z',
    notes: 'Tailored suiting delivery checked against purchase order PO-3965.',
    sku: 'SPA-BLZ-CHR-40',
    product_name: 'Tailored Merino Blend Blazer',
    category_name: 'Apparel / Retail',
    size_name: '40',
    colour_name: 'Charcoal',
  },
  {
    movement_id: 1017,
    variant_id: 109,
    movement_type: 'ADJUSTMENT_OUT',
    quantity: 5,
    reference_type: 'STOCK_ADJUSTMENT',
    reference_id: 2079,
    movement_date: '2026-11-12T15:30:00Z',
    notes: 'Shrinkage write-down recorded after monthly stock reconciliation.',
    sku: 'SPA-DNM-IND-34',
    product_name: 'Selvedge Slim Denim Jeans',
    category_name: 'Stock / Distribution',
    size_name: '34',
    colour_name: 'Indigo',
  },
  {
    movement_id: 1018,
    variant_id: 103,
    movement_type: 'SALE',
    quantity: 64,
    reference_type: 'SALE',
    reference_id: 8712,
    movement_date: '2026-11-11T18:00:00Z',
    notes: 'Seasonal promotional sale batch completed at Colombo branch.',
    sku: 'SPA-FLC-BLK-XL',
    product_name: 'Heavyweight Brushed Fleece Hoodie',
    category_name: 'Business / Sales',
    size_name: 'XL',
    colour_name: 'Jet Black',
  },
]);

/**
 * Helper to enrich a stock movement record with derived UI metadata while
 * preserving all raw SQL columns intact.
 */
export function enrichStockMovement(record) {
  const meta = MOVEMENT_TYPE_META[record.movement_type] || {
    code: record.movement_type,
    label: record.movement_type,
    categoryLabel: 'Stock / Operations',
    direction: 'INBOUND',
    sign: '+',
    badgeTone: 'blue',
  };

  return {
    ...record,
    record_code: `MOV-${record.movement_id}`,
    reference_code:
      record.reference_type && record.reference_id
        ? `${record.reference_type} #${record.reference_id}`
        : 'N/A',
    movement_label: meta.label,
    category_type_label: `${record.category_name || meta.categoryLabel} · ${meta.label}`,
    direction: meta.direction,
    sign: meta.sign,
    badge_tone: meta.badgeTone,
  };
}

/**
 * Fetch list of stock movements.
 * Maps to: GET /api/v1/stock-movements
 *
 * @param {Object} [options]
 * @param {boolean} [options.simulateError=false] - Development helper to test error state UI
 * @returns {Promise<{ items: Array, total: number, isMockMode: boolean, endpoint: string }>}
 */
export async function getStockMovements(options = {}) {
  const { simulateError = false } = options;

  if (IS_DEVELOPMENT_MOCK_MODE) {
    if (simulateError) {
      throw new Error(
        'Simulated error while reading local development mock stock movements dataset.'
      );
    }

    const items = MOCK_STOCK_MOVEMENTS.map(enrichStockMovement);
    return {
      items,
      total: items.length,
      isMockMode: true,
      endpoint: API_ENDPOINTS.LIST_STOCK_MOVEMENTS,
    };
  }

  throw new Error(
    `Backend API integration (${API_ENDPOINTS.LIST_STOCK_MOVEMENTS}) requires frontend/src/services/api.js (Member 02) and FastAPI backend.`
  );
}

/**
 * Fetch a single stock movement by movement_id.
 * Maps to: GET /api/v1/stock-movements/{id}
 *
 * @param {number|string} movementId
 * @returns {Promise<{ item: Object, isMockMode: boolean, endpoint: string }>}
 */
export async function getStockMovementById(movementId) {
  const numericId = Number(movementId);

  if (IS_DEVELOPMENT_MOCK_MODE) {
    const found = MOCK_STOCK_MOVEMENTS.find(
      (record) => record.movement_id === numericId
    );

    if (!found) {
      throw new Error(`Stock movement record #${movementId} was not found.`);
    }

    return {
      item: enrichStockMovement(found),
      isMockMode: true,
      endpoint: API_ENDPOINTS.GET_STOCK_MOVEMENT_BY_ID(numericId),
    };
  }

  throw new Error(
    `Backend API integration (${API_ENDPOINTS.GET_STOCK_MOVEMENT_BY_ID(numericId)}) requires frontend/src/services/api.js (Member 02) and FastAPI backend.`
  );
}

// ============================================================================
// STOCK ADJUSTMENTS & VARIANTS REFERENCE DATA (Member 08 — Figma UI 18 & UI 19)
// ============================================================================
// Conforms strictly to:
//   - database/modules/inventory/03_create_stock_adjustments_table.sql
//   - database/modules/inventory/04_create_stock_adjustment_items_table.sql
//
// Assignment API endpoints:
//   - GET  /api/v1/stock-adjustments
//   - GET  /api/v1/stock-adjustments/{id}
//   - POST /api/v1/stock-adjustments
//
// IMPORTANT ADBMS RULE (README.md Section 7.3):
//   In production, inventory quantities are updated ONLY by Member 05's
//   sp_update_inventory stored procedure. In development mock mode, creating
//   a stock adjustment records a PENDING adjustment in local memory only and
//   does NOT mutate inventory quantities or create stock_movements rows.
// ============================================================================

/**
 * Exact ENUM values from database/modules/inventory/03_create_stock_adjustments_table.sql
 */
export const VALID_ADJUSTMENT_TYPES = Object.freeze([
  'PHYSICAL_COUNT',
  'DAMAGE',
  'LOSS',
  'CORRECTION',
  'OTHER',
]);

export const VALID_ADJUSTMENT_STATUSES = Object.freeze([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
]);

export const ADJUSTMENT_TYPE_META = Object.freeze({
  PHYSICAL_COUNT: {
    code: 'PHYSICAL_COUNT',
    label: 'Physical Count',
    categoryLabel: 'Audit / Cycle Count',
  },
  DAMAGE: {
    code: 'DAMAGE',
    label: 'Damage',
    categoryLabel: 'Stock / Quality Control',
  },
  LOSS: {
    code: 'LOSS',
    label: 'Loss',
    categoryLabel: 'Shrinkage / Variance',
  },
  CORRECTION: {
    code: 'CORRECTION',
    label: 'Correction',
    categoryLabel: 'Inventory / Reconciliation',
  },
  OTHER: {
    code: 'OTHER',
    label: 'Other',
    categoryLabel: 'Operations / General',
  },
});

export const ADJUSTMENT_STATUS_META = Object.freeze({
  PENDING: {
    code: 'PENDING',
    label: 'Pending',
    badgeTone: 'amber',
  },
  APPROVED: {
    code: 'APPROVED',
    label: 'Approved',
    badgeTone: 'blue',
  },
  REJECTED: {
    code: 'REJECTED',
    label: 'Rejected',
    badgeTone: 'amber',
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: 'Completed',
    badgeTone: 'blue',
  },
});

/**
 * Mock Product Variants reference dataset (read-only) for Create Stock Adjustment form.
 * Includes current_quantity_on_hand as a reference baseline for quantity_before.
 */
export const MOCK_PRODUCT_VARIANTS = Object.freeze([
  {
    variant_id: 101,
    sku: 'SPA-OXF-NVY-M',
    product_name: 'Classic Oxford Button-Down Shirt',
    category_name: 'Apparel / Retail',
    size_name: 'M',
    colour_name: 'Navy Blue',
    current_quantity_on_hand: 194,
  },
  {
    variant_id: 102,
    sku: 'SPA-POL-WHT-L',
    product_name: 'Pima Cotton Pique Polo',
    category_name: 'Stock / Quality Control',
    size_name: 'L',
    colour_name: 'Crisp White',
    current_quantity_on_hand: 82,
  },
  {
    variant_id: 103,
    sku: 'SPA-FLC-BLK-XL',
    product_name: 'Heavyweight Brushed Fleece Hoodie',
    category_name: 'Apparel / Retail',
    size_name: 'XL',
    colour_name: 'Jet Black',
    current_quantity_on_hand: 116,
  },
  {
    variant_id: 104,
    sku: 'SPA-CHN-KHK-32',
    product_name: 'Stretch Chino Trousers',
    category_name: 'Stock / Distribution',
    size_name: '32',
    colour_name: 'Khaki',
    current_quantity_on_hand: 154,
  },
  {
    variant_id: 105,
    sku: 'SPA-LIN-OLV-L',
    product_name: 'Washed Linen Resort Shirt',
    category_name: 'Stock / Distribution',
    size_name: 'L',
    colour_name: 'Olive Green',
    current_quantity_on_hand: 68,
  },
  {
    variant_id: 106,
    sku: 'SPA-TEE-GRY-S',
    product_name: 'Organic Supima Crewneck Tee',
    category_name: 'Stock / Distribution',
    size_name: 'S',
    colour_name: 'Heather Grey',
    current_quantity_on_hand: 141,
  },
  {
    variant_id: 107,
    sku: 'SPA-BLZ-CHR-40',
    product_name: 'Tailored Merino Blend Blazer',
    category_name: 'Business / Sales',
    size_name: '40',
    colour_name: 'Charcoal',
    current_quantity_on_hand: 59,
  },
  {
    variant_id: 108,
    sku: 'SPA-KNT-BRG-M',
    product_name: 'Cable Knit Cotton Cardigan',
    category_name: 'Apparel / Retail',
    size_name: 'M',
    colour_name: 'Burgundy',
    current_quantity_on_hand: 44,
  },
  {
    variant_id: 109,
    sku: 'SPA-DNM-IND-34',
    product_name: 'Selvedge Slim Denim Jeans',
    category_name: 'Apparel / Retail',
    size_name: '34',
    colour_name: 'Indigo',
    current_quantity_on_hand: 91,
  },
  {
    variant_id: 110,
    sku: 'SPA-TEE-WHT-M',
    product_name: 'Organic Supima Crewneck Tee',
    category_name: 'Stock / Distribution',
    size_name: 'M',
    colour_name: 'Optical White',
    current_quantity_on_hand: 320,
  },
  {
    variant_id: 111,
    sku: 'SPA-SLK-CMP-S',
    product_name: 'Satin Collar Evening Blouse',
    category_name: 'Stock / Quality Control',
    size_name: 'S',
    colour_name: 'Champagne',
    current_quantity_on_hand: 37,
  },
  {
    variant_id: 112,
    sku: 'SPA-JCK-OLV-L',
    product_name: 'Quilted Field Utility Jacket',
    category_name: 'Stock / Distribution',
    size_name: 'L',
    colour_name: 'Olive Drab',
    current_quantity_on_hand: 75,
  },
]);

/**
 * Initial mock dataset for stock_adjustments and stock_adjustment_items.
 * Note: quantity_difference in stock_adjustment_items is a MySQL STORED GENERATED column
 * (quantity_after - quantity_before) and is computed dynamically in enrichStockAdjustment.
 */
const INITIAL_MOCK_STOCK_ADJUSTMENTS = [
  {
    adjustment_id: 2101,
    adjustment_reference: 'ADJ-2026-2101',
    adjustment_date: '2026-11-17T11:35:00Z',
    adjustment_type: 'PHYSICAL_COUNT',
    reason: 'Morning cycle count surplus verified in Rack B-04 during warehouse audit.',
    status: 'COMPLETED',
    created_by: 1,
    approved_by: 2,
    created_at: '2026-11-17T11:35:00Z',
    updated_at: '2026-11-17T11:40:00Z',
    items: [
      {
        adjustment_item_id: 5001,
        adjustment_id: 2101,
        variant_id: 104,
        quantity_before: 112,
        quantity_after: 154,
        item_reason: 'Unscanned pallet carton added to Rack B-04 count.',
      },
    ],
  },
  {
    adjustment_id: 2102,
    adjustment_reference: 'ADJ-2026-2102',
    adjustment_date: '2026-11-17T13:00:00Z',
    adjustment_type: 'DAMAGE',
    reason: 'Transit moisture damage identified on outer carton; quarantined and written off.',
    status: 'COMPLETED',
    created_by: 4,
    approved_by: 1,
    created_at: '2026-11-17T13:00:00Z',
    updated_at: '2026-11-17T13:05:00Z',
    items: [
      {
        adjustment_item_id: 5002,
        adjustment_id: 2102,
        variant_id: 102,
        quantity_before: 96,
        quantity_after: 82,
        item_reason: '14 polo units water-stained in transit carton #18.',
      },
    ],
  },
  {
    adjustment_id: 2103,
    adjustment_reference: 'ADJ-2026-2103',
    adjustment_date: '2026-11-17T16:15:00Z',
    adjustment_type: 'PHYSICAL_COUNT',
    reason: 'End-of-shift physical verification of flagship retail backroom.',
    status: 'PENDING',
    created_by: 4,
    approved_by: null,
    created_at: '2026-11-17T16:15:00Z',
    updated_at: '2026-11-17T16:15:00Z',
    items: [
      {
        adjustment_item_id: 5003,
        adjustment_id: 2103,
        variant_id: 101,
        quantity_before: 194,
        quantity_after: 198,
        item_reason: 'Found 4 units in overflow bin OB-02.',
      },
    ],
  },
  {
    adjustment_id: 2104,
    adjustment_reference: 'ADJ-2026-2104',
    adjustment_date: '2026-11-16T14:20:00Z',
    adjustment_type: 'CORRECTION',
    reason: 'SKU label misprint correction between Medium and Large linen batches.',
    status: 'APPROVED',
    created_by: 4,
    approved_by: 2,
    created_at: '2026-11-16T14:20:00Z',
    updated_at: '2026-11-16T15:00:00Z',
    items: [
      {
        adjustment_item_id: 5004,
        adjustment_id: 2104,
        variant_id: 105,
        quantity_before: 60,
        quantity_after: 68,
        item_reason: 'Reclassified 8 units after barcode verification.',
      },
    ],
  },
  {
    adjustment_id: 2098,
    adjustment_reference: 'ADJ-2026-2098',
    adjustment_date: '2026-11-16T12:20:00Z',
    adjustment_type: 'LOSS',
    reason: 'Physical inventory variance adjustment approved by warehouse manager.',
    status: 'COMPLETED',
    created_by: 4,
    approved_by: 2,
    created_at: '2026-11-16T12:20:00Z',
    updated_at: '2026-11-16T12:30:00Z',
    items: [
      {
        adjustment_item_id: 5005,
        adjustment_id: 2098,
        variant_id: 106,
        quantity_before: 150,
        quantity_after: 141,
        item_reason: 'Unaccounted shrinkage across Zone C.',
      },
    ],
  },
  {
    adjustment_id: 2095,
    adjustment_reference: 'ADJ-2026-2095',
    adjustment_date: '2026-11-15T17:05:00Z',
    adjustment_type: 'OTHER',
    reason: 'Unverified manual count submitted without supervisor sign-off sheet.',
    status: 'REJECTED',
    created_by: 4,
    approved_by: 1,
    created_at: '2026-11-15T17:05:00Z',
    updated_at: '2026-11-15T17:40:00Z',
    items: [
      {
        adjustment_item_id: 5006,
        adjustment_id: 2095,
        variant_id: 107,
        quantity_before: 59,
        quantity_after: 55,
        item_reason: 'Recount required before approval.',
      },
    ],
  },
  {
    adjustment_id: 2091,
    adjustment_reference: 'ADJ-2026-2091',
    adjustment_date: '2026-11-14T09:45:00Z',
    adjustment_type: 'DAMAGE',
    reason: 'Garment steamer scorch marks during display prep; removed from sellable stock.',
    status: 'COMPLETED',
    created_by: 2,
    approved_by: 1,
    created_at: '2026-11-14T09:45:00Z',
    updated_at: '2026-11-14T09:50:00Z',
    items: [
      {
        adjustment_item_id: 5007,
        adjustment_id: 2091,
        variant_id: 111,
        quantity_before: 44,
        quantity_after: 37,
        item_reason: '7 blouses damaged during showroom prep.',
      },
    ],
  },
  {
    adjustment_id: 2085,
    adjustment_reference: 'ADJ-2026-2085',
    adjustment_date: '2026-11-13T10:15:00Z',
    adjustment_type: 'PHYSICAL_COUNT',
    reason: 'Unallocated reserve stock box located in mezzanine bin M-12.',
    status: 'COMPLETED',
    created_by: 4,
    approved_by: 2,
    created_at: '2026-11-13T10:15:00Z',
    updated_at: '2026-11-13T10:25:00Z',
    items: [
      {
        adjustment_item_id: 5008,
        adjustment_id: 2085,
        variant_id: 112,
        quantity_before: 60,
        quantity_after: 75,
        item_reason: '15 utility jackets recovered from reserve bin M-12.',
      },
    ],
  },
  {
    adjustment_id: 2079,
    adjustment_reference: 'ADJ-2026-2079',
    adjustment_date: '2026-11-12T15:20:00Z',
    adjustment_type: 'LOSS',
    reason: 'Shrinkage write-down recorded after monthly stock reconciliation.',
    status: 'COMPLETED',
    created_by: 4,
    approved_by: 1,
    created_at: '2026-11-12T15:20:00Z',
    updated_at: '2026-11-12T15:30:00Z',
    items: [
      {
        adjustment_item_id: 5009,
        adjustment_id: 2079,
        variant_id: 109,
        quantity_before: 96,
        quantity_after: 91,
        item_reason: 'Monthly denim stockroom reconciliation.',
      },
    ],
  },
  {
    adjustment_id: 2074,
    adjustment_reference: 'ADJ-2026-2074',
    adjustment_date: '2026-11-11T11:00:00Z',
    adjustment_type: 'CORRECTION',
    reason: 'Receiving clerk data-entry correction on cotton cardigan carton count.',
    status: 'PENDING',
    created_by: 4,
    approved_by: null,
    created_at: '2026-11-11T11:00:00Z',
    updated_at: '2026-11-11T11:00:00Z',
    items: [
      {
        adjustment_item_id: 5010,
        adjustment_id: 2074,
        variant_id: 108,
        quantity_before: 40,
        quantity_after: 44,
        item_reason: 'Carton contained 24 units instead of 20.',
      },
    ],
  },
];

// Mutable development-only store so newly submitted PENDING adjustments appear in the list
let mockStockAdjustmentsStore = INITIAL_MOCK_STOCK_ADJUSTMENTS.map((adj) => ({
  ...adj,
  items: adj.items.map((item) => ({ ...item })),
}));

/**
 * Enriches a stock_adjustments record and its stock_adjustment_items with
 * read-only display metadata and the computed quantity_difference
 * (GENERATED ALWAYS AS (quantity_after - quantity_before) STORED).
 */
export function enrichStockAdjustment(adjustment) {
  const typeMeta = ADJUSTMENT_TYPE_META[adjustment.adjustment_type] || {
    code: adjustment.adjustment_type,
    label: adjustment.adjustment_type,
    categoryLabel: 'Stock / Adjustment',
  };

  const statusMeta = ADJUSTMENT_STATUS_META[adjustment.status] || {
    code: adjustment.status,
    label: adjustment.status,
    badgeTone: 'amber',
  };

  const enrichedItems = (adjustment.items || []).map((item) => {
    const variant =
      MOCK_PRODUCT_VARIANTS.find((v) => v.variant_id === Number(item.variant_id)) ||
      {};
    const qtyBefore = Number(item.quantity_before) || 0;
    const qtyAfter = Number(item.quantity_after) || 0;
    // Calculated for display only to mirror MySQL GENERATED ALWAYS AS (quantity_after - quantity_before) STORED
    const quantityDifference = qtyAfter - qtyBefore;

    return {
      adjustment_item_id: item.adjustment_item_id,
      adjustment_id: adjustment.adjustment_id,
      variant_id: Number(item.variant_id),
      quantity_before: qtyBefore,
      quantity_after: qtyAfter,
      quantity_difference: quantityDifference,
      item_reason: item.item_reason || null,
      sku: variant.sku || `VAR-${item.variant_id}`,
      product_name: variant.product_name || `Product Variant #${item.variant_id}`,
      category_name: variant.category_name || typeMeta.categoryLabel,
      size_name: variant.size_name || '—',
      colour_name: variant.colour_name || '—',
    };
  });

  const netQuantityDifference = enrichedItems.reduce(
    (sum, item) => sum + item.quantity_difference,
    0
  );

  const primaryItem = enrichedItems[0] || null;

  return {
    ...adjustment,
    adjustment_type_label: typeMeta.label,
    category_label: primaryItem?.category_name || typeMeta.categoryLabel,
    status_label: statusMeta.label,
    badge_tone: statusMeta.badgeTone,
    items: enrichedItems,
    item_count: enrichedItems.length,
    primary_item: primaryItem,
    net_quantity_difference: netQuantityDifference,
  };
}

/**
 * Returns mock product variants for variant selector inputs.
 */
export async function getMockProductVariants() {
  return {
    items: [...MOCK_PRODUCT_VARIANTS],
    isMockMode: IS_DEVELOPMENT_MOCK_MODE,
  };
}

/**
 * Fetch list of stock adjustments.
 * Maps to: GET /api/v1/stock-adjustments
 *
 * @param {Object} [options]
 * @param {boolean} [options.simulateError=false]
 * @returns {Promise<{ items: Array, total: number, isMockMode: boolean, endpoint: string }>}
 */
export async function getStockAdjustments(options = {}) {
  const { simulateError = false } = options;

  if (IS_DEVELOPMENT_MOCK_MODE) {
    if (simulateError) {
      throw new Error(
        'Simulated error while reading local development mock stock adjustments dataset.'
      );
    }

    const items = mockStockAdjustmentsStore.map(enrichStockAdjustment);
    return {
      items,
      total: items.length,
      isMockMode: true,
      endpoint: API_ENDPOINTS.LIST_STOCK_ADJUSTMENTS,
    };
  }

  throw new Error(
    `Backend API integration (${API_ENDPOINTS.LIST_STOCK_ADJUSTMENTS}) requires frontend/src/services/api.js (Member 02) and FastAPI backend.`
  );
}

/**
 * Fetch a single stock adjustment by adjustment_id.
 * Maps to: GET /api/v1/stock-adjustments/{id}
 *
 * @param {number|string} adjustmentId
 * @returns {Promise<{ item: Object, isMockMode: boolean, endpoint: string }>}
 */
export async function getStockAdjustmentById(adjustmentId) {
  const numericId = Number(adjustmentId);

  if (IS_DEVELOPMENT_MOCK_MODE) {
    const found = mockStockAdjustmentsStore.find(
      (adj) => adj.adjustment_id === numericId
    );

    if (!found) {
      throw new Error(`Stock adjustment record #${adjustmentId} was not found.`);
    }

    return {
      item: enrichStockAdjustment(found),
      isMockMode: true,
      endpoint: API_ENDPOINTS.GET_STOCK_ADJUSTMENT_BY_ID(numericId),
    };
  }

  throw new Error(
    `Backend API integration (${API_ENDPOINTS.GET_STOCK_ADJUSTMENT_BY_ID(numericId)}) requires frontend/src/services/api.js (Member 02) and FastAPI backend.`
  );
}

/**
 * Submit a new stock adjustment in development mock mode.
 * Maps to: POST /api/v1/stock-adjustments
 *
 * Enforces SQL schema constraints:
 *   - adjustment_reference: required, trimmed length > 0, <= 50 chars, unique
 *   - adjustment_type: must be in VALID_ADJUSTMENT_TYPES
 *   - reason: required, trimmed length > 0
 *   - status: always initialized as 'PENDING' (never auto-approved or completed)
 *   - items: at least 1 item, unique variant_id per adjustment, quantity_before >= 0, quantity_after >= 0
 *   - quantity_difference is NEVER accepted or stored manually (MySQL GENERATED ALWAYS column)
 *   - Does NOT modify inventory quantities or create stock_movements records.
 */
export async function createStockAdjustment(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid stock adjustment payload.');
  }

  const trimmedReference = String(payload.adjustment_reference ?? '').trim();
  if (!trimmedReference) {
    throw new Error(
      'Adjustment reference is required (chk_adjustment_reference_not_empty).'
    );
  }
  if (trimmedReference.length > 50) {
    throw new Error('Adjustment reference cannot exceed 50 characters.');
  }

  const duplicateReference = mockStockAdjustmentsStore.some(
    (adj) =>
      adj.adjustment_reference.toLowerCase() === trimmedReference.toLowerCase()
  );
  if (duplicateReference) {
    throw new Error(
      `Adjustment reference "${trimmedReference}" already exists (uq_adjustment_reference).`
    );
  }

  const adjustmentType = String(payload.adjustment_type ?? '').trim();
  if (!VALID_ADJUSTMENT_TYPES.includes(adjustmentType)) {
    throw new Error(
      `Invalid adjustment_type "${adjustmentType}". Must be one of: ${VALID_ADJUSTMENT_TYPES.join(', ')}.`
    );
  }

  const trimmedReason = String(payload.reason ?? '').trim();
  if (!trimmedReason) {
    throw new Error('Adjustment reason is required (chk_adjustment_reason_not_empty).');
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (rawItems.length === 0) {
    throw new Error('At least one stock adjustment item is required.');
  }

  const seenVariants = new Set();
  let nextItemId =
    mockStockAdjustmentsStore.reduce(
      (maxId, adj) =>
        Math.max(
          maxId,
          ...(adj.items || []).map((i) => Number(i.adjustment_item_id) || 0)
        ),
      5000
    ) + 1;

  const validatedItems = rawItems.map((rawItem, index) => {
    if ('quantity_difference' in rawItem) {
      throw new Error(
        'Do not submit quantity_difference manually; it is a MySQL GENERATED ALWAYS STORED column.'
      );
    }

    const variantId = Number(rawItem.variant_id);
    if (!Number.isInteger(variantId) || variantId <= 0) {
      throw new Error(`Item #${index + 1}: A valid product variant must be selected.`);
    }

    if (seenVariants.has(variantId)) {
      throw new Error(
        `Duplicate variant #${variantId} in adjustment items (violates uq_adjustment_variant).`
      );
    }
    seenVariants.add(variantId);

    const qtyBefore = Number(rawItem.quantity_before);
    const qtyAfter = Number(rawItem.quantity_after);

    if (
      rawItem.quantity_before === '' ||
      rawItem.quantity_before === null ||
      rawItem.quantity_before === undefined ||
      !Number.isInteger(qtyBefore) ||
      qtyBefore < 0
    ) {
      throw new Error(
        `Item #${index + 1}: quantity_before must be a non-negative integer (chk_adjustment_quantity_before).`
      );
    }

    if (
      rawItem.quantity_after === '' ||
      rawItem.quantity_after === null ||
      rawItem.quantity_after === undefined ||
      !Number.isInteger(qtyAfter) ||
      qtyAfter < 0
    ) {
      throw new Error(
        `Item #${index + 1}: quantity_after must be a non-negative integer (chk_adjustment_quantity_after).`
      );
    }

    const itemReason = rawItem.item_reason
      ? String(rawItem.item_reason).trim()
      : null;
    if (itemReason && itemReason.length > 255) {
      throw new Error(
        `Item #${index + 1}: item_reason cannot exceed 255 characters.`
      );
    }

    return {
      adjustment_item_id: nextItemId++,
      variant_id: variantId,
      quantity_before: qtyBefore,
      quantity_after: qtyAfter,
      item_reason: itemReason,
    };
  });

  if (IS_DEVELOPMENT_MOCK_MODE) {
    const nextAdjustmentId =
      mockStockAdjustmentsStore.reduce(
        (maxId, adj) => Math.max(maxId, Number(adj.adjustment_id) || 0),
        2100
      ) + 1;

    const nowIso = new Date().toISOString();
    const adjustmentDateIso = payload.adjustment_date
      ? new Date(payload.adjustment_date).toISOString()
      : nowIso;

    // Newly created adjustments are strictly PENDING in mock mode;
    // they do not auto-approve, do not mutate inventory, and do not add stock_movements.
    const newRecord = {
      adjustment_id: nextAdjustmentId,
      adjustment_reference: trimmedReference,
      adjustment_date: adjustmentDateIso,
      adjustment_type: adjustmentType,
      reason: trimmedReason,
      status: 'PENDING',
      created_by: Number(payload.created_by) || 4,
      approved_by: null,
      created_at: nowIso,
      updated_at: nowIso,
      items: validatedItems.map((item) => ({
        ...item,
        adjustment_id: nextAdjustmentId,
      })),
    };

    mockStockAdjustmentsStore = [newRecord, ...mockStockAdjustmentsStore];

    return {
      item: enrichStockAdjustment(newRecord),
      isMockMode: true,
      endpoint: API_ENDPOINTS.CREATE_STOCK_ADJUSTMENT,
      notice:
        'Development mock submission only: Added as PENDING in local memory. No database save, inventory update (sp_update_inventory), or stock_movements record was created.',
    };
  }

  throw new Error(
    `Backend API integration (${API_ENDPOINTS.CREATE_STOCK_ADJUSTMENT}) requires frontend/src/services/api.js (Member 02) and FastAPI backend.`
  );
}

export default {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_MOVEMENT_TYPES,
  MOVEMENT_TYPE_META,
  VALID_ADJUSTMENT_TYPES,
  VALID_ADJUSTMENT_STATUSES,
  ADJUSTMENT_TYPE_META,
  ADJUSTMENT_STATUS_META,
  MOCK_PRODUCT_VARIANTS,
  getStockMovements,
  getStockMovementById,
  getMockProductVariants,
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
};
