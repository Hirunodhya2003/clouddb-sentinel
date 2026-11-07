# Member 09: Reports + Dashboard + Query Analyzer + Performance Monitor + Monitoring (DevOps)

Branch: `feature/m09-...` -> PR into `develop`

Files: **68**. Tick when done.

## backend
- [ ] `backend/app/api/v1/endpoints/dashboard.py`
- [ ] `backend/app/api/v1/endpoints/performance_monitor.py`
- [ ] `backend/app/api/v1/endpoints/query_analyzer.py`
- [ ] `backend/app/api/v1/endpoints/reports.py`
- [ ] `backend/app/models/query_performance_log.py`
- [ ] `backend/app/monitoring/health_check.py`
- [ ] `backend/app/monitoring/metrics.py`
- [ ] `backend/app/monitoring/middleware.py`
- [ ] `backend/app/repositories/dashboard_repository.py`
- [ ] `backend/app/repositories/report_repository.py`
- [ ] `backend/app/schemas/dashboard.py`
- [ ] `backend/app/schemas/performance_monitor.py`
- [ ] `backend/app/schemas/query_analyzer.py`
- [ ] `backend/app/schemas/reports.py`
- [ ] `backend/app/services/dashboard_service.py`
- [ ] `backend/app/services/performance_monitor_service.py`
- [ ] `backend/app/services/query_analyzer_service.py`
- [ ] `backend/app/services/report_service.py`
- [ ] `backend/tests/test_dashboard.py`
- [ ] `backend/tests/test_performance_monitor.py`
- [ ] `backend/tests/test_query_analyzer.py`
- [ ] `backend/tests/test_reports.py`

## database
- [ ] `database/adbms/performance_monitoring/01_mysql_performance_queries.sql`
- [ ] `database/adbms/performance_monitoring/02_connection_monitoring.sql`
- [ ] `database/adbms/performance_monitoring/03_table_statistics.sql`
- [ ] `database/adbms/performance_monitoring/monitoring_documentation.md`
- [ ] `database/adbms/query_optimization/01_explain_queries.sql`
- [ ] `database/adbms/query_optimization/02_explain_analyze.sql`
- [ ] `database/adbms/query_optimization/03_slow_queries.sql`
- [ ] `database/adbms/query_optimization/04_optimized_queries.sql`
- [ ] `database/adbms/query_optimization/performance_comparison.md`
- [ ] `database/adbms/views/business_summary_view.sql`
- [ ] `database/modules/reports/01_create_query_performance_logs_table.sql`
- [ ] `database/modules/reports/business_summary_queries.sql`
- [ ] `database/modules/reports/inventory_report_queries.sql`
- [ ] `database/modules/reports/purchase_report_queries.sql`
- [ ] `database/modules/reports/sales_report_queries.sql`

## docs
- [ ] `docs/adbms/performance_monitoring.md`
- [ ] `docs/adbms/query_optimization.md`
- [ ] `docs/monitoring/monitoring_setup.md`

## frontend
- [ ] `frontend/src/components/dashboard/InventoryChart.jsx`
- [ ] `frontend/src/components/dashboard/RecentTransactions.jsx`
- [ ] `frontend/src/components/dashboard/SalesChart.jsx`
- [ ] `frontend/src/components/dashboard/SummaryCards.jsx`
- [ ] `frontend/src/components/performance-monitor/ConnectionStats.jsx`
- [ ] `frontend/src/components/performance-monitor/SlowQueryTable.jsx`
- [ ] `frontend/src/components/query-analyzer/ExplainViewer.jsx`
- [ ] `frontend/src/components/query-analyzer/PlanComparison.jsx`
- [ ] `frontend/src/components/reports/ReportFilters.jsx`
- [ ] `frontend/src/components/reports/ReportTable.jsx`
- [ ] `frontend/src/pages/dashboard/Dashboard.jsx`
- [ ] `frontend/src/pages/performance-monitor/PerformanceMonitor.jsx`
- [ ] `frontend/src/pages/query-analyzer/QueryAnalyzer.jsx`
- [ ] `frontend/src/services/dashboardService.js`
- [ ] `frontend/src/services/performanceMonitorService.js`
- [ ] `frontend/src/services/queryAnalyzerService.js`
- [ ] `frontend/src/services/reportService.js`
- [ ] `frontend/src/tests/dashboard.test.jsx`
- [ ] `frontend/src/tests/performance.test.jsx`

## monitoring
- [ ] `monitoring/exporters/mysqld_exporter.cnf.example`
- [ ] `monitoring/grafana/dashboards/application_dashboard.json`
- [ ] `monitoring/grafana/dashboards/infrastructure_dashboard.json`
- [ ] `monitoring/grafana/dashboards/mysql_dashboard.json`
- [ ] `monitoring/grafana/provisioning/dashboards/dashboard.yml`
- [ ] `monitoring/grafana/provisioning/datasources/prometheus.yml`
- [ ] `monitoring/prometheus/alert_rules.yml`
- [ ] `monitoring/prometheus/prometheus.yml`

## tests
- [ ] `tests/performance/README.md`

