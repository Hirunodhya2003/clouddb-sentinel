-- Owner: Member 06
-- Verify existing customer data and transaction rollback.

USE clouddb_sentinel;

SELECT
    'No missing or blank customer names' AS test_name,
    COUNT(*) AS violation_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM customers
WHERE name IS NULL
   OR CHAR_LENGTH(TRIM(name)) = 0

UNION ALL

SELECT
    'No invalid customer statuses',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM customers
WHERE status IS NULL
   OR status NOT IN ('Active', 'Inactive')

UNION ALL

SELECT
    'No duplicate non-NULL emails',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM (
    SELECT email
    FROM customers
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
) AS duplicate_emails;


-- Generate a unique email for this rollback test.
SET @customer_test_email = CONCAT(
    'rollback-',
    UUID(),
    '@example.com'
);

START TRANSACTION;

INSERT INTO customers (name, email, phone, status)
VALUES (
    'SQL Rollback Test',
    @customer_test_email,
    NULL,
    'Active'
);

SELECT
    'Customer exists inside transaction' AS test_name,
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM customers
WHERE email = @customer_test_email;

ROLLBACK;

SELECT
    'Test customer removed after rollback' AS test_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM customers
WHERE email = @customer_test_email;
