-- Owner: Member 06
-- TODO: write SQL
-- Owner: Member 06
-- Sample customer records for development and demonstrations.

USE clouddb_sentinel;

START TRANSACTION;

INSERT INTO customers (name, email, phone, status)
SELECT
    'Demo Retail Customer',
    'demo.retail@example.com',
    NULL,
    'Active'
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'demo.retail@example.com'
);

INSERT INTO customers (name, email, phone, status)
SELECT
    'Demo Wholesale Customer',
    'demo.wholesale@example.com',
    NULL,
    'Active'
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'demo.wholesale@example.com'
);

INSERT INTO customers (name, email, phone, status)
SELECT
    'Demo Inactive Customer',
    'demo.inactive@example.com',
    NULL,
    'Inactive'
WHERE NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE email = 'demo.inactive@example.com'
);

COMMIT;

SELECT id, name, email, phone, status
FROM customers
WHERE email IN (
    'demo.retail@example.com',
    'demo.wholesale@example.com',
    'demo.inactive@example.com'
)
ORDER BY id;