# Member 07: Sales + Concurrency Test page + Sales/Purchase Reports + Common components

Branch: `feature/m07-...` -> PR into `develop`

Files: **40**. Tick when done.

## backend
- [ ] `backend/app/api/v1/endpoints/concurrency_test.py`
- [ ] `backend/app/api/v1/endpoints/sales.py`
- [ ] `backend/app/models/sale.py`
- [ ] `backend/app/models/sale_item.py`
- [ ] `backend/app/repositories/sales_repository.py`
- [ ] `backend/app/schemas/concurrency_test.py`
- [ ] `backend/app/schemas/sale.py`
- [ ] `backend/app/services/concurrency_test_service.py`
- [ ] `backend/app/services/sales_service.py`
- [ ] `backend/tests/test_concurrency_test.py`
- [ ] `backend/tests/test_sales.py`

## database
- [ ] `database/adbms/procedures/sp_create_sale.sql`
- [ ] `database/adbms/transactions/03_sales_transaction.sql`
- [ ] `database/adbms/transactions/04_isolation_levels.sql`
- [ ] `database/adbms/transactions/05_concurrency_testing.sql`
- [ ] `database/adbms/views/sales_view.sql`
- [ ] `database/modules/sales/01_create_sales_table.sql`
- [ ] `database/modules/sales/02_create_sale_items_table.sql`
- [ ] `database/modules/sales/03_sales_constraints.sql`

## docs
- [ ] `docs/adbms/isolation_concurrency.md`

## frontend
- [ ] `frontend/src/components/common/ConfirmDialog.jsx`
- [ ] `frontend/src/components/common/Footer.jsx`
- [ ] `frontend/src/components/common/Loading.jsx`
- [ ] `frontend/src/components/common/Modal.jsx`
- [ ] `frontend/src/components/common/Pagination.jsx`
- [ ] `frontend/src/components/concurrency-test/ConcurrencyResultPanel.jsx`
- [ ] `frontend/src/components/sales/SalesForm.jsx`
- [ ] `frontend/src/components/sales/SalesSummary.jsx`
- [ ] `frontend/src/components/sales/SalesTable.jsx`
- [ ] `frontend/src/pages/concurrency-test/ConcurrencyTest.jsx`
- [ ] `frontend/src/pages/reports/PurchaseReport.jsx`
- [ ] `frontend/src/pages/reports/SalesReport.jsx`
- [ ] `frontend/src/pages/sales/CreateSale.jsx`
- [ ] `frontend/src/pages/sales/SaleDetails.jsx`
- [ ] `frontend/src/pages/sales/SalesHistory.jsx`
- [ ] `frontend/src/pages/sales/SalesList.jsx`
- [ ] `frontend/src/services/concurrencyTestService.js`
- [ ] `frontend/src/services/salesService.js`
- [ ] `frontend/src/tests/sales.test.jsx`

## tests
- [ ] `tests/integration/test_sales_flow.py`

