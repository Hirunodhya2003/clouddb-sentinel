-- CloudDB Sentinel
-- Owner: Member 05
-- Purpose: Capture execution plans after creating additional indexes.
-- MySQL 8.0+

USE clouddb_sentinel;

-- Query 1: Stock movement history for a product variant.
EXPLAIN
SELECT
    movement_id,
    variant_id,
    movement_type,
    quantity,
    movement_date
FROM stock_movements
WHERE variant_id = 1
ORDER BY movement_date DESC;

-- Query 2: Pending stock adjustments ordered by date.
EXPLAIN
SELECT
    adjustment_id,
    adjustment_reference,
    adjustment_date,
    status
FROM stock_adjustments
WHERE status = 'PENDING'
ORDER BY adjustment_date DESC;
