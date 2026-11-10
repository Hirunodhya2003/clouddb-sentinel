-- CloudDB Sentinel
-- Module: Inventory Management
-- Table: stock_adjustment_items

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS stock_adjustment_items (
    adjustment_item_id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    quantity_difference INT
        GENERATED ALWAYS AS (quantity_after - quantity_before) STORED,
    item_reason VARCHAR(255),

    CONSTRAINT fk_adjustment_items_adjustment
        FOREIGN KEY (adjustment_id)
        REFERENCES stock_adjustments(adjustment_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_adjustment_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(variant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT uq_adjustment_variant
        UNIQUE (adjustment_id, variant_id),

    CONSTRAINT chk_adjustment_quantity_before
        CHECK (quantity_before >= 0),

    CONSTRAINT chk_adjustment_quantity_after
        CHECK (quantity_after >= 0),

    INDEX idx_adjustment_items_variant (variant_id)
) ENGINE=InnoDB;
