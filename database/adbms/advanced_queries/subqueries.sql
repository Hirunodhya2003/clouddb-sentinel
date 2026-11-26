-- Owner: Member 03
-- Advanced Queries: Subqueries
-- Description: Demonstrates scalar, multi-row and correlated subqueries.

USE clouddb_sentinel;

-- 1. Scalar Subquery:
-- Find products belonging to the category with the highest category_id.
SELECT
    product_id,
    product_name,
    category_id
FROM products
WHERE category_id = (
    SELECT MAX(category_id)
    FROM categories
);


-- 2. Multi-row Subquery:
-- Find products that have at least one variant.
SELECT
    product_id,
    product_name
FROM products
WHERE product_id IN (
    SELECT product_id
    FROM product_variants
);


-- 3. Subquery with AVG:
-- Find variants with selling prices above the average selling price.
SELECT
    variant_id,
    sku,
    selling_price
FROM product_variants
WHERE selling_price > (
    SELECT AVG(selling_price)
    FROM product_variants
);


-- 4. Correlated Subquery:
-- Find products that have more variants than the average number of variants per product.
SELECT
    p.product_id,
    p.product_name
FROM products p
WHERE (
    SELECT COUNT(*)
    FROM product_variants pv
    WHERE pv.product_id = p.product_id
) > (
    SELECT AVG(variant_count)
    FROM (
        SELECT COUNT(*) AS variant_count
        FROM product_variants
        GROUP BY product_id
    ) AS variant_summary
);