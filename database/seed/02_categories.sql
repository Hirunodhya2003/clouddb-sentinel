-- Owner: Member 06
-- TODO: write SQL

-- Owner: Member 06
-- Sample categories for local development and demonstrations.
-- Run before 03_products.sql.

USE clouddb_sentinel;

START TRANSACTION;

INSERT INTO categories (category_name, description, is_active)
SELECT seed.category_name, seed.description, TRUE
FROM (
    SELECT
        'Demo T-Shirts' AS category_name,
        'Sample T-shirt category' AS description
    UNION ALL
    SELECT 'Demo Shirts', 'Sample shirt category'
    UNION ALL
    SELECT 'Demo Trousers', 'Sample trouser category'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM categories AS existing
    WHERE existing.category_name = seed.category_name
);

COMMIT;

SELECT category_id, category_name, is_active
FROM categories
WHERE category_name IN (
    'Demo T-Shirts',
    'Demo Shirts',
    'Demo Trousers'
)
ORDER BY category_name;