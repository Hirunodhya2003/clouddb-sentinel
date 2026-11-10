-- CloudDB Sentinel
-- Seed: Default system permissions

USE clouddb_sentinel;

INSERT IGNORE INTO permissions (permission_name, description) VALUES
('VIEW_DASHBOARD', 'View the system dashboard'),
('MANAGE_USERS', 'Create, update and manage users'),
('MANAGE_ROLES', 'Manage roles and permissions'),
('VIEW_PRODUCTS', 'View products'),
('MANAGE_PRODUCTS', 'Create and update products'),
('VIEW_PURCHASES', 'View supplier purchases'),
('MANAGE_PURCHASES', 'Manage supplier purchases'),
('VIEW_INVENTORY', 'View stock levels'),
('MANAGE_INVENTORY', 'Manage inventory and stock adjustments'),
('VIEW_SALES', 'View sales records'),
('CREATE_SALES', 'Create sales and invoices'),
('MANAGE_SALES', 'Manage sales records'),
('VIEW_CUSTOMERS', 'View customer information'),
('MANAGE_CUSTOMERS', 'Manage customer information'),
('PROCESS_RETURNS', 'Process customer returns'),
('VIEW_REPORTS', 'View business reports'),
('VIEW_AUDIT_LOGS', 'View system audit logs'),
('MANAGE_SETTINGS', 'Manage system settings');
