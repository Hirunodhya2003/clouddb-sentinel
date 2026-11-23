-- Owner: Member 06
-- TODO: write SQL

ALTER TABLE customers
    ADD CONSTRAINT uq_customers_email UNIQUE (email),
    ADD CONSTRAINT chk_customers_name
        CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    ADD CONSTRAINT chk_customers_status
        CHECK (status IN ('Active', 'Inactive'));