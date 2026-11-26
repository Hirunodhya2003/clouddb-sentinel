-- Owner: Member 03
-- View: Product Summary View
-- Description: Displays product details with category and variant count.

USE clouddb_sentinel;

CREATE OR REPLACE VIEW product_view AS
SELECT
    p.product_id,
    p.product_name,
    p.brand,
    p.description,
    c.category_id,
    c.category_name,
    p.is_active,
    COUNT(pv.variant_id) AS variant_count,
    p.created_at,
    p.updated_at
FROM products p
INNER JOIN categories c
    ON p.category_id = c.category_id
LEFT JOIN product_variants pv
    ON p.product_id = pv.product_id
GROUP BY
    p.product_id,
    p.product_name,
    p.brand,
    p.description,
    c.category_id,
    c.category_name,
    p.is_active,
    p.created_at,
    p.updated_at;