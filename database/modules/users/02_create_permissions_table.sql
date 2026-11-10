-- CloudDB Sentinel
-- Module: User Management
-- Table: permissions

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_permissions_name UNIQUE (permission_name),

    CONSTRAINT chk_permission_name_not_empty
        CHECK (CHAR_LENGTH(TRIM(permission_name)) > 0)
) ENGINE=InnoDB;
