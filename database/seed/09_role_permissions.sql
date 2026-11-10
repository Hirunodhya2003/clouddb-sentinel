-- CloudDB Sentinel
-- Seed: Default role-permission assignments

USE clouddb_sentinel;

-- ADMIN: All system permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'ADMIN';

-- MANAGER: Store operations and reports
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
    'VIEW_DASHBOARD',
    'VIEW_PRODUCTS',
    'MANAGE_PRODUCTS',
    'VIEW_PURCHASES',
    'MANAGE_PURCHASES',
    'VIEW_INVENTORY',
    'MANAGE_INVENTORY',
    'VIEW_SALES',
    'MANAGE_SALES',
    'VIEW_CUSTOMERS',
    'MANAGE_CUSTOMERS',
    'PROCESS_RETURNS',
    'VIEW_REPORTS'
)
WHERE r.role_name = 'MANAGER';

-- CASHIER: Sales and customer operations
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
    'VIEW_DASHBOARD',
    'VIEW_PRODUCTS',
    'VIEW_INVENTORY',
    'VIEW_SALES',
    'CREATE_SALES',
    'VIEW_CUSTOMERS',
    'MANAGE_CUSTOMERS',
    'PROCESS_RETURNS'
)
WHERE r.role_name = 'CASHIER';

-- INVENTORY_MANAGER: Inventory and purchase operations
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
    'VIEW_DASHBOARD',
    'VIEW_PRODUCTS',
    'MANAGE_PRODUCTS',
    'VIEW_PURCHASES',
    'MANAGE_PURCHASES',
    'VIEW_INVENTORY',
    'MANAGE_INVENTORY',
    'VIEW_REPORTS'
)
WHERE r.role_name = 'INVENTORY_MANAGER';
