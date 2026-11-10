-- CloudDB Sentinel
-- Owner: Member 09
-- Task: Slow Query Identification and Analysis
-- Database: MySQL 8.0+

USE clouddb_sentinel;


-- 1. Check slow query log configuration.

SHOW VARIABLES
WHERE Variable_name IN (
    'slow_query_log',
    'long_query_time',
    'slow_query_log_file',
    'log_queries_not_using_indexes'
);


-- 2. Check the number of recorded slow queries.

SHOW GLOBAL STATUS LIKE 'Slow_queries';


-- 3. Check current database table sizes.

SELECT
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    ROUND(
        (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024,
        2
    ) AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;


-- 4. Identify queries with high average execution time
-- using aggregated Performance Schema statistics.

SELECT
    DIGEST_TEXT,
    COUNT_STAR,
    ROUND(
        AVG_TIMER_WAIT / 1000000000000,
        6
    ) AS avg_execution_time_seconds,
    SUM_ROWS_EXAMINED,
    SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'clouddb_sentinel'
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;
