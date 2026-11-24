-- CloudDB Sentinel
-- Module: Purchase Management
-- Purchase constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;


-- 1. Validate invoice number.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'purchases'
      AND CONSTRAINT_NAME = 'chk_invoice_number_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE purchases ADD CONSTRAINT chk_invoice_number_not_empty CHECK (invoice_number IS NULL OR CHAR_LENGTH(TRIM(invoice_number)) > 0)',
    'SELECT ''Invoice number constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Prevent duplicate supplier invoice numbers.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'purchases'
      AND CONSTRAINT_NAME = 'uq_supplier_invoice'
      AND CONSTRAINT_TYPE = 'UNIQUE'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE purchases ADD CONSTRAINT uq_supplier_invoice UNIQUE (supplier_id, invoice_number)',
    'SELECT ''Supplier invoice constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
