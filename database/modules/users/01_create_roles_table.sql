-- CloudDB Sentinel
-- Module: User Management
-- Table: roles

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_roles_name UNIQUE (role_name),

    CONSTRAINT chk_role_name_not_empty
        CHECK (CHAR_LENGTH(TRIM(role_name)) > 0)
) ENGINE=InnoDB;
