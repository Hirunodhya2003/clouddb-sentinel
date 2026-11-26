-- Owner: Member 03
-- Function: Check Variant Availability
-- Description: Checks whether a product variant exists and is active.

USE clouddb_sentinel;

DELIMITER //

CREATE FUNCTION fn_check_variant_availability(
    p_variant_id INT
)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE v_available BOOLEAN DEFAULT FALSE;

    SELECT EXISTS (
        SELECT 1
        FROM product_variants
        WHERE variant_id = p_variant_id
          AND is_active = TRUE
    )
    INTO v_available;

    RETURN v_available;
END //

DELIMITER ;