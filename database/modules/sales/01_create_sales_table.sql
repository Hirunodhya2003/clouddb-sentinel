-- CloudDB Sentinel
-- Module: Sales Management
-- Table: sales

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    invoice_number VARCHAR(50) NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'COMPLETED', 'CANCELLED')
        NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_sales_invoice UNIQUE (invoice_number),

    CONSTRAINT chk_sales_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_sales_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_sales_total CHECK (total_amount >= 0),

    INDEX idx_sales_customer (customer_id),
    INDEX idx_sales_date (sale_date),
    INDEX idx_sales_status (status)
) ENGINE=InnoDB;
