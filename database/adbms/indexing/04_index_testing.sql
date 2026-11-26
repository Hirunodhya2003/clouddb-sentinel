-- Owner: Member 05
-- Purpose: Verify inventory management indexes.
-- MySQL 8.0+

USE clouddb_sentinel;

-- Verify stock movement indexes.
SHOW INDEX FROM stock_movements;

-- Verify stock adjustment indexes.
SHOW INDEX FROM stock_adjustments;

-- Verify inventory indexes.
SHOW INDEX FROM inventory;

-- Test stock movement history query.
EXPLAIN
SELECT movement_id, variant_id, movement_type, quantity, movement_date
FROM stock_movements
WHERE variant_id = 1
ORDER BY movement_date DESC;

-- Test pending stock adjustment query.
EXPLAIN
SELECT adjustment_id, adjustment_reference, adjustment_date, status
FROM stock_adjustments
WHERE status = 'PENDING'
ORDER BY adjustment_date DESC;

-- Test inventory reorder query.
EXPLAIN
SELECT inventory_id, variant_id, quantity_on_hand, reorder_level
FROM inventory
WHERE reorder_level >= 0
ORDER BY reorder_level, quantity_on_hand;
