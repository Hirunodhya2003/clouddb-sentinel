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
    ) AS estimated_net_cashflow;
