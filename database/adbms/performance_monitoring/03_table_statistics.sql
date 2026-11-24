-- ============================================================
-- CloudDB Sentinel
-- Member 09: Database Table Statistics
-- MySQL Version: 8.0+
-- ============================================================

-- 1. Table size and row statistics
SELECT
    TABLE_NAME,
    ENGINE,
    TABLE_ROWS,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_size_mb,
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_size_mb,
    ROUND(DATA_FREE / 1024 / 1024, 2) AS free_space_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;


-- 2. Total database storage statistics
SELECT
    COUNT(*) AS total_tables,
    ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) AS total_data_mb,
    ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) AS total_index_mb,
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2)
        AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE';


-- 3. Table index information
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;


