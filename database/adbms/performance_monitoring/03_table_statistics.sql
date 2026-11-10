-- CloudDB Sentinel
-- Owner: Member 09
-- Task: Database Table and Index Statistics
-- Database: MySQL 8.0+

USE clouddb_sentinel;

-- 1. Monitor table sizes and estimated row counts.

SELECT
    TABLE_NAME,
    TABLE_ROWS AS estimated_rows,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_size_mb,
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_size_mb,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2)
        AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;


-- 2. Monitor indexes defined on database tables.

SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;


-- 3. Identify tables with the highest estimated row counts.

SELECT
    TABLE_NAME,
    TABLE_ROWS AS estimated_rows
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
ORDER BY TABLE_ROWS DESC
LIMIT 10;


-- 4. Check table storage engine and row format.

SELECT
    TABLE_NAME,
    ENGINE,
    ROW_FORMAT,
    TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clouddb_sentinel'
ORDER BY TABLE_NAME;
