-- CloudDB Sentinel
-- Owner: Member 08
-- Module: Stock Movement Management
-- Trigger: trg_before_stock_movement_delete_block
-- Purpose: Prevent deletion of existing stock_movements records (immutable ledger)
-- Database: MySQL 8.0+

USE clouddb_sentinel;

DROP TRIGGER IF EXISTS trg_before_stock_movement_delete_block;

DELIMITER $$

CREATE TRIGGER trg_before_stock_movement_delete_block
BEFORE DELETE ON stock_movements
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock movement records are immutable and cannot be deleted. Record a reversing movement instead.';
END$$

DELIMITER ;
