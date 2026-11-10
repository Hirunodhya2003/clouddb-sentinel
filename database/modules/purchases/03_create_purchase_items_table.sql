-- CloudDB Sentinel
-- Module: Purchase Management
-- Table: purchase_items

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS purchase_items (
    purchase_item_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    CONSTRAINT fk_purchase_items_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(purchase_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(variant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_purchase_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_purchase_item_cost
        CHECK (unit_cost >= 0),

    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_variant (variant_id)
) ENGINE=InnoDB;
