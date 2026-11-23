-- Owner: Member 02
-- Table: categories
USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS categories (
    category_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    category_name  VARCHAR(100)  NOT NULL,
    description    VARCHAR(255)  NULL,
    status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_categories_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
