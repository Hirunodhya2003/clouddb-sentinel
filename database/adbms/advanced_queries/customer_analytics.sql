-- Owner: Member 06
-- TODO: write SQL
-- Owner: Member 06
-- Customer registration and contact analytics.

USE clouddb_sentinel;

-- Percentage of customers in each status.
SELECT
    status,
    COUNT(*) AS customer_count,
    ROUND(
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers),
        2
    ) AS percentage_of_customers
FROM customers
GROUP BY status
ORDER BY customer_count DESC, status;

-- Monthly registrations with a cumulative total.
WITH monthly_registrations AS (
    SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS registration_month,
        COUNT(*) AS new_customers
    FROM customers
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
)
SELECT
    registration_month,
    new_customers,
    SUM(new_customers) OVER (
        ORDER BY registration_month
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_customers
FROM monthly_registrations
ORDER BY registration_month;

-- Registrations during the last 30 days.
SELECT
    DATE(created_at) AS registration_date,
    COUNT(*) AS new_customers
FROM customers
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL 30 DAY
GROUP BY DATE(created_at)
ORDER BY registration_date;

-- Customers with neither an email nor a phone number.
SELECT
    id,
    name,
    status
FROM customers
WHERE NULLIF(TRIM(email), '') IS NULL
  AND NULLIF(TRIM(phone), '') IS NULL
ORDER BY id;

-- Latest customer records.
SELECT
    id,
    name,
    email,
    phone,
    status,
    created_at
FROM customers
ORDER BY created_at DESC, id DESC
LIMIT 10;