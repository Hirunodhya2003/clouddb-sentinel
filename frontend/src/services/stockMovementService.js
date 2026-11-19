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

export default {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_MOVEMENT_TYPES,
  MOVEMENT_TYPE_META,
  getStockMovements,
  getStockMovementById,
};
