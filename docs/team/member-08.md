# Member 08: Stock Movements + Audit Reports page + Trigger tests

Branch: `feature/m08-...` -> PR into `develop`

Files: **31**. Tick when done.

## backend
- [ ] `backend/app/api/v1/endpoints/audit_reports.py`
- [ ] `backend/app/api/v1/endpoints/stock_movements.py`
- [ ] `backend/app/models/stock_movement.py`
- [ ] `backend/app/repositories/stock_movement_repository.py`
- [ ] `backend/app/schemas/audit_reports.py`
- [ ] `backend/app/schemas/stock_movement.py`
- [ ] `backend/app/services/audit_report_service.py`
- [ ] `backend/app/services/stock_movement_service.py`
- [ ] `backend/tests/test_audit_reports.py`
- [ ] `backend/tests/test_stock_movements.py`

## database
- [ ] `database/adbms/auditing/audit_report_queries.sql`
- [ ] `database/adbms/procedures/sp_record_stock_adjustment.sql`
- [ ] `database/adbms/triggers/01_before_inventory_update_guard.sql`
- [ ] `database/adbms/triggers/02_before_stock_movement_update_block.sql`
- [ ] `database/adbms/triggers/03_before_stock_movement_delete_block.sql`
- [ ] `database/modules/stock_movements/01_create_stock_movements_table.sql`
- [ ] `database/modules/stock_movements/02_stock_movement_constraints.sql`
- [ ] `database/testing/test_triggers.sql`

## docs
- [ ] `docs/adbms/triggers.md`

## frontend
- [ ] `frontend/src/components/audit-reports/AuditReportFilters.jsx`
- [ ] `frontend/src/components/audit-reports/AuditReportTable.jsx`
- [ ] `frontend/src/components/stock-movements/MovementForm.jsx`
- [ ] `frontend/src/components/stock-movements/MovementTable.jsx`
- [ ] `frontend/src/pages/audit-reports/AuditReports.jsx`
- [ ] `frontend/src/pages/stock-movements/MovementHistory.jsx`
- [ ] `frontend/src/pages/stock-movements/StockAdjustment.jsx`
- [ ] `frontend/src/pages/stock-movements/StockMovementList.jsx`
- [ ] `frontend/src/pages/stock-movements/StockReturn.jsx`
- [ ] `frontend/src/services/auditReportService.js`
- [ ] `frontend/src/services/stockMovementService.js`
- [ ] `frontend/src/tests/stock-movements.test.jsx`

