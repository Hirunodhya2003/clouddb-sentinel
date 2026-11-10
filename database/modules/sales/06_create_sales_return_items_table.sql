-- CloudDB Sentinel
-- Module: Sales Returns Management
-- Table: sales_return_items

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS sales_return_items (
    return_item_id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    sale_item_id INT NOT NULL,
    quantity INT NOT NULL,
    refund_unit_price DECIMAL(12,2) NOT NULL,
    refund_subtotal DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * refund_unit_price) STORED,

    CONSTRAINT fk_return_items_return
        FOREIGN KEY (return_id)
        REFERENCES sales_returns(return_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_return_items_sale_item
        FOREIGN KEY (sale_item_id)
        REFERENCES sale_items(sale_item_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_return_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_return_item_refund_price
        CHECK (refund_unit_price >= 0),

    INDEX idx_return_items_return (return_id),
    INDEX idx_return_items_sale_item (sale_item_id)
) ENGINE=InnoDB;
