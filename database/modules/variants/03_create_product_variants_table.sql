-- CloudDB Sentinel
-- Module: Product Variant Management
-- Table: product_variants

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size_id INT NOT NULL,
    colour_id INT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_variants_size
        FOREIGN KEY (size_id)
        REFERENCES sizes(size_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_variants_colour
        FOREIGN KEY (colour_id)
        REFERENCES colours(colour_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT uq_variants_sku UNIQUE (sku),
    CONSTRAINT uq_product_size_colour
        UNIQUE (product_id, size_id, colour_id),

    CONSTRAINT chk_variant_cost_price CHECK (cost_price >= 0),
    CONSTRAINT chk_variant_selling_price CHECK (selling_price >= 0)
) ENGINE=InnoDB;
