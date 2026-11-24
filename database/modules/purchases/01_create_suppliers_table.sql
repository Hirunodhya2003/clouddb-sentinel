-- CloudDB Sentinel
-- Module: Supplier Management
-- Table: suppliers

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT uq_suppliers_email UNIQUE (email),

CONSTRAINT chk_supplier_name_not_empty
    CHECK (CHAR_LENGTH(TRIM(supplier_name)) > 0),

INDEX idx_suppliers_name (supplier_name)

) ENGINE=InnoDB;
