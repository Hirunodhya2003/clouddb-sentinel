-- CloudDB Sentinel
-- Owner: Member 08
-- Module: Stock Movements, Adjustments, Returns & Audit Reports
-- Task: Read-Only Stock & Operational Audit Report Queries
-- Database: MySQL 8.0+
--
-- ============================================================================
--DEPENDENCY NOTE ON MEMBER 10 (audit_logs)
-- ============================================================================
-- Member 10 owns `database/modules/auditing/01_create_audit_logs_table.sql`
-- and the database-level audit triggers (`01..03_audit_*_triggers.sql`).
-- Because `01_create_audit_logs_table.sql` is not yet implemented in the
-- repository, this file does NOT invent a fake `audit_logs` schema or claim
-- that stock-derived queries are raw `audit_logs` entries.
--
-- Instead, the read-only queries below provide genuine, schema-verified
-- stock audit reports across Member 08's operational audit tables:
--   - stock_movements (immutable append-only stock movement ledger)
--   - stock_adjustments & stock_adjustment_items (reconciliation history)
--   - sales_returns & sales_return_items (customer return history)
-- joined with product_variants, products, categories, sizes, colours, sales,
-- sale_items, and users.
-- ============================================================================

USE clouddb_sentinel;


-- ============================================================================
-- QUERY 1: Chronological Stock Movement Ledger Audit Report
-- Supports: GET /api/v1/audit-reports/stock (Stock Ledger section)
-- ============================================================================
SELECT
    sm.movement_id,
    sm.variant_id,
    pv.sku,
    p.product_name,
    c.category_name,
    sz.size_name,
    col.colour_name,
    sm.movement_type,
    CASE
        WHEN sm.movement_type IN ('PURCHASE', 'CUSTOMER_RETURN', 'ADJUSTMENT_IN')
            THEN 'INBOUND'
        ELSE 'OUTBOUND'
    END AS movement_direction,
    sm.quantity,
    sm.reference_type,
    sm.reference_id,
    sm.movement_date,
    sm.notes
FROM stock_movements sm
LEFT JOIN product_variants pv
    ON sm.variant_id = pv.variant_id
LEFT JOIN products p
    ON pv.product_id = p.product_id
LEFT JOIN categories c
    ON p.category_id = c.category_id
LEFT JOIN sizes sz
    ON pv.size_id = sz.size_id
LEFT JOIN colours col
    ON pv.colour_id = col.colour_id
ORDER BY sm.movement_date DESC, sm.movement_id DESC;


-- ============================================================================
-- QUERY 2: Stock Adjustments & Line-Item Variance Audit Report
-- Supports: GET /api/v1/audit-reports/stock (Adjustments section)
-- ============================================================================
SELECT
    sa.adjustment_id,
    sa.adjustment_reference,
    sa.adjustment_date,
    sa.adjustment_type,
    sa.status AS adjustment_status,
    sa.reason AS adjustment_reason,
    sa.created_by,
    u_created.username AS created_by_username,
    sa.approved_by,
    u_approved.username AS approved_by_username,
    sai.adjustment_item_id,
    sai.variant_id,
    pv.sku,
    p.product_name,
    sai.quantity_before,
    sai.quantity_after,
    sai.quantity_difference,
    sai.item_reason,
    sa.created_at,
    sa.updated_at
FROM stock_adjustments sa
LEFT JOIN stock_adjustment_items sai
    ON sa.adjustment_id = sai.adjustment_id
LEFT JOIN product_variants pv
    ON sai.variant_id = pv.variant_id
LEFT JOIN products p
    ON pv.product_id = p.product_id
LEFT JOIN users u_created
    ON sa.created_by = u_created.user_id
LEFT JOIN users u_approved
    ON sa.approved_by = u_approved.user_id
ORDER BY sa.adjustment_date DESC, sa.adjustment_id DESC;


-- ============================================================================
-- QUERY 3: Sales Returns & Refund Audit Report
-- Supports: GET /api/v1/audit-reports/stock (Returns section)
-- ============================================================================
SELECT
    sr.return_id,
    sr.sale_id,
    s.invoice_number,
    sr.return_date,
    sr.return_reason,
    sr.total_refund_amount,
    sr.return_status,
    sr.notes,
    sri.return_item_id,
    sri.sale_item_id,
    si.variant_id,
    pv.sku,
    p.product_name,
    si.quantity AS quantity_originally_sold,
    sri.quantity AS quantity_returned,
    sri.refund_unit_price,
    sri.refund_subtotal,
    sr.created_at
FROM sales_returns sr
INNER JOIN sales s
    ON sr.sale_id = s.sale_id
LEFT JOIN sales_return_items sri
    ON sr.return_id = sri.return_id
LEFT JOIN sale_items si
    ON sri.sale_item_id = si.sale_item_id
LEFT JOIN product_variants pv
    ON si.variant_id = pv.variant_id
LEFT JOIN products p
    ON pv.product_id = p.product_id
ORDER BY sr.return_date DESC, sr.return_id DESC;


-- ============================================================================
-- QUERY 4: Variant-Level Net Stock Movement Audit Summary
-- Aggregates inbound additions, outbound reductions, and net movement per SKU.
-- ============================================================================
SELECT
    pv.variant_id,
    pv.sku,
    p.product_name,
    COUNT(sm.movement_id) AS total_movement_events,
    COALESCE(SUM(
        CASE
            WHEN sm.movement_type IN ('PURCHASE', 'CUSTOMER_RETURN', 'ADJUSTMENT_IN')
                THEN sm.quantity
            ELSE 0
        END
    ), 0) AS total_inbound_units,
    COALESCE(SUM(
        CASE
            WHEN sm.movement_type IN ('SALE', 'SUPPLIER_RETURN', 'ADJUSTMENT_OUT', 'DAMAGE')
                THEN sm.quantity
            ELSE 0
        END
    ), 0) AS total_outbound_units,
    MAX(sm.movement_date) AS last_movement_timestamp
FROM product_variants pv
INNER JOIN products p
    ON pv.product_id = p.product_id
LEFT JOIN stock_movements sm
    ON pv.variant_id = sm.variant_id
GROUP BY pv.variant_id, pv.sku, p.product_name
ORDER BY total_movement_events DESC, pv.variant_id ASC;
