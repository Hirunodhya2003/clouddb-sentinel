-- Owner: Member 03
-- Advanced Queries: JOIN Operations
-- Description: Demonstrates INNER JOIN, LEFT JOIN and multiple-table JOINs.

USE clouddb_sentinel;

-- 1. INNER JOIN: Products with their categories
SELECT
    p.product_id,
    p.product_name,
    p.brand,
    c.category_name
FROM products p
INNER JOIN categories c
    ON p.category_id = c.category_id;


-- 2. LEFT JOIN: All products with their variants
SELECT
    p.product_id,
    p.product_name,
    pv.variant_id,
    pv.sku,
    pv.selling_price
FROM products p
LEFT JOIN product_variants pv
    ON p.product_id = pv.product_id;


-- 3. Multiple-table JOIN: Complete variant information
SELECT
    pv.variant_id,
    p.product_name,
    pv.sku,
    s.size_name,
    c.colour_name,
    pv.cost_price,
    pv.selling_price
FROM product_variants pv
INNER JOIN products p
    ON pv.product_id = p.product_id
INNER JOIN sizes s
    ON pv.size_id = s.size_id
INNER JOIN colours c
    ON pv.colour_id = c.colour_id;


-- 4. LEFT JOIN: Categories and their products
SELECT
    c.category_id,
    c.category_name,
    p.product_id,
    p.product_name
FROM categories c
LEFT JOIN products p
    ON c.category_id = p.category_id;
