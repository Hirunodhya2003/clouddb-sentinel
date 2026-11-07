# CloudDB Sentinel

Inventory & sales system with an ADBMS focus (security, normalization, views, transactions,
indexing, triggers, optimization, monitoring, backup/recovery).

## Layout
- `backend/app/`: API, models, schemas, repositories, services, core, monitoring
- `frontend/src/`: pages, components, services, shell
- `database/`: schema, modules, adbms, seed, testing, migrations
- `docs/`, `scripts/`, `monitoring/`, `tests/`, `.github/`

## Members
| # | Area | Files |
|---|---|---|
| 01 | Auth & Employees + DB Roles page + Backend core | 63 |
| 02 | Products & Categories + Schema Viewer page + Frontend shell | 63 |
| 03 | Variants + Views Explorer page | 38 |
| 04 | Suppliers & Purchases + Transaction Demo page | 48 |
| 05 | Inventory + Index Manager page + Inventory/Stock Reports + DB schema owner | 43 |
| 06 | Customers + Integrity Check page + Seed/Docs | 44 |
| 07 | Sales + Concurrency Test page + Sales/Purchase Reports + Common components | 40 |
| 08 | Stock Movements + Audit Reports page + Trigger tests | 31 |
| 09 | Reports + Dashboard + Query Analyzer + Performance Monitor + Monitoring (DevOps) | 68 |
| 10 | Audit Logs + Admin/Settings + Backup & Recovery + Docker + CI/CD (DevOps) | 69 |

Each member's checklist is in `docs/team/member-XX.md`. Every stub file starts with `Owner: Member XX`.

## Rules
1. `inventory.quantity` is updated ONLY by `sp_update_inventory` (Member 05). Members 04, 07, 08 call it. Triggers never update quantity.
2. Every table has one owner. To change a table, tell the owner and add a new numbered migration file.
3. Everyone works on `feature/mXX-...` and opens a PR into `develop`.
4. Only Member 02 merges `AppRoutes.jsx` and `Sidebar.jsx`. Others describe their route in the PR.
5. Audit: Member 10 owns `audit_logs`; give Member 08 the column list early.
6. DB run order: `database/schema/README_run_order.md`.

Note: `database/adbms/transactions/` has two `03_` files (acid demo, sales transaction). Renumber if needed.
