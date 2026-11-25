<!-- Owner: Member 06 -->

# data dictionary

TODO

# Member 06 — Customer and Integrity Tables

## customers

Stores customer contact information and account status.

| Column     | SQL type        | Nullable | Default / rule                             |
| ---------- | --------------- | -------- | ------------------------------------------ |
| id         | BIGINT UNSIGNED | No       | Auto-increment primary key                 |
| name       | VARCHAR(150)    | No       | Trimmed name must contain a character      |
| email      | VARCHAR(254)    | Yes      | Unique non-NULL value                      |
| phone      | VARCHAR(30)     | Yes      | Optional contact number                    |
| status     | VARCHAR(20)     | No       | Active                                     |
| created_at | TIMESTAMP       | No       | CURRENT_TIMESTAMP                          |
| updated_at | TIMESTAMP       | No       | CURRENT_TIMESTAMP, updated on modification |

### Constraints

- PRIMARY KEY — id
- uq_customers_email — unique email
- chk_customers_name — CHAR_LENGTH(TRIM(name)) > 0
- chk_customers_status — Active or Inactive

The API additionally validates email format and trims text input.
Customer updates use PUT with the complete customer form.

## integrity_check_results

Stores individual results from integrity check runs.

| Column          | SQL type        | Nullable | Default / rule               |
| --------------- | --------------- | -------- | ---------------------------- |
| id              | BIGINT UNSIGNED | No       | Auto-increment primary key   |
| run_id          | CHAR(36)        | No       | UUID identifying a check run |
| check_name      | VARCHAR(100)    | No       | Name of the executed check   |
| status          | VARCHAR(10)     | No       | PASS, FAIL or ERROR          |
| expected_result | VARCHAR(255)    | No       | Expected database behaviour  |
| actual_result   | VARCHAR(255)    | No       | Observed check outcome       |
| checked_at      | TIMESTAMP       | No       | CURRENT_TIMESTAMP            |

### Constraints and indexes

- PRIMARY KEY — id
- chk_integrity_result_status — PASS, FAIL or ERROR
- idx_integrity_results_run_id — index on run_id

Each row represents one check. Rows sharing a run_id belong to
the same execution. This table stores check outcomes without a
foreign key to the temporary probe customer records.
