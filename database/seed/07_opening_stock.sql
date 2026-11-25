-- Owner: Member 06
-- TODO: write SQL

-- Owner: Member 06
-- Demo opening balances: 20, 15 and 10 units.
-- Requires the three demo variants from 05_variants.sql.
-- Run in a dedicated SQL session after previous work is committed.

USE clouddb_sentinel;

DROP PROCEDURE IF EXISTS seed_member06_opening_stock;

DELIMITER $$

CREATE PROCEDURE seed_member06_opening_stock()
BEGIN
    DECLARE variant_count INT DEFAULT 0;
    DECLARE inconsistent_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS member06_opening_stock;
        RESIGNAL;
    END;

    DROP TEMPORARY TABLE IF EXISTS member06_opening_stock;

    CREATE TEMPORARY TABLE member06_opening_stock (
        variant_id INT PRIMARY KEY,
        opening_quantity INT NOT NULL
    ) ENGINE = InnoDB;

    START TRANSACTION;

    -- Lock the demo variants while initializing their inventory.
    SELECT variant_id, sku
    FROM product_variants
    WHERE sku IN (
        'DEMO-TSHIRT-M-BLK',
        'DEMO-SHIRT-L-WHT',
        'DEMO-TROUSER-M-NVY'
    )
    ORDER BY variant_id
    FOR UPDATE;

    SELECT COUNT(*)
    INTO variant_count
    FROM product_variants
    WHERE sku IN (
        'DEMO-TSHIRT-M-BLK',
        'DEMO-SHIRT-L-WHT',
        'DEMO-TROUSER-M-NVY'
    );

    IF variant_count <> 3 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Run category, product and variant seeds first. Three demo SKUs are required.';
    END IF;

    -- Initialize only variants without an inventory balance.
    INSERT INTO member06_opening_stock (
        variant_id,
        opening_quantity
    )
    SELECT
        variant.variant_id,
        CASE variant.sku
            WHEN 'DEMO-TSHIRT-M-BLK' THEN 20
            WHEN 'DEMO-SHIRT-L-WHT' THEN 15
            WHEN 'DEMO-TROUSER-M-NVY' THEN 10
        END
    FROM product_variants AS variant
    WHERE variant.sku IN (
        'DEMO-TSHIRT-M-BLK',
        'DEMO-SHIRT-L-WHT',
        'DEMO-TROUSER-M-NVY'
    )
      AND NOT EXISTS (
          SELECT 1
          FROM inventory AS balance
          WHERE balance.variant_id = variant.variant_id
      );

    -- Existing movement history requires reconciliation.
    SELECT COUNT(*)
    INTO inconsistent_count
    FROM member06_opening_stock AS pending
    WHERE EXISTS (
        SELECT 1
        FROM stock_movements AS movement
        WHERE movement.variant_id = pending.variant_id
    );

    IF inconsistent_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'A demo variant has movements but no inventory balance. Reconcile it before seeding.';
    END IF;

    INSERT INTO inventory (
        variant_id,
        quantity_on_hand,
        reorder_level
    )
    SELECT
        variant_id,
        opening_quantity,
        5
    FROM member06_opening_stock;

    INSERT INTO stock_movements (
        variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes
    )
    SELECT
        variant_id,
        'ADJUSTMENT_IN',
        opening_quantity,
        'DEMO_OPENING_STOCK',
        variant_id,
        'Member 06 demo opening balance'
    FROM member06_opening_stock;

    COMMIT;

    DROP TEMPORARY TABLE member06_opening_stock;
END$$

DELIMITER ;

CALL seed_member06_opening_stock();

DROP PROCEDURE IF EXISTS seed_member06_opening_stock;

SELECT
    variant.sku,
    balance.quantity_on_hand,
    balance.reorder_level
FROM inventory AS balance
JOIN product_variants AS variant
    ON variant.variant_id = balance.variant_id
WHERE variant.sku IN (
    'DEMO-TSHIRT-M-BLK',
    'DEMO-SHIRT-L-WHT',
    'DEMO-TROUSER-M-NVY'
)
ORDER BY variant.sku;