-- Owner: Member 02
-- Extra integrity rules and indexes (run after 02_create_products_table.sql)
USE clouddb_sentinel;

-- Prices can never be negative (enforced by MySQL 8.0.16+)
ALTER TABLE products
    ADD CONSTRAINT chk_products_base_price CHECK (base_price >= 0);

-- Names and codes must not be blank strings
ALTER TABLE products
    ADD CONSTRAINT chk_products_name_not_blank CHECK (CHAR_LENGTH(TRIM(product_name)) > 0),
    ADD CONSTRAINT chk_products_code_not_blank CHECK (CHAR_LENGTH(TRIM(product_code)) > 0);

ALTER TABLE categories
    ADD CONSTRAINT chk_categories_name_not_blank CHECK (CHAR_LENGTH(TRIM(category_name)) > 0);

-- Speeds up filtering the product list by category and status
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_status   ON products (status);
