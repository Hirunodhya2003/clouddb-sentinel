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


-- ============================================================
-- 2. Monthly Procurement Spend & Order Volume Trend
-- ============================================================
SELECT
    DATE_FORMAT(pu.purchase_date, '%Y-%m') AS purchase_month,
    pu.status,
    COUNT(pu.purchase_id) AS order_count,
    ROUND(SUM(pu.total_amount), 2) AS total_spend,
    ROUND(AVG(pu.total_amount), 2) AS avg_order_amount
FROM purchases pu
WHERE pu.purchase_date >= '2026-01-01'
  AND pu.purchase_date < '2027-01-01'
GROUP BY DATE_FORMAT(pu.purchase_date, '%Y-%m'), pu.status
ORDER BY purchase_month DESC, pu.status ASC;


-- ============================================================
-- 3. Variant Restock Volume & Unit Cost Analysis
-- ============================================================
SELECT
    p.product_code,
    p.product_name,
    pv.sku,
    sz.size_name,
    cl.colour_name,
    SUM(pi.quantity) AS total_units_purchased,
    ROUND(AVG(pi.unit_cost), 2) AS avg_unit_cost,
    ROUND(MIN(pi.unit_cost), 2) AS min_unit_cost,
    ROUND(MAX(pi.unit_cost), 2) AS max_unit_cost,
    ROUND(SUM(pi.subtotal), 2) AS total_procurement_cost
FROM purchase_items pi
INNER JOIN purchases pu
    ON pu.purchase_id = pi.purchase_id
INNER JOIN product_variants pv
    ON pv.variant_id = pi.variant_id
INNER JOIN products p
    ON p.product_id = pv.product_id
INNER JOIN sizes sz
    ON sz.size_id = pv.size_id
INNER JOIN colours cl
    ON cl.colour_id = pv.colour_id
WHERE pu.status = 'RECEIVED'
GROUP BY
    p.product_code,
    p.product_name,
    pv.sku,
    sz.size_name,
    cl.colour_name
ORDER BY total_procurement_cost DESC;
