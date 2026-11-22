-- Owner: Member 09
-- View: business_summary_view
-- Description: Consolidated executive KPI summary across sales, purchases,
--              inventory valuation, products, customers, and suppliers.
-- MySQL Version: 8.0+

USE clouddb_sentinel;

CREATE OR REPLACE VIEW business_summary_view AS
SELECT
    -- Sales KPIs
    (SELECT COUNT(*)
     FROM sales s
     WHERE s.status = 'COMPLETED') AS completed_sales_count,

    (SELECT COALESCE(SUM(s.total_amount), 0.00)
     FROM sales s
     WHERE s.status = 'COMPLETED') AS gross_sales_revenue,

    (SELECT COALESCE(SUM(s.discount_amount), 0.00)
     FROM sales s
     WHERE s.status = 'COMPLETED') AS total_discounts_given,

    (SELECT COUNT(*)
     FROM sales s
     WHERE s.status = 'PENDING') AS pending_sales_count,

    -- Purchase KPIs
    (SELECT COUNT(*)
     FROM purchases p
     WHERE p.status = 'RECEIVED') AS received_purchases_count,

    (SELECT COALESCE(SUM(p.total_amount), 0.00)
     FROM purchases p
     WHERE p.status = 'RECEIVED') AS total_purchase_spend,

    (SELECT COUNT(*)
     FROM purchases p
     WHERE p.status = 'PENDING') AS pending_purchases_count,

    -- Net operational cashflow (completed sales minus received purchases)
    (
        (SELECT COALESCE(SUM(s.total_amount), 0.00)
         FROM sales s
         WHERE s.status = 'COMPLETED')
        -
        (SELECT COALESCE(SUM(p.total_amount), 0.00)
         FROM purchases p
         WHERE p.status = 'RECEIVED')
    ) AS estimated_net_cashflow,

    -- Catalog & Inventory KPIs
    (SELECT COUNT(*)
     FROM products pr
     WHERE pr.status = 'active') AS active_products_count,

    (SELECT COUNT(*)
     FROM product_variants pv
     WHERE pv.is_active = TRUE) AS active_variants_count,

    (SELECT COALESCE(SUM(i.quantity_on_hand), 0)
     FROM inventory i) AS total_units_in_stock,

    (SELECT COALESCE(ROUND(SUM(i.quantity_on_hand * pv.cost_price), 2), 0.00)
     FROM inventory i
     INNER JOIN product_variants pv ON pv.variant_id = i.variant_id) AS inventory_cost_value,

    (SELECT COALESCE(ROUND(SUM(i.quantity_on_hand * pv.selling_price), 2), 0.00)
     FROM inventory i
     INNER JOIN product_variants pv ON pv.variant_id = i.variant_id) AS inventory_retail_value,

    (SELECT COUNT(*)
     FROM inventory i
     WHERE i.quantity_on_hand <= i.reorder_level
       AND i.quantity_on_hand > 0) AS low_stock_variants_count,

    (SELECT COUNT(*)
     FROM inventory i
     WHERE i.quantity_on_hand = 0) AS out_of_stock_variants_count,

    -- Customer & Supplier KPIs
    (SELECT COUNT(*)
     FROM customers c
     WHERE c.status = 'Active') AS active_customers_count,

    (SELECT COUNT(*)
     FROM suppliers sup
     WHERE sup.is_active = TRUE) AS active_suppliers_count;
