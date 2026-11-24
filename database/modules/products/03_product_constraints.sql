-- CloudDB Sentinel
-- Module: Product Management
-- Product constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND CONSTRAINT_NAME = 'chk_product_name_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE products ADD CONSTRAINT chk_product_name_not_empty CHECK (CHAR_LENGTH(TRIM(product_name)) > 0)',
    'SELECT ''Product name constraint already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'categories'
      AND CONSTRAINT_NAME = 'chk_category_name_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE categories ADD CONSTRAINT chk_category_name_not_empty CHECK (CHAR_LENGTH(TRIM(category_name)) > 0)',
    'SELECT ''Category name constraint already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
