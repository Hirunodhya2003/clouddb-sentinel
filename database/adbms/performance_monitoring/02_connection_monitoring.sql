-- CloudDB Sentinel
-- Owner: Member 09
-- Task: MySQL Connection Monitoring
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- 1. Monitor current connection statistics.

SHOW GLOBAL STATUS
WHERE Variable_name IN (
    'Threads_connected',
    'Threads_running',
    'Max_used_connections',
    'Connections',
    'Aborted_connects'
);


-- 2. Check the configured maximum connections.

SHOW GLOBAL VARIABLES LIKE 'max_connections';


-- 3. View currently active database connections.

SHOW FULL PROCESSLIST;


-- 4. Count connections by command type.

SELECT
    COMMAND,
    COUNT(*) AS connection_count
FROM information_schema.PROCESSLIST
GROUP BY COMMAND
ORDER BY connection_count DESC;


-- 5. Identify currently running queries.

SELECT
    ID,
    USER,
    HOST,
    DB,
    COMMAND,
    TIME AS execution_time_seconds,
    STATE,
    INFO
FROM information_schema.PROCESSLIST
WHERE COMMAND <> 'Sleep'
ORDER BY TIME DESC;
