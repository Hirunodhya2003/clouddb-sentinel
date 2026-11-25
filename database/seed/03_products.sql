-- Owner: Member 06
-- TODO: write SQL

-- Owner: Member 06
-- Sample products for local development and demonstrations.
-- Run after 02_categories.sql.

USE clouddb_sentinel;

START TRANSACTION;

INSERT INTO products (
    category_id,
    product_name,
    description,
    brand,
    is_active
)
SELECT
    category.category_id,
    seed.product_name,
    seed.description,
    'Demo Brand',
    TRUE
FROM (
    SELECT
        'Demo T-Shirts' AS category_name,
        'Demo Cotton T-Shirt' AS product_name,
        'Sample cotton T-shirt for testing' AS description
    UNION ALL
    SELECT
        'Demo Shirts',
        'Demo Formal Shirt',
        'Sample formal shirt for testing'
    UNION ALL
    SELECT
        'Demo Trousers',
        'Demo Casual Trousers',
        'Sample casual trousers for testing'
) AS seed
JOIN categories AS category
    ON category.category_name = seed.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM products AS existing
    WHERE existing.category_id = category.category_id
      AND existing.product_name = seed.product_name
      AND existing.brand = 'Demo Brand'
);

COMMIT;

SELECT
    product.product_id,
    category.category_name,
    product.product_name,
    product.brand,
    product.is_active
FROM products AS product
JOIN categories AS category
    ON category.category_id = product.category_id
WHERE product.brand = 'Demo Brand'
  AND product.product_name IN (
      'Demo Cotton T-Shirt',
      'Demo Formal Shirt',
      'Demo Casual Trousers'
  )
ORDER BY product.product_name;