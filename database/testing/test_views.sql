
-- Owner: Member 03
-- Tests: Product Views and Variant Availability Function
-- Description: Validates the existence and basic functionality of views and function.

USE clouddb_sentinel;

DELIMITER //

CREATE PROCEDURE test_member03_views_and_function()
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_available BOOLEAN DEFAULT FALSE;

    -- Test 1: Check product_view exists
    SELECT COUNT(*)
    INTO v_count
    FROM information_schema.VIEWS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_view';

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Test failed: product_view does not exist';
    END IF;

    -- Test 2: Check variant_details_view exists
    SELECT COUNT(*)
    INTO v_count
    FROM information_schema.VIEWS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'variant_details_view';

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Test failed: variant_details_view does not exist';
    END IF;

    -- Test 3: Check availability function exists
    SELECT COUNT(*)
    INTO v_count
    FROM information_schema.ROUTINES
    WHERE ROUTINE_SCHEMA = DATABASE()
      AND ROUTINE_NAME = 'fn_check_variant_availability'
      AND ROUTINE_TYPE = 'FUNCTION';

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Test failed: availability function does not exist';
    END IF;

    -- Test 4: Check invalid variant ID returns FALSE
    SELECT fn_check_variant_availability(-2147483648)
    INTO v_available;

    IF v_available = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Test failed: invalid variant should return FALSE';
    END IF;

    SELECT 'All Member 03 view and function tests passed!' AS test_result;
END //

DELIMITER ;

CALL test_member03_views_and_function();

DROP PROCEDURE test_member03_views_and_function;
