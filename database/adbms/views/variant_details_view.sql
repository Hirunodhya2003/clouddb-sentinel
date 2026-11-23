-- Owner: Member 03
-- View: Variant Details View
-- Description: Displays complete product variant information.

USE clouddb_sentinel;

CREATE OR REPLACE VIEW variant_details_view AS
SELECT
    pv.variant_id,
    pv.product_id,
    p.product_name,
    pv.sku,
    s.size_id,
    s.size_name,
    c.colour_id,
    c.colour_name,
    c.colour_code,
    pv.cost_price,
    pv.selling_price,
    (pv.selling_price - pv.cost_price) AS profit_amount,
    CASE
        WHEN pv.selling_price > 0 THEN
            ROUND(
                ((pv.selling_price - pv.cost_price)
                / pv.selling_price) * 100, 2
            )
        ELSE 0
    END AS profit_margin_percentage,
    pv.is_active,
    pv.created_at,
    pv.updated_at
FROM product_variants pv
INNER JOIN products p
    ON pv.product_id = p.product_id
INNER JOIN sizes s
    ON pv.size_id = s.size_id
INNER JOIN colours c
    ON pv.colour_id = c.colour_id;