# Member 04: Suppliers & Purchases + Transaction Demo page

Branch: `feature/m04-...` -> PR into `develop`

Files: **48**. Tick when done.

## backend
- [ ] `backend/app/api/v1/endpoints/purchases.py`
- [ ] `backend/app/api/v1/endpoints/suppliers.py`
- [ ] `backend/app/api/v1/endpoints/transaction_demo.py`
- [ ] `backend/app/models/purchase.py`
- [ ] `backend/app/models/purchase_item.py`
- [ ] `backend/app/models/supplier.py`
- [ ] `backend/app/repositories/purchase_repository.py`
- [ ] `backend/app/repositories/supplier_repository.py`
- [ ] `backend/app/schemas/purchase.py`
- [ ] `backend/app/schemas/supplier.py`
- [ ] `backend/app/schemas/transaction_demo.py`
- [ ] `backend/app/services/purchase_service.py`
- [ ] `backend/app/services/supplier_service.py`
- [ ] `backend/app/services/transaction_demo_service.py`
- [ ] `backend/tests/test_purchases.py`
- [ ] `backend/tests/test_suppliers.py`
- [ ] `backend/tests/test_transaction_demo.py`

## database
- [ ] `database/adbms/procedures/sp_create_purchase.sql`
- [ ] `database/adbms/transactions/01_commit_rollback.sql`
- [ ] `database/adbms/transactions/02_purchase_transaction.sql`
- [ ] `database/adbms/transactions/03_acid_demonstration.sql`
- [ ] `database/adbms/views/purchase_view.sql`
- [ ] `database/modules/purchases/01_create_suppliers_table.sql`
- [ ] `database/modules/purchases/02_create_purchases_table.sql`
- [ ] `database/modules/purchases/03_create_purchase_items_table.sql`
- [ ] `database/modules/purchases/04_purchase_constraints.sql`
- [ ] `database/testing/test_transactions.sql`

## docs
- [ ] `docs/adbms/acid_transactions.md`

## frontend
- [ ] `frontend/src/components/purchases/PurchaseForm.jsx`
- [ ] `frontend/src/components/purchases/PurchaseItemRow.jsx`
- [ ] `frontend/src/components/purchases/PurchaseTable.jsx`
- [ ] `frontend/src/components/suppliers/SupplierForm.jsx`
- [ ] `frontend/src/components/suppliers/SupplierTable.jsx`
- [ ] `frontend/src/components/transaction-demo/ResultPanel.jsx`
- [ ] `frontend/src/components/transaction-demo/ScenarioRunner.jsx`
- [ ] `frontend/src/pages/purchases/CreatePurchase.jsx`
- [ ] `frontend/src/pages/purchases/PurchaseDetails.jsx`
- [ ] `frontend/src/pages/purchases/PurchaseHistory.jsx`
- [ ] `frontend/src/pages/purchases/PurchaseList.jsx`
- [ ] `frontend/src/pages/suppliers/CreateSupplier.jsx`
- [ ] `frontend/src/pages/suppliers/EditSupplier.jsx`
- [ ] `frontend/src/pages/suppliers/SupplierList.jsx`
- [ ] `frontend/src/pages/transaction-demo/TransactionDemo.jsx`
- [ ] `frontend/src/services/purchaseService.js`
- [ ] `frontend/src/services/supplierService.js`
- [ ] `frontend/src/services/transactionDemoService.js`
- [ ] `frontend/src/tests/purchases.test.jsx`

## tests
- [ ] `tests/integration/test_purchase_flow.py`

