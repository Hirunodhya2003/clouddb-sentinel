-- CloudDB Sentinel
-- Module: Customer Management
-- Customer constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;


-- 1. Validate customer first name.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customers'
      AND CONSTRAINT_NAME = 'chk_customer_first_name'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE customers ADD CONSTRAINT chk_customer_first_name CHECK (CHAR_LENGTH(TRIM(first_name)) > 0)',
    'SELECT ''Customer first name constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Validate customer email when provided.

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customers'
      AND CONSTRAINT_NAME = 'chk_customer_email_not_empty'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE customers ADD CONSTRAINT chk_customer_email_not_empty CHECK (email IS NULL OR CHAR_LENGTH(TRIM(email)) > 0)',
    'SELECT ''Customer email constraint already exists'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
