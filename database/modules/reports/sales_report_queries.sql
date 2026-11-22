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
