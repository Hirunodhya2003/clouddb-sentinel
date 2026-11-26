-- CloudDB Sentinel
-- Owner: Member 08
-- Module: Stock Movement Management
-- Stock movement integrity constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;


-- 1. Validate reference_type is not empty whitespace when provided.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND CONSTRAINT_NAME = 'chk_stock_movement_reference_type_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movement_reference_type_not_empty CHECK (reference_type IS NULL OR CHAR_LENGTH(TRIM(reference_type)) > 0)',
    'SELECT ''Stock movement reference_type constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Validate reference_id is positive when provided.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND CONSTRAINT_NAME = 'chk_stock_movement_reference_id_positive'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movement_reference_id_positive CHECK (reference_id IS NULL OR reference_id > 0)',
    'SELECT ''Stock movement reference_id constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3. Validate notes are not empty whitespace when provided.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND CONSTRAINT_NAME = 'chk_stock_movement_notes_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movement_notes_not_empty CHECK (notes IS NULL OR CHAR_LENGTH(TRIM(notes)) > 0)',
    'SELECT ''Stock movement notes constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
