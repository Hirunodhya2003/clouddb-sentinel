-- Owner: Member 06
-- TODO: write SQL

-- Owner: Member 06
-- Sample variants for local development and demonstrations.
-- Requires the demo products from 03_products.sql.
-- Run sequentially in one database session.

USE clouddb_sentinel;

START TRANSACTION;

-- Sample sizes.
INSERT INTO sizes (size_name, description, is_active)
SELECT seed.size_name, seed.description, TRUE
FROM (
    SELECT 'M' AS size_name, 'Medium' AS description
    UNION ALL
    SELECT 'L', 'Large'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM sizes AS existing
    WHERE existing.size_name = seed.size_name
);

-- Sample colours.
INSERT INTO colours (colour_name, colour_code, is_active)
SELECT seed.colour_name, seed.colour_code, TRUE
FROM (
    SELECT 'Black' AS colour_name, '#000000' AS colour_code
    UNION ALL
    SELECT 'White', '#FFFFFF'
    UNION ALL
    SELECT 'Navy', '#000080'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM colours AS existing
    WHERE existing.colour_name = seed.colour_name
);

-- Insert variants using looked-up foreign keys.
INSERT INTO product_variants (
    product_id,
    size_id,
    colour_id,
    sku,
    cost_price,
    selling_price,
    is_active
)
SELECT
    product.product_id,
    size.size_id,
    colour.colour_id,
    seed.sku,
    seed.cost_price,
    seed.selling_price,
    TRUE
FROM (
    SELECT
        'Demo Cotton T-Shirt' AS product_name,
        'Demo T-Shirts' AS category_name,
        'M' AS size_name,
        'Black' AS colour_name,
        'DEMO-TSHIRT-M-BLK' AS sku,
        800.00 AS cost_price,
        1500.00 AS selling_price
    UNION ALL
    SELECT
        'Demo Formal Shirt',
        'Demo Shirts',
        'L',
        'White',
        'DEMO-SHIRT-L-WHT',
        1500.00,
        2500.00
    UNION ALL
    SELECT
        'Demo Casual Trousers',
        'Demo Trousers',
        'M',
        'Navy',
        'DEMO-TROUSER-M-NVY',
        1800.00,
        3000.00
) AS seed
JOIN categories AS category
    ON category.category_name = seed.category_name
JOIN products AS product
    ON product.category_id = category.category_id
   AND product.product_name = seed.product_name
   AND product.brand = 'Demo Brand'
JOIN sizes AS size
    ON size.size_name = seed.size_name
JOIN colours AS colour
    ON colour.colour_name = seed.colour_name
WHERE NOT EXISTS (
    SELECT 1
    FROM product_variants AS existing
    WHERE existing.sku = seed.sku
       OR (
           existing.product_id = product.product_id
           AND existing.size_id = size.size_id
           AND existing.colour_id = colour.colour_id
       )
);

COMMIT;

-- Verify the three demo SKUs.
SELECT
    variant.variant_id,
    product.product_name,
    size.size_name,
    colour.colour_name,
    variant.sku,
    variant.cost_price,
    variant.selling_price
FROM product_variants AS variant
JOIN products AS product
    ON product.product_id = variant.product_id
JOIN sizes AS size
    ON size.size_id = variant.size_id
JOIN colours AS colour
    ON colour.colour_id = variant.colour_id
WHERE variant.sku IN (
    'DEMO-TSHIRT-M-BLK',
    'DEMO-SHIRT-L-WHT',
    'DEMO-TROUSER-M-NVY'
)
ORDER BY variant.sku;