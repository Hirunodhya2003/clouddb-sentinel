-- Owner: Member 03
-- Advanced Queries: Nested Queries
-- Description: Demonstrates nested subqueries using EXISTS, NOT EXISTS and derived tables.

USE clouddb_sentinel;

-- 1. Nested query using EXISTS
-- Find products that have at least one active variant.

SELECT
    p.product_id,
    p.product_name
FROM products p
WHERE EXISTS (
    SELECT 1
    FROM product_variants pv
    WHERE pv.product_id = p.product_id
      AND pv.is_active = TRUE
);


-- 2. Nested query using NOT EXISTS
-- Find products that do not have any variants.

SELECT
    p.product_id,
    p.product_name
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM product_variants pv
    WHERE pv.product_id = p.product_id
);


-- 3. Nested query using a derived table
-- Display products with their variant counts.

SELECT
    p.product_id,
    p.product_name,
    COALESCE(v.variant_count, 0) AS variant_count
FROM products p
LEFT JOIN (
    SELECT
        product_id,
        COUNT(*) AS variant_count
    FROM product_variants
    GROUP BY product_id
) AS v
    ON p.product_id = v.product_id;


-- 4. Nested query using HAVING
-- Find products whose variant count is greater than the average variant count.

SELECT
    p.product_id,
    p.product_name,
    COUNT(pv.variant_id) AS variant_count
FROM products p
LEFT JOIN product_variants pv
    ON p.product_id = pv.product_id
GROUP BY
    p.product_id,
    p.product_name
HAVING COUNT(pv.variant_id) > (
    SELECT AVG(variant_count)
    FROM (
        SELECT COUNT(*) AS variant_count
        FROM product_variants
        GROUP BY product_id
    ) AS variant_summary
);
