-- Owner: Member 02
-- Table: products (run after 01_create_categories_table.sql)
USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS products (
    product_id    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    product_code  VARCHAR(30)    NOT NULL,
    product_name  VARCHAR(150)   NOT NULL,
    category_id   INT UNSIGNED   NOT NULL,
    description   VARCHAR(500)   NULL,
    base_price    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    UNIQUE KEY uq_products_code (product_code),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
