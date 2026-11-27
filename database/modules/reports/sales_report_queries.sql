-- Owner: Member 09
-- Module: Business Reports - Sales Report Queries
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- ============================================================
-- 1. Daily Sales & Revenue Summary (Date Range Optimized)
-- ============================================================
SELECT
    DATE(s.sale_date) AS sale_day,
    COUNT(s.sale_id) AS invoice_count,
    SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_orders,
    COALESCE(SUM(s.subtotal), 0.00) AS gross_subtotal,
    COALESCE(SUM(s.discount_amount), 0.00) AS total_discounts,
    COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total_amount ELSE 0 END), 0.00) AS completed_revenue
FROM sales s
WHERE s.sale_date >= '2026-01-01'
  AND s.sale_date < '2027-01-01'
GROUP BY DATE(s.sale_date)
ORDER BY sale_day DESC;


-- ============================================================
-- 2. Product Variant & Category Sales Performance with Margin
-- ============================================================
SELECT
    c.category_name,
    p.product_code,
    p.product_name,
    pv.sku,
    sz.size_name,
    cl.colour_name,
    SUM(si.quantity) AS units_sold,
    ROUND(SUM(si.subtotal), 2) AS gross_revenue,
    ROUND(SUM(si.quantity * pv.cost_price), 2) AS estimated_cogs,
    ROUND(SUM(si.subtotal - (si.quantity * pv.cost_price)), 2) AS estimated_gross_profit,
    CASE
        WHEN SUM(si.subtotal) > 0 THEN
            ROUND((SUM(si.subtotal - (si.quantity * pv.cost_price)) / SUM(si.subtotal)) * 100, 2)
        ELSE 0.00
    END AS gross_margin_pct
FROM sale_items si
INNER JOIN sales s
    ON s.sale_id = si.sale_id
INNER JOIN product_variants pv
    ON pv.variant_id = si.variant_id
INNER JOIN products p
    ON p.product_id = pv.product_id
INNER JOIN categories c
    ON c.category_id = p.category_id
INNER JOIN sizes sz
    ON sz.size_id = pv.size_id
INNER JOIN colours cl
    ON cl.colour_id = pv.colour_id
WHERE s.status = 'COMPLETED'
GROUP BY
    c.category_name,
    p.product_code,
    p.product_name,
    pv.sku,
    sz.size_name,
    cl.colour_name
ORDER BY gross_revenue DESC;


-- ============================================================
-- 3. Top Customers by Completed Spend
-- ============================================================
SELECT
    COALESCE(c.id, 0) AS customer_id,
    COALESCE(c.name, 'Walk-in Customer') AS customer_name,
    c.email,
    COUNT(s.sale_id) AS completed_orders,
    ROUND(SUM(s.total_amount), 2) AS lifetime_spend,
    ROUND(AVG(s.total_amount), 2) AS avg_order_value,
    MAX(s.sale_date) AS last_purchase_at
FROM sales s
LEFT JOIN customers c
    ON c.id = s.customer_id
WHERE s.status = 'COMPLETED'
GROUP BY COALESCE(c.id, 0), COALESCE(c.name, 'Walk-in Customer'), c.email
ORDER BY lifetime_spend DESC
LIMIT 25;


-- ============================================================
-- 4. Payment Method Distribution for Completed Sales
-- ============================================================
SELECT
    pm.payment_method,
    COUNT(pm.payment_id) AS payment_count,
    ROUND(SUM(pm.amount), 2) AS total_collected
FROM payments pm
INNER JOIN sales s
    ON s.sale_id = pm.sale_id
WHERE s.status = 'COMPLETED'
  AND pm.payment_status = 'COMPLETED'
GROUP BY pm.payment_method
ORDER BY total_collected DESC;
