-- Owner: Member 06

USE clouddb_sentinel;

CREATE TABLE integrity_check_results (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    run_id CHAR(36) NOT NULL,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(10) NOT NULL,
    expected_result VARCHAR(255) NOT NULL,
    actual_result VARCHAR(255) NOT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_integrity_results_run_id (run_id),

    CONSTRAINT chk_integrity_result_status
        CHECK (status IN ('PASS', 'FAIL', 'ERROR'))
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;