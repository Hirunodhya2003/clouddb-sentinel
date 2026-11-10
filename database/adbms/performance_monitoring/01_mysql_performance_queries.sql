-- CloudDB Sentinel
-- Owner: Member 09
-- Task: MySQL Performance Monitoring
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- 1. Monitor important MySQL server status metrics.

SHOW GLOBAL STATUS
WHERE Variable_name IN (
    'Uptime',
    'Threads_connected',
    'Threads_running',
    'Max_used_connections',
    'Questions',
    'Slow_queries',
    'Created_tmp_tables',
    'Created_tmp_disk_tables',
    'Select_scan',
    'Select_full_join',
    'Innodb_buffer_pool_read_requests',
    'Innodb_buffer_pool_reads'
);


-- 2. Check important MySQL configuration values.

SHOW GLOBAL VARIABLES
WHERE Variable_name IN (
    'max_connections',
    'innodb_buffer_pool_size',
    'slow_query_log',
    'long_query_time',
    'performance_schema'
);


-- 3. Check InnoDB engine status.

SHOW ENGINE INNODB STATUS;


-- 4. Check database size.

SELECT
    TABLE_SCHEMA AS database_name,
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2)
        AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
GROUP BY TABLE_SCHEMA;
