-- CloudDB Sentinel
-- Module: User Management
-- User validation constraints
-- Idempotent: safe to execute more than once

USE clouddb_sentinel;

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'chk_users_employee_code'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT chk_users_employee_code CHECK (CHAR_LENGTH(TRIM(employee_code)) > 0)',
    'SELECT ''chk_users_employee_code already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'chk_users_username'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT chk_users_username CHECK (CHAR_LENGTH(TRIM(username)) > 0)',
    'SELECT ''chk_users_username already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'chk_users_email'
);

SET @sql = IF(
    @constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT chk_users_email CHECK (email REGEXP ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'')',
    'SELECT ''chk_users_email already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
