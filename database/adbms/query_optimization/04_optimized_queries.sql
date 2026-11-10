-- CloudDB Sentinel
-- Owner: Member 09
-- Task: Candidate Optimized SQL Queries
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- Query 01: Retrieve completed sales within a date range.
-- Uses a half-open date range to support efficient
-- filtering on the sale_date column.

SELECT
    sale_id,
    invoice_number,
    sale_date,
    total_amount
FROM sales
WHERE sale_date >= '2026-01-01'
  AND sale_date < '2027-01-01'
  AND status = 'COMPLETED'
ORDER BY sale_date DESC;


-- Query 02: Retrieve one invoice using its unique invoice number.
-- The unique constraint on invoice_number supports direct lookup.

SELECT
    s.invoice_number,
    s.sale_date,
    p.product_name,
    pv.sku,
    si.quantity,
    si.unit_price,
    si.subtotal
FROM sales s
INNER JOIN sale_items si
    ON si.sale_id = s.sale_id
INNER JOIN product_variants pv
    ON pv.variant_id = si.variant_id
INNER JOIN products p
    ON p.product_id = pv.product_id
WHERE s.invoice_number = 'INV-001';


-- Query 03: Retrieve low-stock inventory.
-- Select only required columns instead of using SELECT *.

SELECT
    pv.sku,
    p.product_name,
    i.quantity_on_hand,
    i.reorder_level
FROM inventory i
INNER JOIN product_variants pv
    ON pv.variant_id = i.variant_id
INNER JOIN products p
    ON p.product_id = pv.product_id
WHERE i.quantity_on_hand <= i.reorder_level
ORDER BY i.quantity_on_hand ASC;
