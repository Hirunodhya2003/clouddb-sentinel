-- CloudDB Sentinel
-- Owner: Member 05
-- Purpose: Additional inventory management indexes.
-- MySQL 8.0+
-- Idempotent: safe to execute repeatedly.

USE clouddb_sentinel;

-- 1. Composite index for adjustment status and date searches.
SET @idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_adjustments'
      AND INDEX_NAME = 'idx_adjustment_status_date'
);

SET @ddl = IF(
    @idx = 0,
    'CREATE INDEX idx_adjustment_status_date
     ON stock_adjustments (status, adjustment_date)',
    'SELECT ''Status-date index already exists'' AS result'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Composite index for adjustment type and date searches.
SET @idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_adjustments'
      AND INDEX_NAME = 'idx_adjustment_type_date'
);

SET @ddl = IF(
    @idx = 0,
    'CREATE INDEX idx_adjustment_type_date
     ON stock_adjustments (adjustment_type, adjustment_date)',
    'SELECT ''Type-date index already exists'' AS result'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Composite index for inventory reorder analysis.
SET @idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'inventory'
      AND INDEX_NAME = 'idx_inventory_reorder_quantity'
);

SET @ddl = IF(
    @idx = 0,
    'CREATE INDEX idx_inventory_reorder_quantity
     ON inventory (reorder_level, quantity_on_hand)',
    'SELECT ''Reorder-quantity index already exists'' AS result'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Composite index for variant stock movement history.
SET @idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND INDEX_NAME = 'idx_stock_movements_variant_date'
);

SET @ddl = IF(
    @idx = 0,
    'CREATE INDEX idx_stock_movements_variant_date
     ON stock_movements (variant_id, movement_date)',
    'SELECT ''Variant-date index already exists'' AS result'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Composite index for stock movement history.
SET @idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND INDEX_NAME = 'idx_stock_movements_variant_date'
);

SET @ddl = IF(
    @idx = 0,
    'CREATE INDEX idx_stock_movements_variant_date
     ON stock_movements (variant_id, movement_date)',
    'SELECT ''Variant-date index already exists'' AS result'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
