-- CloudDB Sentinel
-- Module: Product Variant Management
-- Variant constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_variants'
      AND CONSTRAINT_NAME = 'chk_variant_sku_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE product_variants ADD CONSTRAINT chk_variant_sku_not_empty CHECK (CHAR_LENGTH(TRIM(sku)) > 0)',
    'SELECT ''Variant SKU constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
