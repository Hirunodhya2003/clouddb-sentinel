# Member 05: Inventory + Index Manager page + Inventory/Stock Reports + DB schema owner

Branch: `feature/m05-...` -> PR into `develop`

Files: **43**. Tick when done.

## backend
- [ ] `backend/app/api/v1/endpoints/index_manager.py`
- [ ] `backend/app/api/v1/endpoints/inventory.py`
- [ ] `backend/app/models/inventory.py`
- [ ] `backend/app/repositories/inventory_repository.py`
- [ ] `backend/app/schemas/index_manager.py`
- [ ] `backend/app/schemas/inventory.py`
- [ ] `backend/app/services/index_manager_service.py`
- [ ] `backend/app/services/inventory_service.py`
- [ ] `backend/tests/test_index_manager.py`
- [ ] `backend/tests/test_inventory.py`

## database
- [ ] `database/adbms/functions/fn_calculate_stock_value.sql`
- [ ] `database/adbms/functions/fn_check_stock_availability.sql`
- [ ] `database/adbms/indexing/01_create_indexes.sql`
- [ ] `database/adbms/indexing/02_before_indexing.sql`
- [ ] `database/adbms/indexing/03_after_indexing.sql`
- [ ] `database/adbms/indexing/04_index_testing.sql`
- [ ] `database/adbms/procedures/sp_update_inventory.sql`
- [ ] `database/adbms/views/inventory_view.sql`
- [ ] `database/migrations/README.md`
- [ ] `database/modules/inventory/01_create_inventory_table.sql`
- [ ] `database/modules/inventory/02_inventory_constraints.sql`
- [ ] `database/schema/01_create_database.sql`
- [ ] `database/schema/README_run_order.md`
- [ ] `database/testing/test_functions.sql`
- [ ] `database/testing/test_procedures.sql`

## docs
- [ ] `docs/adbms/indexing.md`

## frontend
- [ ] `frontend/src/components/index-manager/IndexForm.jsx`
- [ ] `frontend/src/components/index-manager/IndexTable.jsx`
- [ ] `frontend/src/components/inventory/InventoryTable.jsx`
- [ ] `frontend/src/components/inventory/StockStatus.jsx`
- [ ] `frontend/src/components/inventory/StockSummary.jsx`
- [ ] `frontend/src/pages/index-manager/IndexManager.jsx`
- [ ] `frontend/src/pages/inventory/InventoryDetails.jsx`
- [ ] `frontend/src/pages/inventory/InventoryHistory.jsx`
- [ ] `frontend/src/pages/inventory/InventoryList.jsx`
- [ ] `frontend/src/pages/inventory/LowStockItems.jsx`
- [ ] `frontend/src/pages/reports/InventoryReport.jsx`
- [ ] `frontend/src/pages/reports/StockReport.jsx`
- [ ] `frontend/src/services/indexManagerService.js`
- [ ] `frontend/src/services/inventoryService.js`
- [ ] `frontend/src/tests/inventory.test.jsx`

## scripts
- [ ] `scripts/init_db.sh`
- [ ] `scripts/reset_db.sh`

