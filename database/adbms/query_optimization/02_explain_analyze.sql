-- CloudDB Sentinel
-- Owner: Member 09
-- Task: Query Optimization - EXPLAIN ANALYZE
-- Requirement: MySQL 8.0.18+

USE clouddb_sentinel;

-- Query 01: Analyze completed sales by date.

EXPLAIN ANALYZE
SELECT
    sale_id,
    invoice_number,
    sale_date,
    total_amount
FROM sales
WHERE status = 'COMPLETED'
  AND sale_date >= '2026-01-01'
  AND sale_date < '2027-01-01'
ORDER BY sale_date DESC;


-- Query 02: Analyze invoice details and related product information.

EXPLAIN ANALYZE
SELECT
    s.invoice_number,
    s.sale_date,
    p.product_name,
    si.quantity,
    si.unit_price,
    si.subtotal
FROM sales s
INNER JOIN sale_items si
    ON s.sale_id = si.sale_id
INNER JOIN product_variants pv
    ON si.variant_id = pv.variant_id
INNER JOIN products p
    ON pv.product_id = p.product_id
WHERE s.invoice_number = 'INV-001';


-- Query 03: Analyze low-stock inventory.

EXPLAIN ANALYZE
SELECT
    p.product_name,
    pv.sku,
    i.quantity_on_hand,
    i.reorder_level
FROM inventory i
INNER JOIN product_variants pv
    ON i.variant_id = pv.variant_id
INNER JOIN products p
    ON pv.product_id = p.product_id
WHERE i.quantity_on_hand <= i.reorder_level
ORDER BY i.quantity_on_hand ASC;
