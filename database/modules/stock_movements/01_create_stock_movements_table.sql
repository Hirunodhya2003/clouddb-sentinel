-- CloudDB Sentinel
-- Module: Stock Movement Management
-- Table: stock_movements

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    movement_type ENUM(
        'PURCHASE',
        'SALE',
        'CUSTOMER_RETURN',
        'SUPPLIER_RETURN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'DAMAGE'
    ) NOT NULL,
    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    CONSTRAINT fk_stock_movements_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(variant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_stock_movement_quantity
        CHECK (quantity > 0),

    INDEX idx_stock_movements_variant (variant_id),
    INDEX idx_stock_movements_type (movement_type),
    INDEX idx_stock_movements_date (movement_date),
    INDEX idx_stock_movements_reference (reference_type, reference_id)
) ENGINE=InnoDB;
