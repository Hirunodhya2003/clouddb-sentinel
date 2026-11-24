-- CloudDB Sentinel
-- Owner: Member 09
-- Task: Query Optimization - EXPLAIN
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- Query 01: Find completed sales within a date range.
-- Purpose: Analyze filtering using sale_date and status indexes.

EXPLAIN
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


-- Query 02: Retrieve sale details using an invoice number.
-- Purpose: Analyze joins between sales, sale_items,
-- product_variants and products.

EXPLAIN
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


-- Query 03: Identify products that have reached their reorder level.
-- Purpose: Analyze inventory filtering and product joins.

EXPLAIN
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
