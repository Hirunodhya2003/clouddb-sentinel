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
