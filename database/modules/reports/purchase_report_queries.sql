-- Owner: Member 09
-- Module: Business Reports - Purchase Report Queries
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- ============================================================
-- 1. Supplier Procurement Summary
-- ============================================================
SELECT
    sup.supplier_id,
    sup.supplier_name,
    sup.contact_person,
    sup.city,
    COUNT(pu.purchase_id) AS total_purchase_orders,
    SUM(CASE WHEN pu.status = 'RECEIVED' THEN 1 ELSE 0 END) AS received_orders,
    SUM(CASE WHEN pu.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
    ROUND(COALESCE(SUM(CASE WHEN pu.status = 'RECEIVED' THEN pu.total_amount ELSE 0 END), 0.00), 2) AS received_spend,
    ROUND(COALESCE(SUM(CASE WHEN pu.status = 'PENDING' THEN pu.total_amount ELSE 0 END), 0.00), 2) AS pending_commitment,
    MAX(pu.purchase_date) AS last_order_date
FROM suppliers sup
LEFT JOIN purchases pu
    ON pu.supplier_id = sup.supplier_id
GROUP BY
    sup.supplier_id,
    sup.supplier_name,
    sup.contact_person,
    sup.city
ORDER BY received_spend DESC, total_purchase_orders DESC;
