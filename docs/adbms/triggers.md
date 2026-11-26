<!-- Owner: Member 08 -->
# Database Triggers & Immutability Enforcement (Member 08)

## 1. Overview

In **CloudDB Sentinel**, the `stock_movements` table acts as an **append-only, immutable operational ledger** that records every stock addition and reduction (`PURCHASE`, `SALE`, `CUSTOMER_RETURN`, `SUPPLIER_RETURN`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `DAMAGE`).

To guarantee audit integrity at the database engine layer (MySQL 8.0 `InnoDB`), Member 08 implements row-level `BEFORE UPDATE` and `BEFORE DELETE` triggers that block any attempt to alter or delete historical stock movement records, even if an application service or administrator executes a raw SQL `UPDATE` or `DELETE` query directly.

---

## 2. Implemented Triggers

### 2.1 `trg_before_stock_movement_update_block`
- **File:** `database/adbms/triggers/02_before_stock_movement_update_block.sql`
- **Target Table:** `stock_movements`
- **Timing & Event:** `BEFORE UPDATE ON stock_movements FOR EACH ROW`
- **Behavior:**
  - Unconditionally aborts any `UPDATE` statement on `stock_movements` by raising a user-defined SQL exception (`SIGNAL SQLSTATE '45000'`, MySQL error `1644`).
  - **Error Message:**
    `Stock movement records are immutable and cannot be updated. Record a new movement instead.`
  - Ensures that neither `quantity`, `movement_type`, `variant_id`, `reference_type`, `reference_id`, nor `notes` can be tampered with after insertion.

### 2.2 `trg_before_stock_movement_delete_block`
- **File:** `database/adbms/triggers/03_before_stock_movement_delete_block.sql`
- **Target Table:** `stock_movements`
- **Timing & Event:** `BEFORE DELETE ON stock_movements FOR EACH ROW`
- **Behavior:**
  - Unconditionally aborts any `DELETE` statement on `stock_movements` by raising `SIGNAL SQLSTATE '45000'` (MySQL error `1644`).
  - **Error Message:**
    `Stock movement records are immutable and cannot be deleted. Record a reversing movement instead.`
  - Enforces accounting best practices: errors in stock counts must be corrected by recording a new compensating movement (such as `ADJUSTMENT_IN` or `ADJUSTMENT_OUT`) rather than erasing historical records.

---

## 3. Pending Cross-Member Dependency (`01_before_inventory_update_guard.sql`)

Per `README.md` Section 7.3 (*The Inventory Rule*):
- `inventory.quantity_on_hand` is updated **only** by Member 05's stored procedure `sp_update_inventory` (`database/adbms/procedures/sp_update_inventory.sql`).
- Member 08 owns `database/adbms/triggers/01_before_inventory_update_guard.sql` and `database/adbms/procedures/sp_record_stock_adjustment.sql`.
- Because `database/adbms/procedures/sp_update_inventory.sql` (owned by Member 05) is currently an unimplemented stub (`-- TODO: write SQL`), `01_before_inventory_update_guard.sql` and `sp_record_stock_adjustment.sql` remain explicitly pending Member 05's finalized stored procedure signature and session variable contract so we do not invent an unauthorized inventory writer or block Member 05's `reorder_level` updates.

---

## 4. Trigger Verification Suite (`database/testing/test_triggers.sql`)

The repeatable test script `database/testing/test_triggers.sql` validates the implemented triggers against MySQL 8.0 using scoped `DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'` blocks:

1. **Pre-Check:** Queries `information_schema.TRIGGERS` to confirm both `trg_before_stock_movement_update_block` and `trg_before_stock_movement_delete_block` are active on `stock_movements`.
2. **TC01 (`INSERT` Allowed):** Confirms a valid `INSERT INTO stock_movements` succeeds and persists all columns accurately.
3. **TC02 (`UPDATE` Quantity Blocked):** Attempts `UPDATE stock_movements SET quantity = 99 ...`, asserts `SQLSTATE '45000'` (`errno = 1644`) is raised, and verifies the original row's `quantity` remains unchanged (`25`).
4. **TC03 (`UPDATE` Metadata Blocked):** Attempts `UPDATE stock_movements SET movement_type = 'DAMAGE', notes = ...`, asserts `SQLSTATE '45000'` is raised, and verifies `movement_type` and `notes` remain unchanged.
5. **TC04 (`DELETE` Blocked):** Attempts `DELETE FROM stock_movements ...`, asserts `SQLSTATE '45000'` (`errno = 1644`) is raised, and verifies the record still exists intact.
6. **TC05 (Compensating `INSERT` Allowed):** Confirms a subsequent compensating `ADJUSTMENT_OUT` record can still be appended after blocked mutation attempts.
