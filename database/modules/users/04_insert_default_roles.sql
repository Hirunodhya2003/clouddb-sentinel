-- CloudDB Sentinel
-- Module: User Management
-- Default system roles

USE clouddb_sentinel;

INSERT IGNORE INTO roles (role_name, description) VALUES
('ADMIN', 'Full system access and administration'),
('MANAGER', 'Manage store operations and view reports'),
('CASHIER', 'Manage sales, payments and customers'),
('INVENTORY_MANAGER', 'Manage products, inventory and purchases');
