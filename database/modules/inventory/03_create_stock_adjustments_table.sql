-- CloudDB Sentinel
-- Module: Inventory Management
-- Table: stock_adjustments

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_reference VARCHAR(50) NOT NULL,
    adjustment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adjustment_type ENUM(
        'PHYSICAL_COUNT',
        'DAMAGE',
        'LOSS',
        'CORRECTION',
        'OTHER'
    ) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING',
    created_by INT,
    approved_by INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_adjustment_reference
        UNIQUE (adjustment_reference),

    CONSTRAINT chk_adjustment_reference_not_empty
        CHECK (CHAR_LENGTH(TRIM(adjustment_reference)) > 0),

    CONSTRAINT chk_adjustment_reason_not_empty
        CHECK (CHAR_LENGTH(TRIM(reason)) > 0),

    CONSTRAINT fk_adjustment_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_adjustment_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_adjustment_date (adjustment_date),
    INDEX idx_adjustment_status (status),
    INDEX idx_adjustment_type (adjustment_type)
) ENGINE=InnoDB;
