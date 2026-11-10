-- CloudDB Sentinel
-- Module: Sales Management
-- Table: payments

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    payment_method ENUM(
        'CASH',
        'CARD',
        'BANK_TRANSFER',
        'OTHER'
    ) NOT NULL,
    payment_status ENUM(
        'PENDING',
        'COMPLETED',
        'FAILED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'COMPLETED',
    amount DECIMAL(12,2) NOT NULL,
    transaction_reference VARCHAR(100),
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    INDEX idx_payments_sale (sale_id),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;
