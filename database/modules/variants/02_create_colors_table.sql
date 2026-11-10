-- CloudDB Sentinel
-- Module: Product Variant Management
-- Table: colours

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS colours (
    colour_id INT AUTO_INCREMENT PRIMARY KEY,
    colour_name VARCHAR(50) NOT NULL,
    colour_code VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_colours_name UNIQUE (colour_name),
    CONSTRAINT chk_colour_name_not_empty
        CHECK (CHAR_LENGTH(TRIM(colour_name)) > 0),
    CONSTRAINT chk_colour_code_format
        CHECK (
            colour_code IS NULL
            OR colour_code REGEXP '^#[0-9A-Fa-f]{6}$'
        )
) ENGINE=InnoDB;
