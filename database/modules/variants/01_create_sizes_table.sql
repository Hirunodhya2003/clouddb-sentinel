-- CloudDB Sentinel
-- Module: Product Variant Management
-- Table: sizes

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS sizes (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    size_name VARCHAR(20) NOT NULL,
    description VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_sizes_name UNIQUE (size_name),
    CONSTRAINT chk_size_name_not_empty
        CHECK (CHAR_LENGTH(TRIM(size_name)) > 0)
) ENGINE=InnoDB;
