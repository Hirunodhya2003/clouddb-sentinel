# Query Performance Analysis and Comparison

**Project:** CloudDB Sentinel  
**Module:** CS304.3 – Advanced Database Management Systems  
**Owner:** Member 09 – Query Performance & Optimization  
**Database:** MySQL 8.0.46

## 1. Objective

This document records the query execution plans and performance observations obtained using MySQL EXPLAIN and EXPLAIN ANALYZE.

The objective is to identify index usage, table scans, and opportunities to improve query efficiency.

## 2. Query Execution Plan Comparison

| Query | Access Type | Index Used | Observation |
|---|---|---|---|
| Product name search | range | idx_products_name | Uses an index range scan |
| Sales date range | range | idx_sales_date | Uses an index range scan |
| Sales aggregation | index | idx_sales_status | Uses the status index |
| Inventory low-stock | ALL | None | Performs a full table scan |
| Purchase date range | range | idx_purchases_date | Uses an index range scan |

## 3. EXPLAIN ANALYZE Observations

- Product search used the `idx_products_name` index.
- Sales date-range analysis used the `idx_sales_date` index.
- Sales aggregation used the `idx_sales_status` index.
- The inventory low-stock query performed a table scan.
- Some execution plans returned zero rows because the relevant business tables currently contain no matching records.

## 4. Slow Query Monitoring

The following MySQL configuration was observed:

| Setting | Current Value |
|---|---|
| slow_query_log | OFF |
| long_query_time | 10 seconds |
| log_queries_not_using_indexes | OFF |
| Slow_queries | 0 |

The `query_performance_logs` table currently contains zero records.

Therefore, application-level slow query monitoring could not yet be evaluated using recorded application queries.

## 5. Optimization Techniques Applied

1. Used prefix matching (`LIKE 'Shirt%'`) for product name searches.
2. Used direct date-range conditions instead of applying functions to date columns.
3. Selected only the required columns instead of using `SELECT *`.
4. Used aggregate functions to generate sales summaries.
5. Reviewed existing indexes using EXPLAIN.

## 6. Recommendations

- Review the inventory full table scan with Member 05 before considering any new indexes.
- Coordinate with Member 01 before changing MySQL server-level monitoring settings.
- Integrate application-level query logging with the backend.
- Collect representative business data and repeat performance tests.
- Compare execution plans and execution times after future optimizations.

## 7. Conclusion

The analysis confirmed that MySQL uses existing indexes for product searches, sales date-range queries, sales aggregation, and purchase date-range queries.

The inventory low-stock query currently performs a full table scan. Further evaluation should be carried out using representative data before making indexing changes.

The results provide a baseline for future query optimization and performance monitoring.
