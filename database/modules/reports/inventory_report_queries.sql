-- Owner: Member 09
-- Module: Business Reports - Inventory Report Queries (Read-Only)
-- Note: Strictly read-only per CloudDB Sentinel inventory rule (Section 7.3).
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- ============================================================
-- 1. Detailed Variant Inventory Valuation & Reorder Status
-- ============================================================
SELECT
    i.inventory_id,
    c.category_name,
    p.product_code,
    p.product_name,
    pv.variant_id,
    pv.sku,
    sz.size_name,
    cl.colour_name,
    i.quantity_on_hand,
    i.reorder_level,
    pv.cost_price,
    pv.selling_price,
    ROUND(i.quantity_on_hand * pv.cost_price, 2) AS stock_cost_value,
    ROUND(i.quantity_on_hand * pv.selling_price, 2) AS stock_retail_value,
    CASE
        WHEN i.quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity_on_hand <= i.reorder_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_health_status,
    i.last_stock_updated
FROM inventory i
INNER JOIN product_variants pv
    ON pv.variant_id = i.variant_id
INNER JOIN products p
    ON p.product_id = pv.product_id
INNER JOIN categories c
    ON c.category_id = p.category_id
INNER JOIN sizes sz
    ON sz.size_id = pv.size_id
INNER JOIN colours cl
    ON cl.colour_id = pv.colour_id
ORDER BY i.quantity_on_hand ASC, stock_retail_value DESC;


-- ============================================================
-- 2. Category-Level Stock Distribution & Valuation Summary
-- ============================================================
SELECT
    c.category_id,
    c.category_name,
    COUNT(DISTINCT p.product_id) AS product_count,
    COUNT(DISTINCT pv.variant_id) AS variant_count,
    COALESCE(SUM(i.quantity_on_hand), 0) AS total_units_on_hand,
    ROUND(COALESCE(SUM(i.quantity_on_hand * pv.cost_price), 0.00), 2) AS total_cost_valuation,
    ROUND(COALESCE(SUM(i.quantity_on_hand * pv.selling_price), 0.00), 2) AS total_retail_valuation,
    SUM(CASE WHEN i.quantity_on_hand <= i.reorder_level THEN 1 ELSE 0 END) AS low_or_empty_variants
FROM categories c
LEFT JOIN products p
    ON p.category_id = c.category_id
LEFT JOIN product_variants pv
    ON pv.product_id = p.product_id
LEFT JOIN inventory i
    ON i.variant_id = pv.variant_id
GROUP BY c.category_id, c.category_name
ORDER BY total_retail_valuation DESC;


-- ============================================================
-- 3. Stock Movement Ledger Summary by Movement Type
-- ============================================================
SELECT
    sm.movement_type,
    COUNT(sm.movement_id) AS movement_events,
    SUM(sm.quantity) AS total_units_moved,
    MIN(sm.movement_date) AS first_recorded_at,
    MAX(sm.movement_date) AS latest_recorded_at
FROM stock_movements sm
GROUP BY sm.movement_type
ORDER BY total_units_moved DESC;
