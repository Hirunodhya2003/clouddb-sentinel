
-- CloudDB Sentinel
-- Owner: Member 08
-- Record a PENDING stock adjustment with its items.
-- Inventory balances are NOT modified here.
-- Completion depends on Member 05's sp_update_inventory.

USE clouddb_sentinel;

DROP PROCEDURE IF EXISTS sp_record_stock_adjustment;

DELIMITER $$

CREATE PROCEDURE sp_record_stock_adjustment(
    IN p_reference VARCHAR(50),
    IN p_type VARCHAR(30),
    IN p_reason TEXT,
    IN p_created_by INT,
    IN p_items JSON,
    OUT p_adjustment_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET p_adjustment_id = NULL;

    -- Validate adjustment reference
    IF p_reference IS NULL
       OR CHAR_LENGTH(TRIM(p_reference)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Adjustment reference is required.';
    END IF;

    -- Validate adjustment type
    IF p_type IS NULL OR p_type NOT IN (
        'PHYSICAL_COUNT',
        'DAMAGE',
        'LOSS',
        'CORRECTION',
        'OTHER'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid adjustment type.';
    END IF;

    -- Validate reason
    IF p_reason IS NULL
       OR CHAR_LENGTH(TRIM(p_reason)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Adjustment reason is required.';
    END IF;

    -- Require a non-empty JSON array of items
    IF p_items IS NULL
       OR JSON_TYPE(p_items) <> 'ARRAY'
       OR JSON_LENGTH(p_items) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'At least one adjustment item is required.';
    END IF;

    START TRANSACTION;

    INSERT INTO stock_adjustments (
        adjustment_reference,
        adjustment_type,
        reason,
        status,
        created_by
    )
    VALUES (
        p_reference,
        p_type,
        p_reason,
        'PENDING',
        p_created_by
    );

    SET p_adjustment_id = LAST_INSERT_ID();

    INSERT INTO stock_adjustment_items (
        adjustment_id,
        variant_id,
        quantity_before,
        quantity_after,
        item_reason
    )
    SELECT
        p_adjustment_id,
        jt.variant_id,
        jt.quantity_before,
        jt.quantity_after,
        jt.item_reason
    FROM JSON_TABLE(
        p_items,
        '$[*]' COLUMNS (
            variant_id INT PATH '$.variant_id' ERROR ON EMPTY,
            quantity_before INT PATH '$.quantity_before' ERROR ON EMPTY,
            quantity_after INT PATH '$.quantity_after' ERROR ON EMPTY,
            item_reason VARCHAR(255) PATH '$.item_reason' NULL ON EMPTY
        )
    ) AS jt;

    COMMIT;
END$$

DELIMITER ;
