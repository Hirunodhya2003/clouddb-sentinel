-- CloudDB Sentinel
-- Owner: Member 08
-- Module: Stock Movement Management
-- Task: Trigger Testing Suite (Stock Movements Immutability Triggers)
-- Database: MySQL 8.0+
--
-- ============================================================================
-- PURPOSE
-- ============================================================================
-- Verifies the behavior of the Member 08 stock_movements immutability triggers:
--   1. trg_before_stock_movement_update_block (02_before_stock_movement_update_block.sql)
--   2. trg_before_stock_movement_delete_block (03_before_stock_movement_delete_block.sql)
--
-- Note: The inventory direct-update guard trigger (01_before_inventory_update_guard.sql)
-- is excluded from this script pending coordination with Member 05 (sp_update_inventory).
--
-- ============================================================================
-- PREREQUISITE SETUP (Disposable Local MySQL 8.0 Database)
-- ============================================================================
-- Before running this test script on an isolated disposable MySQL 8.0 instance,
-- ensure the database, prerequisite tables, constraints, and triggers are loaded
-- in the following foreign-key dependency order:
--
--   mysql -u root -p < database/schema/01_create_database.sql
--   mysql -u root -p < database/modules/products/01_create_categories_table.sql
--   mysql -u root -p < database/modules/products/02_create_products_table.sql
--   mysql -u root -p < database/modules/products/03_product_constraints.sql
--   mysql -u root -p < database/modules/variants/01_create_sizes_table.sql
--   mysql -u root -p < database/modules/variants/02_create_colors_table.sql
--   mysql -u root -p < database/modules/variants/03_create_product_variants_table.sql
--   mysql -u root -p < database/modules/variants/04_variant_constraints.sql
--   mysql -u root -p < database/modules/stock_movements/01_create_stock_movements_table.sql
--   mysql -u root -p < database/adbms/triggers/02_before_stock_movement_update_block.sql
--   mysql -u root -p < database/adbms/triggers/03_before_stock_movement_delete_block.sql
--
-- ============================================================================
-- EXECUTION
-- ============================================================================
--   mysql -u root -p < database/testing/test_triggers.sql
--
-- This script is repeatable: it looks up or inserts prerequisite records by
-- unique natural keys and captures generated primary keys dynamically via
-- LAST_INSERT_ID() without assuming fixed IDs.
--
-- ============================================================================
-- CLEANUP (Disposable Database)
-- ============================================================================
-- Because stock_movements is an immutable append-only ledger protected by
-- trg_before_stock_movement_delete_block, inserted test rows in stock_movements
-- cannot be deleted while the trigger is active.
--   - On a disposable database/container: drop or recreate clouddb_sentinel.
--   - To clean test rows manually on a local test instance:
--       DROP TRIGGER IF EXISTS trg_before_stock_movement_delete_block;
--       DELETE FROM stock_movements WHERE reference_type = 'TEST_TRIGGER_SUITE_M08';
--       DELETE FROM product_variants WHERE sku = 'SKU-TEST-TRG-M08';
--       DELETE FROM products WHERE product_name = 'TEST_TRG_PRODUCT_M08';
--       DELETE FROM categories WHERE category_name = 'TEST_TRG_CATEGORY_M08';
--       DELETE FROM sizes WHERE size_name = 'TEST_M08';
--       DELETE FROM colours WHERE colour_name = 'TEST_COLOUR_M08';
--     Then re-apply database/adbms/triggers/03_before_stock_movement_delete_block.sql.
-- ============================================================================

USE clouddb_sentinel;

DROP PROCEDURE IF EXISTS sp_run_stock_movement_trigger_tests;

DELIMITER $$

CREATE PROCEDURE sp_run_stock_movement_trigger_tests()
BEGIN
    DECLARE v_update_trigger_count INT DEFAULT 0;
    DECLARE v_delete_trigger_count INT DEFAULT 0;

    DECLARE v_category_id INT DEFAULT NULL;
    DECLARE v_product_id INT DEFAULT NULL;
    DECLARE v_size_id INT DEFAULT NULL;
    DECLARE v_colour_id INT DEFAULT NULL;
    DECLARE v_variant_id INT DEFAULT NULL;

    DECLARE v_movement_id_1 BIGINT DEFAULT NULL;
    DECLARE v_movement_id_2 BIGINT DEFAULT NULL;

    DECLARE v_caught_45000 BOOLEAN DEFAULT FALSE;
    DECLARE v_sqlstate CHAR(5) DEFAULT '00000';
    DECLARE v_errno INT DEFAULT 0;
    DECLARE v_message TEXT DEFAULT '';

    DECLARE v_actual_count INT DEFAULT 0;
    DECLARE v_actual_variant_id INT DEFAULT NULL;
    DECLARE v_actual_type VARCHAR(50) DEFAULT NULL;
    DECLARE v_actual_qty INT DEFAULT NULL;
    DECLARE v_actual_ref_type VARCHAR(50) DEFAULT NULL;
    DECLARE v_actual_ref_id BIGINT DEFAULT NULL;
    DECLARE v_actual_notes TEXT DEFAULT NULL;

    -- Temporary table to collect structured test results for output
    DROP TEMPORARY TABLE IF EXISTS tmp_trigger_test_results;
    CREATE TEMPORARY TABLE tmp_trigger_test_results (
        test_number INT PRIMARY KEY,
        test_case VARCHAR(120) NOT NULL,
        expected_sqlstate CHAR(5) NOT NULL,
        actual_sqlstate CHAR(5) NOT NULL,
        actual_errno INT NOT NULL,
        state_preserved VARCHAR(10) NOT NULL,
        result VARCHAR(10) NOT NULL,
        diagnostic_message VARCHAR(255) NOT NULL
    );

    -- ------------------------------------------------------------------------
    -- PRE-CHECK: Verify both triggers exist on stock_movements
    -- ------------------------------------------------------------------------
    SELECT COUNT(*)
    INTO v_update_trigger_count
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
      AND EVENT_OBJECT_TABLE = 'stock_movements'
      AND TRIGGER_NAME = 'trg_before_stock_movement_update_block'
      AND ACTION_TIMING = 'BEFORE'
      AND EVENT_MANIPULATION = 'UPDATE';

    IF v_update_trigger_count <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'PRE-CHECK FAILED: Trigger trg_before_stock_movement_update_block is not installed on stock_movements.';
    END IF;

    SELECT COUNT(*)
    INTO v_delete_trigger_count
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
      AND EVENT_OBJECT_TABLE = 'stock_movements'
      AND TRIGGER_NAME = 'trg_before_stock_movement_delete_block'
      AND ACTION_TIMING = 'BEFORE'
      AND EVENT_MANIPULATION = 'DELETE';

    IF v_delete_trigger_count <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'PRE-CHECK FAILED: Trigger trg_before_stock_movement_delete_block is not installed on stock_movements.';
    END IF;

    -- ------------------------------------------------------------------------
    -- FIXTURE SETUP: Idempotently ensure valid prerequisite FK records exist
    -- without assuming fixed primary key IDs.
    -- ------------------------------------------------------------------------

    -- 1. Category (satisfies uq_categories_name and chk_category_name_not_empty)
    INSERT INTO categories (category_name, description, is_active)
    VALUES ('TEST_TRG_CATEGORY_M08', 'Disposable category for Member 08 trigger tests', TRUE)
    ON DUPLICATE KEY UPDATE category_id = LAST_INSERT_ID(category_id);
    SET v_category_id = LAST_INSERT_ID();

    -- 2. Product (satisfies fk_products_category and chk_product_name_not_empty)
    SELECT product_id
    INTO v_product_id
    FROM products
    WHERE category_id = v_category_id
      AND product_name = 'TEST_TRG_PRODUCT_M08'
    LIMIT 1;

    IF v_product_id IS NULL THEN
        INSERT INTO products (category_id, product_name, description, brand, is_active)
        VALUES (
            v_category_id,
            'TEST_TRG_PRODUCT_M08',
            'Disposable product for Member 08 trigger tests',
            'CloudDB Sentinel Test',
            TRUE
        );
        SET v_product_id = LAST_INSERT_ID();
    END IF;

    -- 3. Size (satisfies uq_sizes_name and chk_size_name_not_empty)
    INSERT INTO sizes (size_name, description, is_active)
    VALUES ('TEST_M08', 'Disposable size for Member 08 trigger tests', TRUE)
    ON DUPLICATE KEY UPDATE size_id = LAST_INSERT_ID(size_id);
    SET v_size_id = LAST_INSERT_ID();

    -- 4. Colour (satisfies uq_colours_name, chk_colour_name_not_empty, chk_colour_code_format)
    INSERT INTO colours (colour_name, colour_code, is_active)
    VALUES ('TEST_COLOUR_M08', '#080808', TRUE)
    ON DUPLICATE KEY UPDATE colour_id = LAST_INSERT_ID(colour_id);
    SET v_colour_id = LAST_INSERT_ID();

    -- 5. Product Variant (satisfies FKs, uq_variants_sku, chk_variant_sku_not_empty, price >= 0)
    SELECT variant_id
    INTO v_variant_id
    FROM product_variants
    WHERE sku = 'SKU-TEST-TRG-M08'
    LIMIT 1;

    IF v_variant_id IS NULL THEN
        SELECT variant_id
        INTO v_variant_id
        FROM product_variants
        WHERE product_id = v_product_id
          AND size_id = v_size_id
          AND colour_id = v_colour_id
        LIMIT 1;
    END IF;

    IF v_variant_id IS NULL THEN
        INSERT INTO product_variants (
            product_id,
            size_id,
            colour_id,
            sku,
            cost_price,
            selling_price,
            is_active
        )
        VALUES (
            v_product_id,
            v_size_id,
            v_colour_id,
            'SKU-TEST-TRG-M08',
            1000.00,
            1500.00,
            TRUE
        );
        SET v_variant_id = LAST_INSERT_ID();
    END IF;

    -- ------------------------------------------------------------------------
    -- TEST CASE 1: Verify INSERT into stock_movements is allowed
    -- ------------------------------------------------------------------------
    INSERT INTO stock_movements (
        variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes
    )
    VALUES (
        v_variant_id,
        'ADJUSTMENT_IN',
        25,
        'TEST_TRIGGER_SUITE_M08',
        1001,
        'Initial immutable stock movement test record'
    );

    SET v_movement_id_1 = LAST_INSERT_ID();

    SELECT
        COUNT(*),
        MAX(variant_id),
        MAX(movement_type),
        MAX(quantity),
        MAX(reference_type),
        MAX(reference_id),
        MAX(notes)
    INTO
        v_actual_count,
        v_actual_variant_id,
        v_actual_type,
        v_actual_qty,
        v_actual_ref_type,
        v_actual_ref_id,
        v_actual_notes
    FROM stock_movements
    WHERE movement_id = v_movement_id_1;

    IF v_movement_id_1 IS NULL OR v_movement_id_1 <= 0 OR v_actual_count <> 1
       OR v_actual_variant_id <> v_variant_id
       OR v_actual_type <> 'ADJUSTMENT_IN'
       OR v_actual_qty <> 25
       OR v_actual_ref_type <> 'TEST_TRIGGER_SUITE_M08'
       OR v_actual_ref_id <> 1001
       OR v_actual_notes <> 'Initial immutable stock movement test record' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 1 FAILED: Valid INSERT into stock_movements did not persist expected values.';
    END IF;

    INSERT INTO tmp_trigger_test_results VALUES (
        1,
        'TC01: Allow valid INSERT into stock_movements',
        '00000',
        '00000',
        0,
        'YES',
        'PASS',
        CONCAT('Inserted movement_id=', v_movement_id_1, ' with quantity=25, type=ADJUSTMENT_IN')
    );

    -- ------------------------------------------------------------------------
    -- TEST CASE 2: Verify UPDATE of quantity on stock_movements is blocked
    --              with SQLSTATE 45000 and original record is unchanged
    -- ------------------------------------------------------------------------
    SET v_caught_45000 = FALSE;
    SET v_sqlstate = '00000';
    SET v_errno = 0;
    SET v_message = '';

    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'
        BEGIN
            SET v_caught_45000 = TRUE;
            GET STACKED DIAGNOSTICS CONDITION 1
                v_sqlstate = RETURNED_SQLSTATE,
                v_errno = MYSQL_ERRNO,
                v_message = MESSAGE_TEXT;
        END;

        UPDATE stock_movements
        SET quantity = 99
        WHERE movement_id = v_movement_id_1;
    END;

    IF NOT v_caught_45000 OR v_sqlstate <> '45000' OR v_errno <> 1644 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 2 FAILED: UPDATE on stock_movements.quantity was not blocked with SQLSTATE 45000.';
    END IF;

    IF v_message <> 'Stock movement records are immutable and cannot be updated. Record a new movement instead.' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 2 FAILED: Unexpected error message returned by trg_before_stock_movement_update_block.';
    END IF;

    -- Confirm the original record was not modified
    SELECT
        COUNT(*),
        MAX(variant_id),
        MAX(movement_type),
        MAX(quantity),
        MAX(reference_type),
        MAX(reference_id),
        MAX(notes)
    INTO
        v_actual_count,
        v_actual_variant_id,
        v_actual_type,
        v_actual_qty,
        v_actual_ref_type,
        v_actual_ref_id,
        v_actual_notes
    FROM stock_movements
    WHERE movement_id = v_movement_id_1;

    IF v_actual_count <> 1
       OR v_actual_variant_id <> v_variant_id
       OR v_actual_type <> 'ADJUSTMENT_IN'
       OR v_actual_qty <> 25
       OR v_actual_ref_type <> 'TEST_TRIGGER_SUITE_M08'
       OR v_actual_ref_id <> 1001
       OR v_actual_notes <> 'Initial immutable stock movement test record' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 2 FAILED: Original stock_movements record was modified despite trigger error.';
    END IF;

    INSERT INTO tmp_trigger_test_results VALUES (
        2,
        'TC02: Block UPDATE on stock_movements (quantity)',
        '45000',
        v_sqlstate,
        v_errno,
        'YES',
        'PASS',
        LEFT(v_message, 255)
    );

    -- ------------------------------------------------------------------------
    -- TEST CASE 3: Verify UPDATE of metadata columns (movement_type, notes)
    --              on stock_movements is blocked with SQLSTATE 45000
    -- ------------------------------------------------------------------------
    SET v_caught_45000 = FALSE;
    SET v_sqlstate = '00000';
    SET v_errno = 0;
    SET v_message = '';

    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'
        BEGIN
            SET v_caught_45000 = TRUE;
            GET STACKED DIAGNOSTICS CONDITION 1
                v_sqlstate = RETURNED_SQLSTATE,
                v_errno = MYSQL_ERRNO,
                v_message = MESSAGE_TEXT;
        END;

        UPDATE stock_movements
        SET movement_type = 'DAMAGE',
            notes = 'Attempted metadata tampering'
        WHERE movement_id = v_movement_id_1;
    END;

    IF NOT v_caught_45000 OR v_sqlstate <> '45000' OR v_errno <> 1644 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 3 FAILED: UPDATE on stock_movements metadata was not blocked with SQLSTATE 45000.';
    END IF;

    -- Confirm the original record was not modified
    SELECT
        COUNT(*),
        MAX(movement_type),
        MAX(quantity),
        MAX(notes)
    INTO
        v_actual_count,
        v_actual_type,
        v_actual_qty,
        v_actual_notes
    FROM stock_movements
    WHERE movement_id = v_movement_id_1;

    IF v_actual_count <> 1
       OR v_actual_type <> 'ADJUSTMENT_IN'
       OR v_actual_qty <> 25
       OR v_actual_notes <> 'Initial immutable stock movement test record' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 3 FAILED: Original stock_movements metadata was modified despite trigger error.';
    END IF;

    INSERT INTO tmp_trigger_test_results VALUES (
        3,
        'TC03: Block UPDATE on stock_movements (movement_type, notes)',
        '45000',
        v_sqlstate,
        v_errno,
        'YES',
        'PASS',
        LEFT(v_message, 255)
    );

    -- ------------------------------------------------------------------------
    -- TEST CASE 4: Verify DELETE on stock_movements is blocked with
    --              SQLSTATE 45000 and original record still exists unchanged
    -- ------------------------------------------------------------------------
    SET v_caught_45000 = FALSE;
    SET v_sqlstate = '00000';
    SET v_errno = 0;
    SET v_message = '';

    BEGIN
        DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'
        BEGIN
            SET v_caught_45000 = TRUE;
            GET STACKED DIAGNOSTICS CONDITION 1
                v_sqlstate = RETURNED_SQLSTATE,
                v_errno = MYSQL_ERRNO,
                v_message = MESSAGE_TEXT;
        END;

        DELETE FROM stock_movements
        WHERE movement_id = v_movement_id_1;
    END;

    IF NOT v_caught_45000 OR v_sqlstate <> '45000' OR v_errno <> 1644 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 4 FAILED: DELETE on stock_movements was not blocked with SQLSTATE 45000.';
    END IF;

    IF v_message <> 'Stock movement records are immutable and cannot be deleted. Record a reversing movement instead.' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 4 FAILED: Unexpected error message returned by trg_before_stock_movement_delete_block.';
    END IF;

    -- Confirm the original record was not deleted or altered
    SELECT
        COUNT(*),
        MAX(variant_id),
        MAX(movement_type),
        MAX(quantity),
        MAX(reference_type),
        MAX(reference_id),
        MAX(notes)
    INTO
        v_actual_count,
        v_actual_variant_id,
        v_actual_type,
        v_actual_qty,
        v_actual_ref_type,
        v_actual_ref_id,
        v_actual_notes
    FROM stock_movements
    WHERE movement_id = v_movement_id_1;

    IF v_actual_count <> 1
       OR v_actual_variant_id <> v_variant_id
       OR v_actual_type <> 'ADJUSTMENT_IN'
       OR v_actual_qty <> 25
       OR v_actual_ref_type <> 'TEST_TRIGGER_SUITE_M08'
       OR v_actual_ref_id <> 1001
       OR v_actual_notes <> 'Initial immutable stock movement test record' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 4 FAILED: Original stock_movements record was deleted or altered.';
    END IF;

    INSERT INTO tmp_trigger_test_results VALUES (
        4,
        'TC04: Block DELETE on stock_movements',
        '45000',
        v_sqlstate,
        v_errno,
        'YES',
        'PASS',
        LEFT(v_message, 255)
    );

    -- ------------------------------------------------------------------------
    -- TEST CASE 5: Verify subsequent compensating INSERT into stock_movements
    --              is allowed after rejected UPDATE and DELETE attempts
    -- ------------------------------------------------------------------------
    INSERT INTO stock_movements (
        variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes
    )
    VALUES (
        v_variant_id,
        'ADJUSTMENT_OUT',
        5,
        'TEST_TRIGGER_SUITE_M08',
        1002,
        'Compensating reversing stock movement test record'
    );

    SET v_movement_id_2 = LAST_INSERT_ID();

    SELECT COUNT(*)
    INTO v_actual_count
    FROM stock_movements
    WHERE movement_id IN (v_movement_id_1, v_movement_id_2);

    IF v_movement_id_2 IS NULL OR v_movement_id_2 <= v_movement_id_1 OR v_actual_count <> 2 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'TEST CASE 5 FAILED: Subsequent compensating INSERT into stock_movements failed.';
    END IF;

    INSERT INTO tmp_trigger_test_results VALUES (
        5,
        'TC05: Allow subsequent compensating INSERT after blocked mutations',
        '00000',
        '00000',
        0,
        'YES',
        'PASS',
        CONCAT('Inserted compensating movement_id=', v_movement_id_2, ' with quantity=5, type=ADJUSTMENT_OUT')
    );

    -- ------------------------------------------------------------------------
    -- OUTPUT TEST SUMMARY & VERIFIED RECORDS
    -- ------------------------------------------------------------------------
    SELECT
        test_number,
        test_case,
        expected_sqlstate,
        actual_sqlstate,
        actual_errno,
        state_preserved,
        result,
        diagnostic_message
    FROM tmp_trigger_test_results
    ORDER BY test_number;

    SELECT
        movement_id,
        variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes
    FROM stock_movements
    WHERE movement_id IN (v_movement_id_1, v_movement_id_2)
    ORDER BY movement_id;

    DROP TEMPORARY TABLE IF EXISTS tmp_trigger_test_results;
END$$

DELIMITER ;

CALL sp_run_stock_movement_trigger_tests();

DROP PROCEDURE IF EXISTS sp_run_stock_movement_trigger_tests;
