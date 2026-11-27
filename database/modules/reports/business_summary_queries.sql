-- Owner: Member 09
-- Module: Business Reports - Executive Business Summary Queries
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- ============================================================
-- 1. Executive Snapshot from business_summary_view
-- ============================================================
SELECT
    completed_sales_count,
    gross_sales_revenue,
    total_discounts_given,
    pending_sales_count,
    received_purchases_count,
    total_purchase_spend,
    pending_purchases_count,
    estimated_net_cashflow,
    active_products_count,
    active_variants_count,
    total_units_in_stock,
    inventory_cost_value,
    inventory_retail_value,
    low_stock_variants_count,
    out_of_stock_variants_count,
    active_customers_count,
    active_suppliers_count
FROM business_summary_view;


-- ============================================================
-- 2. Monthly Revenue vs Procurement Cost Comparison
-- ============================================================
SELECT
    periods.period_month,
    COALESCE(sales_agg.monthly_revenue, 0.00) AS monthly_sales_revenue,
    COALESCE(sales_agg.sales_orders, 0) AS completed_sales_orders,
    COALESCE(purch_agg.monthly_spend, 0.00) AS monthly_purchase_spend,
    COALESCE(purch_agg.purchase_orders, 0) AS received_purchase_orders,
    ROUND(
        COALESCE(sales_agg.monthly_revenue, 0.00) - COALESCE(purch_agg.monthly_spend, 0.00),
        2
    ) AS net_monthly_spread
FROM (
    SELECT DATE_FORMAT(sale_date, '%Y-%m') AS period_month FROM sales
    UNION
    SELECT DATE_FORMAT(purchase_date, '%Y-%m') AS period_month FROM purchases
) AS periods
LEFT JOIN (
    SELECT
        DATE_FORMAT(sale_date, '%Y-%m') AS period_month,
        COUNT(sale_id) AS sales_orders,
        ROUND(SUM(total_amount), 2) AS monthly_revenue
    FROM sales
    WHERE status = 'COMPLETED'
    GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
) AS sales_agg
    ON sales_agg.period_month = periods.period_month
LEFT JOIN (
    SELECT
        DATE_FORMAT(purchase_date, '%Y-%m') AS period_month,
        COUNT(purchase_id) AS purchase_orders,
        ROUND(SUM(total_amount), 2) AS monthly_spend
    FROM purchases
    WHERE status = 'RECEIVED'
    GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
) AS purch_agg
    ON purch_agg.period_month = periods.period_month
ORDER BY periods.period_month DESC;


-- ============================================================
-- 3. Unified Recent Transactions Feed (Sales & Purchases)
-- ============================================================
(
    SELECT
        'SALE' AS transaction_type,
        s.sale_id AS record_id,
        s.invoice_number AS reference_number,
        COALESCE(c.name, 'Walk-in Customer') AS counterparty_name,
        s.total_amount AS amount,
        s.status AS status,
        s.sale_date AS occurred_at
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    ORDER BY s.sale_date DESC
    LIMIT 10
)
UNION ALL
(
    SELECT
        'PURCHASE' AS transaction_type,
        pu.purchase_id AS record_id,
        COALESCE(pu.invoice_number, CONCAT('PO-', pu.purchase_id)) AS reference_number,
        sup.supplier_name AS counterparty_name,
        pu.total_amount AS amount,
        pu.status AS status,
        pu.purchase_date AS occurred_at
    FROM purchases pu
    INNER JOIN suppliers sup ON sup.supplier_id = pu.supplier_id
    ORDER BY pu.purchase_date DESC
    LIMIT 10
)
ORDER BY occurred_at DESC
LIMIT 15;
