-- CloudDB Sentinel
-- Module: Sales Management
-- Table: sale_items

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_sale_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(variant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_sale_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_sale_item_price
        CHECK (unit_price >= 0),

    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_variant (variant_id)
) ENGINE=InnoDB;
