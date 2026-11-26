-- ============================================================
-- CloudDB Sentinel
-- Member 09: Database Connection Monitoring
-- MySQL Version: 8.0+
-- ============================================================

-- 1. Current connection count
SHOW GLOBAL STATUS LIKE 'Threads_connected';

-- 2. Currently running threads
SHOW GLOBAL STATUS LIKE 'Threads_running';

-- 3. Maximum connections used since server startup
SHOW GLOBAL STATUS LIKE 'Max_used_connections';

-- 4. Maximum allowed connections
SHOW GLOBAL VARIABLES LIKE 'max_connections';

-- 5. Connection errors
SHOW GLOBAL STATUS LIKE 'Connection_errors%';

-- 6. Aborted connections
SHOW GLOBAL STATUS LIKE 'Aborted_connects';

-- 7. Total connection attempts
SHOW GLOBAL STATUS LIKE 'Connections';

-- 8. Current database process list
SHOW FULL PROCESSLIST;
