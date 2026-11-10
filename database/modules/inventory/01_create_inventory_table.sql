-- CloudDB Sentinel
-- Module: Inventory Management
-- Table: inventory

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    last_stock_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(variant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_inventory_variant UNIQUE (variant_id),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity_on_hand >= 0),

    CONSTRAINT chk_inventory_reorder_level
        CHECK (reorder_level >= 0),

    INDEX idx_inventory_quantity (quantity_on_hand)
) ENGINE=InnoDB;
