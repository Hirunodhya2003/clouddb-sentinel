-- Owner: Member 06
-- TODO: write SQL

-- Owner: Member 06
-- Sample suppliers for local development and demonstrations.

USE clouddb_sentinel;

START TRANSACTION;

INSERT INTO suppliers (
    supplier_name,
    contact_person,
    email,
    phone,
    address,
    city,
    is_active
)
SELECT
    seed.supplier_name,
    seed.contact_person,
    seed.email,
    NULL,
    NULL,
    seed.city,
    TRUE
FROM (
    SELECT
        'Demo Fabric Supplier' AS supplier_name,
        'Demo Fabric Contact' AS contact_person,
        'demo.fabric@example.com' AS email,
        'Colombo' AS city
    UNION ALL
    SELECT
        'Demo Apparel Supplier',
        'Demo Apparel Contact',
        'demo.apparel@example.com',
        'Gampaha'
    UNION ALL
    SELECT
        'Demo Accessories Supplier',
        'Demo Accessories Contact',
        'demo.accessories@example.com',
        'Kandy'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM suppliers AS existing
    WHERE existing.email = seed.email
);

COMMIT;

SELECT
    supplier_id,
    supplier_name,
    contact_person,
    email,
    city,
    is_active
FROM suppliers
WHERE email IN (
    'demo.fabric@example.com',
    'demo.apparel@example.com',
    'demo.accessories@example.com'
)
ORDER BY supplier_name;