-- Owner: Member 06
-- TODO: write SQL
-- Owner: Member 06
-- Verify customer constraint definitions.

USE clouddb_sentinel;

SELECT
    'Customer primary key' AS test_name,
    CASE WHEN EXISTS (
        SELECT 1
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND COLUMN_NAME = 'id'
          AND CONSTRAINT_NAME = 'PRIMARY'
    ) THEN 'PASS' ELSE 'FAIL' END AS result

UNION ALL

SELECT
    'Customer name is required',
    CASE WHEN EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND COLUMN_NAME = 'name'
          AND IS_NULLABLE = 'NO'
    ) THEN 'PASS' ELSE 'FAIL' END

UNION ALL

SELECT
    'Unique email constraint',
    CASE WHEN EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND CONSTRAINT_NAME = 'uq_customers_email'
          AND CONSTRAINT_TYPE = 'UNIQUE'
    ) THEN 'PASS' ELSE 'FAIL' END

UNION ALL

SELECT
    'Nonblank name constraint',
    CASE WHEN EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND CONSTRAINT_NAME = 'chk_customers_name'
          AND CONSTRAINT_TYPE = 'CHECK'
          AND ENFORCED = 'YES'
    ) THEN 'PASS' ELSE 'FAIL' END

UNION ALL

SELECT
    'Valid status constraint',
    CASE WHEN EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND CONSTRAINT_NAME = 'chk_customers_status'
          AND CONSTRAINT_TYPE = 'CHECK'
          AND ENFORCED = 'YES'
    ) THEN 'PASS' ELSE 'FAIL' END;