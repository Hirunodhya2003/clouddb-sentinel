-- Owner: Member 05
-- Purpose: Additional inventory and stock adjustment validation constraints.
-- MySQL 8.0+
-- Existing quantity, reference, reason and foreign-key constraints are
-- defined in the corresponding CREATE TABLE scripts.

USE clouddb_sentinel;

-- An optional item reason must contain meaningful text when provided.
-- Check the constraint first to make this script safe to rerun.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_adjustment_items'
      AND CONSTRAINT_NAME = 'chk_adjustment_item_reason_not_empty'
      AND CONSTRAINT_TYPE = 'CHECK'
);

SET @ddl = IF(
    @constraint_exists = 0,
    'ALTER TABLE stock_adjustment_items
     ADD CONSTRAINT chk_adjustment_item_reason_not_empty
     CHECK (item_reason IS NULL OR CHAR_LENGTH(TRIM(item_reason)) > 0)',
    'SELECT ''Constraint chk_adjustment_item_reason_not_empty already exists'' AS result'
);

PREPARE constraint_stmt FROM @ddl;
EXECUTE constraint_stmt;
DEALLOCATE PREPARE constraint_stmt;
