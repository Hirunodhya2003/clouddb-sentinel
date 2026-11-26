-- Owner: Member 06
-- TODO: write SQL
-- Owner: Member 06
-- Customer aggregate functions.

USE clouddb_sentinel;

-- Total customers, available contact details and registration dates.
SELECT
    COUNT(*) AS total_customers,
    COUNT(email) AS customers_with_email,
    COUNT(NULLIF(TRIM(phone), '')) AS customers_with_phone,
    MIN(created_at) AS earliest_registration,
    MAX(created_at) AS latest_registration,
    ROUND(AVG(CHAR_LENGTH(name)), 2) AS average_name_length
FROM customers;

-- Conditional aggregation.
SELECT
    COUNT(*) AS total_customers,
    COALESCE(SUM(status = 'Active'), 0) AS active_customers,
    COALESCE(SUM(status = 'Inactive'), 0) AS inactive_customers
FROM customers;

-- GROUP BY.
SELECT
    status,
    COUNT(*) AS customer_count
FROM customers
GROUP BY status
ORDER BY customer_count DESC, status;

-- GROUP BY with HAVING.
SELECT
    DATE(created_at) AS registration_date,
    COUNT(*) AS customer_count
FROM customers
GROUP BY DATE(created_at)
HAVING COUNT(*) >= 2
ORDER BY registration_date DESC;