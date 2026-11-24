-- CloudDB Sentinel
-- Module: Sales Returns Management
-- Table: sales_returns

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS sales_returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    return_reason VARCHAR(255) NOT NULL,
    total_refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    return_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_returns_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_return_refund_amount
        CHECK (total_refund_amount >= 0),

    CONSTRAINT chk_return_reason_not_empty
        CHECK (CHAR_LENGTH(TRIM(return_reason)) > 0),

    INDEX idx_sales_returns_sale (sale_id),
    INDEX idx_sales_returns_date (return_date),
    INDEX idx_sales_returns_status (return_status)
) ENGINE=InnoDB;
