-- CloudDB Sentinel
-- Module: Sales Management
-- Sales constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;


-- 1. Validate invoice number.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND CONSTRAINT_NAME = 'chk_sales_invoice_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE sales ADD CONSTRAINT chk_sales_invoice_not_empty CHECK (CHAR_LENGTH(TRIM(invoice_number)) > 0)',
    'SELECT ''Sales invoice constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Validate discount amount.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND CONSTRAINT_NAME = 'chk_sales_discount_limit'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE sales ADD CONSTRAINT chk_sales_discount_limit CHECK (discount_amount <= subtotal)',
    'SELECT ''Sales discount constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
