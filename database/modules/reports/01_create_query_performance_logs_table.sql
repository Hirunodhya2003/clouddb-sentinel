-- CloudDB Sentinel
-- Module: Query Performance Monitoring
-- Table: query_performance_logs

USE clouddb_sentinel;

CREATE TABLE IF NOT EXISTS query_performance_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    query_type VARCHAR(50) NOT NULL,
    query_fingerprint CHAR(64),
    query_text TEXT,
    execution_time_ms DECIMAL(12,3) NOT NULL,
    rows_examined BIGINT NOT NULL DEFAULT 0,
    rows_returned BIGINT NOT NULL DEFAULT 0,
    is_slow_query BOOLEAN NOT NULL DEFAULT FALSE,
    endpoint VARCHAR(255),
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_query_performance_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_query_execution_time
        CHECK (execution_time_ms >= 0),

    CONSTRAINT chk_query_rows_examined
        CHECK (rows_examined >= 0),

    CONSTRAINT chk_query_rows_returned
        CHECK (rows_returned >= 0),

    CONSTRAINT chk_query_type_not_empty
        CHECK (CHAR_LENGTH(TRIM(query_type)) > 0),

    INDEX idx_query_performance_user (user_id),
    INDEX idx_query_performance_type (query_type),
    INDEX idx_query_performance_time (executed_at),
    INDEX idx_query_performance_slow (is_slow_query),
    INDEX idx_query_performance_duration (execution_time_ms)
) ENGINE=InnoDB;
