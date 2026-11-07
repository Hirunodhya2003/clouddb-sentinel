# CloudDB Sentinel

CloudDB Sentinel is an inventory, purchasing and sales system built to demonstrate **Advanced Database Management Systems (ADBMS)** concepts on a real application: database security, normalization, views, stored procedures, transactions and concurrency, indexing, triggers, query optimization, performance monitoring, auditing, and backup & recovery.

The project is split between **10 team members**. Each member owns a set of files, listed in `docs/team/member-XX.md`. This README explains how we work together so that nobody overwrites anybody else's work.

---

## Project details

### What the system does

CloudDB Sentinel is a web application for a clothing/retail business. Staff manage products and their size/colour variants, buy stock from suppliers, sell to customers, and track every stock movement. The application is deliberately built around the database: each part of the system exists to show a specific ADBMS technique working on real data, and the app includes tools (Schema Viewer, Views Explorer, Query Analyzer, Index Manager, Concurrency Test, etc.) that let you see those techniques live.

### Functional modules (pages)

| Area | Pages / features | Owner |
|---|---|---|
| Authentication & users | Login, user list, profile, create/edit user | 01 |
| DB roles & access | Database roles and privileges viewer | 01 |
| Products & categories | Product and category CRUD | 02 |
| Schema Viewer | Table list and ER diagram | 02 |
| Variants | Variant CRUD, size and colour selectors | 03 |
| Views Explorer | Browse database views and their results | 03 |
| Suppliers & purchases | Supplier CRUD, purchase orders, purchase history | 04 |
| Transaction Demo | Run commit/rollback/ACID scenarios | 04 |
| Inventory | Stock list, details, low-stock items, history | 05 |
| Index Manager | View, create and test indexes | 05 |
| Customers | Customer CRUD and details | 06 |
| Integrity Check | Run constraint/integrity tests and see results | 06 |
| Sales | Create sale, sales list, details, history | 07 |
| Concurrency Test | Run isolation-level / concurrent-access tests | 07 |
| Stock movements | Adjustments, returns, movement history | 08 |
| Audit Reports | Reports built from the audit log | 08 |
| Dashboard | Summary cards, sales and inventory charts, recent transactions | 09 |
| Reports | Sales, purchase, inventory and stock reports | 05, 07, 09 |
| Query Analyzer | EXPLAIN viewer and plan comparison | 09 |
| Performance Monitor | Connection stats and slow-query table | 09 |
| Audit Logs | Audit log list, details and filters | 10 |
| Database Admin | Backup management and recovery tests | 10 |
| System Settings | Admin and system settings | 10 |

### ADBMS concepts demonstrated

| Concept | Where it lives | Owner |
|---|---|---|
| Database security (users, roles, grant/revoke) | `database/adbms/security/` | 01 |
| Normalization (unnormalized to 3NF) | `database/adbms/normalization/` | 02 |
| Views, functions, joins, subqueries, nested queries | `database/adbms/views/`, `functions/`, `advanced_queries/` | 03, 05, 06 |
| Stored procedures | `database/adbms/procedures/` | 04, 05, 07, 08 |
| Transactions and ACID | `database/adbms/transactions/` | 04 |
| Isolation levels and concurrency | `database/adbms/transactions/` | 07 |
| Indexing (before/after comparison) | `database/adbms/indexing/` | 05 |
| Triggers | `database/adbms/triggers/` | 08 |
| Constraints and integrity testing | `database/modules/*/`, `database/testing/` | all, 06 |
| Auditing | `database/adbms/auditing/` | 10 (reports: 08) |
| Query optimization (EXPLAIN, slow queries) | `database/adbms/query_optimization/` | 09 |
| Performance monitoring | `database/adbms/performance_monitoring/`, `monitoring/` | 09 |
| Backup and recovery | `database/adbms/backup_recovery/` | 10 |

### Project size

About 500 files, split across 10 members (roughly 30 to 70 files each). Every file has exactly one owner; see the ownership map at the end of this README.

---

## 1. Tech overview

| Layer | Folder | Notes |
|---|---|---|
| Backend | `backend/app/` | Python API, layered: endpoints → services → repositories → models |
| Frontend | `frontend/src/` | React (Vite), pages / components / services |
| Database | `database/` | MySQL scripts: schema, modules, ADBMS work, seed data, tests |
| Monitoring | `monitoring/` | Prometheus, Grafana, exporters |
| DevOps | `docker-compose.yml`, `.github/workflows/`, `scripts/` | Docker, CI/CD, helper scripts |
| Docs | `docs/` | ADBMS reports, database docs, devops docs, screenshots, Postman |

---

## 2. Team and ownership

| # | Member area | Main ADBMS topic |
|---|---|---|
| 01 | Auth & Employees, DB Roles page, backend core | Database security (users, roles, grants) |
| 02 | Products & Categories, Schema Viewer page, frontend shell | Normalization (1NF to 3NF) |
| 03 | Variants, Views Explorer page | Views, functions, joins, subqueries |
| 04 | Suppliers & Purchases, Transaction Demo page | Stored procedures, transactions, ACID |
| 05 | Inventory, Index Manager page, Inventory/Stock reports, DB schema owner | Indexing, `sp_update_inventory` |
| 06 | Customers, Integrity Check page, seed data & docs | Constraints, integrity testing, aggregates |
| 07 | Sales, Concurrency Test page, Sales/Purchase reports, common components | Isolation levels, concurrency |
| 08 | Stock Movements, Audit Reports page, trigger tests | Triggers |
| 09 | Reports, Dashboard, Query Analyzer, Performance Monitor, Monitoring | Query optimization, performance monitoring |
| 10 | Audit Logs, Admin/Settings, Backup & Recovery, Docker, CI/CD | Auditing, backup and recovery |

### How to find your files

1. Open `docs/team/member-XX.md` (your number). It lists every file you own with a checkbox. Tick them as you finish.
2. Every stub file starts with `Owner: Member XX`. To list yours:
   ```bash
   git grep -l "Owner: Member 03"
   ```
3. `.github/CODEOWNERS` maps every path to its owner. GitHub uses it to request reviews automatically.

> Only edit files you own. If you need a change in someone else's file, ask the owner (see section 6).

---

## 3. Repository structure

```
CloudDB_Sentinel/
├── backend/
│   ├── app/
│   │   ├── main.py                 # app entry point (Member 01)
│   │   ├── api/v1/router.py        # registers all endpoints (Member 01)
│   │   ├── api/v1/endpoints/       # HTTP routes, one file per feature
│   │   ├── schemas/                # request/response models
│   │   ├── services/               # business logic
│   │   ├── repositories/           # database access
│   │   ├── models/                 # table models
│   │   ├── core/                   # config, security, permissions, exceptions, logging
│   │   ├── database/               # connection, session, base
│   │   ├── utils/                  # pagination, validators, response helpers
│   │   └── monitoring/             # metrics, middleware, health check (Member 09)
│   ├── tests/                      # unit tests per feature
│   └── requirements.txt
├── frontend/
│   ├── package.json, vite.config.js, index.html
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── routes/                 # AppRoutes.jsx, ProtectedRoute.jsx
│       ├── layouts/                # MainLayout, AuthLayout
│       ├── pages/<feature>/        # one folder per feature
│       ├── components/<feature>/   # reusable UI per feature, plus components/common/
│       ├── services/               # API calls (api.js + one service per feature)
│       ├── hooks/, context/, utils/, styles/
│       └── tests/
├── database/
│   ├── schema/                     # 01_create_database.sql, README_run_order.md
│   ├── modules/<feature>/          # CREATE TABLE and constraint scripts per feature
│   ├── adbms/                      # security, normalization, views, functions, procedures,
│   │                               # transactions, indexing, triggers, auditing,
│   │                               # query_optimization, performance_monitoring, backup_recovery
│   ├── seed/                       # sample data (01_ to 07_)
│   ├── testing/                    # SQL test scripts
│   └── migrations/                 # numbered changes after the first release
├── monitoring/                     # prometheus, grafana, exporters
├── scripts/                        # init_db.sh, reset_db.sh, start.sh, stop.sh, health_check.sh
├── tests/                          # integration and performance tests
├── docs/                           # adbms, database, devops, monitoring, postman, screenshots, team
├── docker-compose.yml, .env.example
└── .github/                        # CODEOWNERS, PR template, workflows
```

Naming rules:
- Backend files: `snake_case.py`. React components and pages: `PascalCase.jsx`. Frontend services and hooks: `camelCase.js`.
- SQL scripts that must run in order start with a number: `01_...`, `02_...`.
- Use the file names already in the repo. Do not rename or move files without telling the owner.

---

## 4. Getting started

```bash
git clone https://github.com/<owner>/clouddb-sentinel.git
cd clouddb-sentinel
git checkout develop
```

Then:

1. Copy `.env.example` to `.env` and fill in your local database settings. **Never commit `.env`.**
2. Create the database by following `database/schema/README_run_order.md` (or run `scripts/init_db.sh` once it is ready).
3. Backend: create a virtual environment and install `backend/requirements.txt`.
4. Frontend: `cd frontend && npm install && npm run dev`.
5. Docker users: `docker compose up` once Member 10 has finished `docker-compose.yml`.

---

## 5. Git workflow (everyone follows this)

**Branches**
- `main`: stable, always working. Nobody pushes here directly.
- `develop`: integration branch. All work is merged here through Pull Requests.
- `feature/mXX-short-description`: your working branch (example: `feature/m03-variants-api`).

**Daily flow**

```bash
git checkout develop
git pull origin develop                    # always start from the latest develop
git checkout -b feature/m03-variants-api   # your branch
# ... work on YOUR files only ...
git add <your files>
git commit -m "Add variant service and endpoints"
git push -u origin feature/m03-variants-api
```

Then on GitHub: **Compare & pull request**, base branch **`develop`**, fill in the PR template.

**Rules**
1. Never push directly to `main` or `develop`.
2. One PR = one small, focused piece of work. Open PRs often instead of one huge PR at the end.
3. Before opening a PR, update your branch: `git pull origin develop` (resolve conflicts if any) and make sure tests pass.
4. At least one teammate reviews and approves each PR. CODEOWNERS adds the file owners as reviewers automatically.
5. Commit messages: short, present tense, say what changed ("Add stock adjustment procedure"), not "fixed stuff".
6. Do not commit secrets, `.env`, database dumps, `node_modules/`, or backup files.

---

## 6. Shared files and who merges them

| File | Owner | How others get changes in |
|---|---|---|
| `frontend/src/routes/AppRoutes.jsx` | Member 02 | Describe your route (path + page component) in your PR. Member 02 adds it. |
| `frontend/src/components/common/Sidebar.jsx` | Member 02 | Same: ask in your PR description. |
| `backend/app/api/v1/router.py` | Member 01 | Add your single `include_router` line in your PR. Member 01 reviews it. |
| `backend/app/core/*`, `backend/app/database/*`, `backend/app/utils/*` | Member 01 | Ask Member 01 for changes. |
| `frontend/src/services/api.js`, `layouts/*`, `styles/*` | Member 02 | Ask Member 02. |
| `frontend/src/components/common/*` (Modal, Pagination, ...) | Member 07 | Ask Member 07. |
| `database/schema/*`, `database/migrations/README.md` | Member 05 | Ask Member 05. |
| `database/seed/*` | Member 06 | Send Member 06 the sample rows you need. |
| `docker-compose.yml`, `.env.example`, `.github/workflows/*` | Member 10 | Ask Member 10. |

If you need something added to a file you do not own, say so in your PR or message the owner. Do not edit it yourself.

---

## 7. Database rules (important)

### 7.1 Every table has one owner

| Tables | Owner |
|---|---|
| `roles`, `permissions`, `users` | Member 01 |
| `categories`, `products` | Member 02 |
| `sizes`, `colors`, `product_variants` | Member 03 |
| `suppliers`, `purchases`, `purchase_items` | Member 04 |
| `inventory` | Member 05 |
| `customers` | Member 06 |
| `sales`, `sale_items` | Member 07 |
| `stock_movements` | Member 08 |
| `query_performance_logs` | Member 09 |
| `audit_logs`, `backup_records`, `recovery_tests` | Member 10 |

Only the owner edits a table's `CREATE TABLE` and constraint scripts.

### 7.2 Changing a table after it exists

1. Tell the table owner what you need and why.
2. Do **not** edit the original `01_create_...` file. Add a **new numbered migration** in `database/migrations/`, for example `database/migrations/003_add_barcode_to_products.sql`.
3. Mention the migration in your PR.

### 7.3 The inventory rule (never break this)

`inventory.quantity` is updated **only** by the stored procedure `sp_update_inventory` (Member 05).

- Members 04 (purchases), 07 (sales) and 08 (stock adjustments) **call** the procedure. They never `UPDATE inventory` directly.
- Triggers must **not** change `quantity`. Member 08's trigger only guards against direct updates.
- The backend `inventory_repository.py` is **read only**. All writes go through the procedure.

### 7.4 Script run order

`database/schema/README_run_order.md` (Member 05) lists the order in which scripts run. Keep your numbering consistent. Note: `database/adbms/transactions/` currently has two files starting with `03_` (one from Member 04, one from Member 07). Agree on a renumbering with each other and tell Member 05.

---

## 8. Dependencies between members

| Who | Needs from | What |
|---|---|---|
| 04, 07, 08 | Member 05 | `sp_update_inventory` must exist before they call it |
| 08 | Member 10 | The `audit_logs` column list (Member 10 sends it early). Member 08's Audit Reports page only reads this table. |
| 09 | Everyone | Slow-query and performance data comes from the whole system |
| Everyone | Member 01 | Auth, permissions and the shared backend core |
| Everyone | Member 02 | Frontend shell, routes, sidebar, `api.js` |
| 06 | Everyone | Seed data and Postman collection need each member's sample data |

Audit logs: `audit_repository.py` and `audit_service.py` belong to Member 10. Member 06 has no part in them.

---

## 9. Backend conventions

Keep the layers separate:

```
endpoint (HTTP only)  ->  service (business rules)  ->  repository (SQL / DB access)  ->  model (table)
```

- Endpoints: validate input with a schema, call a service, return a response. No SQL here.
- Services: business logic and calling stored procedures. No HTTP code here.
- Repositories: the only place that talks to the database.
- Use the shared helpers from `core/` and `utils/` (config, exceptions, pagination, response format). Do not write your own copies.
- Each feature has its own tests in `backend/tests/test_<feature>.py`.

---

## 10. Frontend conventions

- One folder per feature under `pages/` and `components/`.
- Pages fetch data through the feature service in `src/services/`, never with raw `fetch` inside components.
- All API calls go through `services/api.js` (base URL, auth token, error handling).
- Reuse `components/common/` (Modal, ConfirmDialog, Pagination, Loading, Footer) before building your own.
- Protected pages go behind `ProtectedRoute`.
- Each feature has a test file in `src/tests/`.

---

## 11. Testing

- Backend: put tests in `backend/tests/`. Cross-feature flows go in `tests/integration/` (purchase flow, sales flow).
- Database: SQL tests live in `database/testing/` (security, views, procedures, functions, triggers, transactions, constraints, integrity, backup/recovery).
- Frontend: `frontend/src/tests/`.
- CI runs on every PR (`.github/workflows/`). A PR with failing checks is not merged.

---

## 12. Definition of done (check before every PR)

- [ ] I only changed files I own (or agreed changes with the owner).
- [ ] My checklist in `docs/team/member-XX.md` is updated.
- [ ] I pulled the latest `develop` and resolved conflicts.
- [ ] Code runs locally and my tests pass.
- [ ] No direct writes to `inventory.quantity` (only `sp_update_inventory`).
- [ ] Table or column changes use a new numbered migration and the owner knows.
- [ ] No secrets, `.env` files, dumps or build folders are committed.
- [ ] If I need a new route, sidebar entry or `include_router` line, it is described in the PR.
- [ ] Documentation for my part is written in `docs/` (ADBMS members: your `docs/adbms/<topic>.md`).

---

## 13. Documentation and report

- ADBMS explanations: `docs/adbms/` (each member writes the file for their own topic).
- Database design: `docs/database/` (ER diagram, schema, relationships, data dictionary).
- DevOps: `docs/devops/` and `docs/monitoring/`.
- API examples: `docs/postman/CloudDB_Sentinel.postman_collection.json` (Member 06 assembles it).
- Screenshots for the report go in `docs/screenshots/<frontend|backend|database|adbms|monitoring|ci_cd>/`. Name them clearly, for example `m05_index_before_after.png`.
- Final project report: `docs/project-report/README.md`.

---

## 14. Common problems

**Merge conflict.** Run `git pull origin develop`, open the conflicted files, keep both sides' changes where they make sense, then commit. If the conflict is in a file you do not own, stop and ask the owner.

**I pushed to the wrong branch.** Tell the team before doing anything. Do not force-push to `main` or `develop`.

**`403` when pushing to GitHub.** GitHub does not accept passwords. Use a Personal Access Token with `repo` scope, or log in with `gh auth login`.

**I need a table or column that does not exist yet.** Ask the table owner (section 7.1). Do not create tables in your own module.

**My file is not where I expected.** Check `docs/team/member-XX.md` and the stub's `Owner:` line. Do not move files.

---

*Questions about workflow go to the group chat first. Questions about a specific file go to that file's owner.*

---

## Appendix: Member-wise file ownership map

The tree below shows **which member owns which file**. Each `member-XX_...` block lists only that member's files, shown at their real repository path.

> **Important:** the `member-XX_...` folders do **not** exist in the repository. They are only a way to read the ownership list. In the real repo, all these files sit in the shared folders (`backend/`, `frontend/`, `database/`, `docs/`, ...). Where a member's block shows `backend/app/services/variant_service.py`, the real file is simply `backend/app/services/variant_service.py` at the repo root.
>
> The same list, as a checklist, is in `docs/team/member-XX.md`.

```
CloudDB_Sentinel/
│
├── member-01_auth-employees_db-roles_backend-core/
│   ├── README.md
│   ├── .gitignore
│   ├── .github/
│   │   ├── CODEOWNERS
│   │   └── pull_request_template.md
│   ├── backend/
│   │   ├── requirements.txt
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/v1/
│   │   │   │   ├── router.py
│   │   │   │   └── endpoints/
│   │   │   │       ├── auth.py
│   │   │   │       ├── users.py
│   │   │   │       └── db_roles.py
│   │   │   ├── models/
│   │   │   │   ├── user.py
│   │   │   │   ├── role.py
│   │   │   │   └── permission.py
│   │   │   ├── schemas/
│   │   │   │   ├── auth.py
│   │   │   │   ├── user.py
│   │   │   │   └── db_roles.py
│   │   │   ├── repositories/
│   │   │   │   └── user_repository.py
│   │   │   ├── services/
│   │   │   │   ├── auth_service.py
│   │   │   │   ├── user_service.py
│   │   │   │   └── db_roles_service.py
│   │   │   ├── database/
│   │   │   │   ├── connection.py
│   │   │   │   ├── session.py
│   │   │   │   └── base.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   ├── security.py
│   │   │   │   ├── permissions.py
│   │   │   │   ├── exceptions.py
│   │   │   │   └── logging_config.py
│   │   │   └── utils/
│   │   │       ├── pagination.py
│   │   │       ├── validators.py
│   │   │       └── response.py
│   │   └── tests/
│   │       ├── test_auth.py
│   │       ├── test_users.py
│   │       └── test_db_roles.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── users/
│   │   │   │   ├── UserList.jsx
│   │   │   │   ├── UserProfile.jsx
│   │   │   │   ├── CreateUser.jsx
│   │   │   │   └── EditUser.jsx
│   │   │   └── db-roles/
│   │   │       └── DbRolesAccess.jsx
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.jsx
│   │   │   ├── users/
│   │   │   │   ├── UserForm.jsx
│   │   │   │   └── UserTable.jsx
│   │   │   └── db-roles/
│   │   │       └── RolePrivilegeTable.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── dbRolesService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   └── tests/
│   │       └── auth.test.jsx
│   ├── database/
│   │   ├── modules/users/
│   │   │   ├── 01_create_roles_table.sql
│   │   │   ├── 02_create_permissions_table.sql
│   │   │   ├── 03_create_users_table.sql
│   │   │   ├── 04_insert_default_roles.sql
│   │   │   └── 05_user_constraints.sql
│   │   ├── adbms/security/
│   │   │   ├── 01_create_database_users.sql
│   │   │   ├── 02_create_database_roles.sql
│   │   │   ├── 03_grant_permissions.sql
│   │   │   ├── 04_revoke_permissions.sql
│   │   │   └── 05_security_testing.sql
│   │   └── testing/
│   │       └── test_security.sql
│   └── docs/adbms/
│       └── database_security.md
│
├── member-02_products-categories_schema-viewer_frontend-shell/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── routes/
│   │       │   └── AppRoutes.jsx
│   │       ├── layouts/
│   │       │   ├── MainLayout.jsx
│   │       │   └── AuthLayout.jsx
│   │       ├── services/
│   │       │   ├── api.js
│   │       │   ├── productService.js
│   │       │   ├── categoryService.js
│   │       │   └── schemaViewerService.js
│   │       ├── components/
│   │       │   ├── common/
│   │       │   │   ├── Navbar.jsx
│   │       │   │   └── Sidebar.jsx
│   │       │   ├── products/
│   │       │   │   ├── ProductForm.jsx
│   │       │   │   └── ProductTable.jsx
│   │       │   ├── categories/
│   │       │   │   └── CategoryForm.jsx
│   │       │   └── schema-viewer/
│   │       │       ├── TableList.jsx
│   │       │       └── ErdDiagram.jsx
│   │       ├── hooks/
│   │       │   └── usePagination.js
│   │       ├── utils/
│   │       │   ├── formatDate.js
│   │       │   ├── formatCurrency.js
│   │       │   └── validators.js
│   │       ├── styles/
│   │       │   ├── global.css
│   │       │   ├── auth.css
│   │       │   └── dashboard.css
│   │       ├── pages/
│   │       │   ├── products/
│   │       │   │   ├── ProductList.jsx
│   │       │   │   ├── ProductDetails.jsx
│   │       │   │   ├── CreateProduct.jsx
│   │       │   │   └── EditProduct.jsx
│   │       │   ├── categories/
│   │       │   │   ├── CategoryList.jsx
│   │       │   │   ├── CreateCategory.jsx
│   │       │   │   └── EditCategory.jsx
│   │       │   └── schema-viewer/
│   │       │       └── SchemaViewer.jsx
│   │       └── tests/
│   │           └── products.test.jsx
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── products.py
│   │   │   │   ├── categories.py
│   │   │   │   └── schema_viewer.py
│   │   │   ├── models/
│   │   │   │   ├── product.py
│   │   │   │   └── category.py
│   │   │   ├── schemas/
│   │   │   │   ├── product.py
│   │   │   │   ├── category.py
│   │   │   │   └── schema_viewer.py
│   │   │   ├── repositories/
│   │   │   │   ├── product_repository.py
│   │   │   │   └── category_repository.py
│   │   │   └── services/
│   │   │       ├── product_service.py
│   │   │       ├── category_service.py
│   │   │       └── schema_viewer_service.py
│   │   └── tests/
│   │       ├── test_products.py
│   │       ├── test_categories.py
│   │       └── test_schema_viewer.py
│   ├── database/
│   │   ├── modules/products/
│   │   │   ├── 01_create_categories_table.sql
│   │   │   ├── 02_create_products_table.sql
│   │   │   └── 03_product_constraints.sql
│   │   └── adbms/normalization/
│   │       ├── 01_unnormalized_tables.sql
│   │       ├── 02_first_normal_form.sql
│   │       ├── 03_second_normal_form.sql
│   │       ├── 04_third_normal_form.sql
│   │       └── normalization_documentation.md
│   └── docs/
│       ├── database/
│       │   ├── er_diagram.md
│       │   ├── database_schema.md
│       │   └── relationships.md
│       └── adbms/
│           └── normalization.md
│
├── member-03_variants_views-explorer/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── variants.py
│   │   │   │   └── views_explorer.py
│   │   │   ├── models/
│   │   │   │   ├── product_variant.py
│   │   │   │   ├── size.py
│   │   │   │   └── color.py
│   │   │   ├── schemas/
│   │   │   │   ├── variant.py
│   │   │   │   └── views_explorer.py
│   │   │   ├── repositories/
│   │   │   │   └── variant_repository.py
│   │   │   └── services/
│   │   │       ├── variant_service.py
│   │   │       └── views_explorer_service.py
│   │   └── tests/
│   │       ├── test_variants.py
│   │       └── test_views_explorer.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── variants/
│   │   │   │   ├── VariantList.jsx
│   │   │   │   ├── CreateVariant.jsx
│   │   │   │   ├── EditVariant.jsx
│   │   │   │   └── VariantDetails.jsx
│   │   │   └── views-explorer/
│   │   │       └── ViewsExplorer.jsx
│   │   ├── components/
│   │   │   ├── variants/
│   │   │   │   ├── VariantForm.jsx
│   │   │   │   ├── VariantTable.jsx
│   │   │   │   ├── SizeSelector.jsx
│   │   │   │   └── ColorSelector.jsx
│   │   │   └── views-explorer/
│   │   │       ├── ViewList.jsx
│   │   │       └── ViewResultTable.jsx
│   │   ├── services/
│   │   │   ├── variantService.js
│   │   │   └── viewsExplorerService.js
│   │   └── tests/
│   │       └── variants.test.jsx
│   ├── database/
│   │   ├── modules/variants/
│   │   │   ├── 01_create_sizes_table.sql
│   │   │   ├── 02_create_colors_table.sql
│   │   │   ├── 03_create_product_variants_table.sql
│   │   │   └── 04_variant_constraints.sql
│   │   ├── adbms/
│   │   │   ├── views/
│   │   │   │   ├── product_view.sql
│   │   │   │   └── variant_details_view.sql
│   │   │   ├── functions/
│   │   │   │   └── fn_check_variant_availability.sql
│   │   │   └── advanced_queries/
│   │   │       ├── joins.sql
│   │   │       ├── subqueries.sql
│   │   │       └── nested_queries.sql
│   │   └── testing/
│   │       └── test_views.sql
│   └── docs/adbms/
│       └── views_and_advanced_queries.md
│
├── member-04_suppliers-purchases_transaction-demo/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── suppliers.py
│   │   │   │   ├── purchases.py
│   │   │   │   └── transaction_demo.py
│   │   │   ├── models/
│   │   │   │   ├── supplier.py
│   │   │   │   ├── purchase.py
│   │   │   │   └── purchase_item.py
│   │   │   ├── schemas/
│   │   │   │   ├── supplier.py
│   │   │   │   ├── purchase.py
│   │   │   │   └── transaction_demo.py
│   │   │   ├── repositories/
│   │   │   │   ├── supplier_repository.py
│   │   │   │   └── purchase_repository.py
│   │   │   └── services/
│   │   │       ├── supplier_service.py
│   │   │       ├── purchase_service.py
│   │   │       └── transaction_demo_service.py
│   │   └── tests/
│   │       ├── test_suppliers.py
│   │       ├── test_purchases.py
│   │       └── test_transaction_demo.py
│   ├── tests/integration/
│   │   └── test_purchase_flow.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── suppliers/
│   │   │   │   ├── SupplierList.jsx
│   │   │   │   ├── CreateSupplier.jsx
│   │   │   │   └── EditSupplier.jsx
│   │   │   ├── purchases/
│   │   │   │   ├── PurchaseList.jsx
│   │   │   │   ├── CreatePurchase.jsx
│   │   │   │   ├── PurchaseDetails.jsx
│   │   │   │   └── PurchaseHistory.jsx
│   │   │   └── transaction-demo/
│   │   │       └── TransactionDemo.jsx
│   │   ├── components/
│   │   │   ├── suppliers/
│   │   │   │   ├── SupplierForm.jsx
│   │   │   │   └── SupplierTable.jsx
│   │   │   ├── purchases/
│   │   │   │   ├── PurchaseForm.jsx
│   │   │   │   ├── PurchaseTable.jsx
│   │   │   │   └── PurchaseItemRow.jsx
│   │   │   └── transaction-demo/
│   │   │       ├── ScenarioRunner.jsx
│   │   │       └── ResultPanel.jsx
│   │   ├── services/
│   │   │   ├── supplierService.js
│   │   │   ├── purchaseService.js
│   │   │   └── transactionDemoService.js
│   │   └── tests/
│   │       └── purchases.test.jsx
│   ├── database/
│   │   ├── modules/purchases/
│   │   │   ├── 01_create_suppliers_table.sql
│   │   │   ├── 02_create_purchases_table.sql
│   │   │   ├── 03_create_purchase_items_table.sql
│   │   │   └── 04_purchase_constraints.sql
│   │   ├── adbms/
│   │   │   ├── procedures/
│   │   │   │   └── sp_create_purchase.sql
│   │   │   ├── transactions/
│   │   │   │   ├── 01_commit_rollback.sql
│   │   │   │   ├── 02_purchase_transaction.sql
│   │   │   │   └── 03_acid_demonstration.sql
│   │   │   └── views/
│   │   │       └── purchase_view.sql
│   │   └── testing/
│   │       └── test_transactions.sql
│   └── docs/adbms/
│       └── acid_transactions.md
│
├── member-05_inventory_index-manager_stock-reports_db-schema-owner/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── inventory.py
│   │   │   │   └── index_manager.py
│   │   │   ├── models/
│   │   │   │   └── inventory.py
│   │   │   ├── schemas/
│   │   │   │   ├── inventory.py
│   │   │   │   └── index_manager.py
│   │   │   ├── repositories/
│   │   │   │   └── inventory_repository.py      (read only; writes go through the procedure)
│   │   │   └── services/
│   │   │       ├── inventory_service.py
│   │   │       └── index_manager_service.py
│   │   └── tests/
│   │       ├── test_inventory.py
│   │       └── test_index_manager.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── inventory/
│   │   │   │   ├── InventoryList.jsx
│   │   │   │   ├── InventoryDetails.jsx
│   │   │   │   ├── LowStockItems.jsx
│   │   │   │   └── InventoryHistory.jsx
│   │   │   ├── index-manager/
│   │   │   │   └── IndexManager.jsx
│   │   │   └── reports/
│   │   │       ├── InventoryReport.jsx
│   │   │       └── StockReport.jsx
│   │   ├── components/
│   │   │   ├── inventory/
│   │   │   │   ├── InventoryTable.jsx
│   │   │   │   ├── StockStatus.jsx
│   │   │   │   └── StockSummary.jsx
│   │   │   └── index-manager/
│   │   │       ├── IndexTable.jsx
│   │   │       └── IndexForm.jsx
│   │   ├── services/
│   │   │   ├── inventoryService.js
│   │   │   └── indexManagerService.js
│   │   └── tests/
│   │       └── inventory.test.jsx
│   ├── database/
│   │   ├── schema/
│   │   │   ├── 01_create_database.sql
│   │   │   └── README_run_order.md
│   │   ├── migrations/
│   │   │   └── README.md
│   │   ├── modules/inventory/
│   │   │   ├── 01_create_inventory_table.sql
│   │   │   └── 02_inventory_constraints.sql
│   │   ├── adbms/
│   │   │   ├── procedures/
│   │   │   │   └── sp_update_inventory.sql      (the ONLY stock writer)
│   │   │   ├── functions/
│   │   │   │   ├── fn_calculate_stock_value.sql
│   │   │   │   └── fn_check_stock_availability.sql
│   │   │   ├── views/
│   │   │   │   └── inventory_view.sql
│   │   │   └── indexing/
│   │   │       ├── 01_create_indexes.sql
│   │   │       ├── 02_before_indexing.sql
│   │   │       ├── 03_after_indexing.sql
│   │   │       └── 04_index_testing.sql
│   │   └── testing/
│   │       ├── test_procedures.sql
│   │       └── test_functions.sql
│   ├── scripts/
│   │   ├── init_db.sh
│   │   └── reset_db.sh
│   └── docs/adbms/
│       └── indexing.md
│
├── member-06_customers_integrity-check_seed-docs/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── customers.py
│   │   │   │   └── integrity_check.py
│   │   │   ├── models/
│   │   │   │   └── customer.py
│   │   │   ├── schemas/
│   │   │   │   ├── customer.py
│   │   │   │   └── integrity_check.py
│   │   │   ├── repositories/
│   │   │   │   └── customer_repository.py
│   │   │   └── services/
│   │   │       ├── customer_service.py
│   │   │       └── integrity_check_service.py
│   │   └── tests/
│   │       ├── test_customers.py
│   │       └── test_integrity_check.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── customers/
│   │   │   │   ├── CustomerList.jsx
│   │   │   │   ├── CustomerDetails.jsx
│   │   │   │   ├── CreateCustomer.jsx
│   │   │   │   └── EditCustomer.jsx
│   │   │   └── integrity-check/
│   │   │       └── IntegrityCheck.jsx
│   │   ├── components/
│   │   │   ├── customers/
│   │   │   │   ├── CustomerForm.jsx
│   │   │   │   └── CustomerTable.jsx
│   │   │   └── integrity-check/
│   │   │       └── TestResultTable.jsx
│   │   ├── services/
│   │   │   ├── customerService.js
│   │   │   └── integrityCheckService.js
│   │   └── tests/
│   │       └── customers.test.jsx
│   ├── database/
│   │   ├── modules/customers/
│   │   │   ├── 01_create_customers_table.sql
│   │   │   └── 02_customer_constraints.sql
│   │   ├── adbms/advanced_queries/
│   │   │   ├── aggregate_functions.sql
│   │   │   └── customer_analytics.sql
│   │   ├── testing/
│   │   │   ├── test_constraints.sql
│   │   │   └── test_integrity.sql
│   │   └── seed/
│   │       ├── 01_users.sql
│   │       ├── 02_categories.sql
│   │       ├── 03_products.sql
│   │       ├── 04_suppliers.sql
│   │       ├── 05_variants.sql
│   │       ├── 06_customers.sql
│   │       └── 07_opening_stock.sql
│   └── docs/
│       ├── adbms/
│       │   └── integrity_testing.md
│       ├── database/
│       │   └── data_dictionary.md
│       ├── postman/
│       │   └── CloudDB_Sentinel.postman_collection.json
│       ├── screenshots/
│       │   ├── frontend/
│       │   ├── backend/
│       │   ├── database/
│       │   ├── adbms/
│       │   ├── monitoring/
│       │   └── ci_cd/
│       └── project-report/
│           └── README.md
│
├── member-07_sales_concurrency-test_sales-purchase-reports_common-components/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── sales.py
│   │   │   │   └── concurrency_test.py
│   │   │   ├── models/
│   │   │   │   ├── sale.py
│   │   │   │   └── sale_item.py
│   │   │   ├── schemas/
│   │   │   │   ├── sale.py
│   │   │   │   └── concurrency_test.py
│   │   │   ├── repositories/
│   │   │   │   └── sales_repository.py
│   │   │   └── services/
│   │   │       ├── sales_service.py
│   │   │       └── concurrency_test_service.py
│   │   └── tests/
│   │       ├── test_sales.py
│   │       └── test_concurrency_test.py
│   ├── tests/integration/
│   │   └── test_sales_flow.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── sales/
│   │   │   │   ├── SalesList.jsx
│   │   │   │   ├── CreateSale.jsx
│   │   │   │   ├── SaleDetails.jsx
│   │   │   │   └── SalesHistory.jsx
│   │   │   ├── concurrency-test/
│   │   │   │   └── ConcurrencyTest.jsx
│   │   │   └── reports/
│   │   │       ├── SalesReport.jsx
│   │   │       └── PurchaseReport.jsx
│   │   ├── components/
│   │   │   ├── sales/
│   │   │   │   ├── SalesForm.jsx
│   │   │   │   ├── SalesTable.jsx
│   │   │   │   └── SalesSummary.jsx
│   │   │   ├── concurrency-test/
│   │   │   │   └── ConcurrencyResultPanel.jsx
│   │   │   └── common/
│   │   │       ├── Modal.jsx
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── Pagination.jsx
│   │   │       ├── Footer.jsx
│   │   │       └── Loading.jsx
│   │   ├── services/
│   │   │   ├── salesService.js
│   │   │   └── concurrencyTestService.js
│   │   └── tests/
│   │       └── sales.test.jsx
│   ├── database/
│   │   ├── modules/sales/
│   │   │   ├── 01_create_sales_table.sql
│   │   │   ├── 02_create_sale_items_table.sql
│   │   │   └── 03_sales_constraints.sql
│   │   └── adbms/
│   │       ├── procedures/
│   │       │   └── sp_create_sale.sql
│   │       ├── transactions/
│   │       │   ├── 03_sales_transaction.sql
│   │       │   ├── 04_isolation_levels.sql
│   │       │   └── 05_concurrency_testing.sql
│   │       └── views/
│   │           └── sales_view.sql
│   └── docs/adbms/
│       └── isolation_concurrency.md
│
├── member-08_stock-movements_audit-reports_trigger-tests/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── stock_movements.py
│   │   │   │   └── audit_reports.py
│   │   │   ├── models/
│   │   │   │   └── stock_movement.py
│   │   │   ├── schemas/
│   │   │   │   ├── stock_movement.py
│   │   │   │   └── audit_reports.py
│   │   │   ├── repositories/
│   │   │   │   └── stock_movement_repository.py
│   │   │   └── services/
│   │   │       ├── stock_movement_service.py
│   │   │       └── audit_report_service.py
│   │   └── tests/
│   │       ├── test_stock_movements.py
│   │       └── test_audit_reports.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── stock-movements/
│   │   │   │   ├── StockMovementList.jsx
│   │   │   │   ├── StockAdjustment.jsx
│   │   │   │   ├── StockReturn.jsx
│   │   │   │   └── MovementHistory.jsx
│   │   │   └── audit-reports/
│   │   │       └── AuditReports.jsx
│   │   ├── components/
│   │   │   ├── stock-movements/
│   │   │   │   ├── MovementForm.jsx
│   │   │   │   └── MovementTable.jsx
│   │   │   └── audit-reports/
│   │   │       ├── AuditReportTable.jsx
│   │   │       └── AuditReportFilters.jsx
│   │   ├── services/
│   │   │   ├── stockMovementService.js
│   │   │   └── auditReportService.js
│   │   └── tests/
│   │       └── stock-movements.test.jsx
│   ├── database/
│   │   ├── modules/stock_movements/
│   │   │   ├── 01_create_stock_movements_table.sql
│   │   │   └── 02_stock_movement_constraints.sql
│   │   ├── adbms/
│   │   │   ├── procedures/
│   │   │   │   └── sp_record_stock_adjustment.sql   (calls sp_update_inventory)
│   │   │   ├── triggers/
│   │   │   │   ├── 01_before_inventory_update_guard.sql
│   │   │   │   ├── 02_before_stock_movement_update_block.sql
│   │   │   │   └── 03_before_stock_movement_delete_block.sql
│   │   │   └── auditing/
│   │   │       └── audit_report_queries.sql
│   │   └── testing/
│   │       └── test_triggers.sql
│   └── docs/adbms/
│       └── triggers.md
│
├── member-09_reports_dashboard_query-analyzer_performance-monitor_monitoring/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/
│   │   │   │   ├── reports.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── query_analyzer.py
│   │   │   │   └── performance_monitor.py
│   │   │   ├── models/
│   │   │   │   └── query_performance_log.py
│   │   │   ├── schemas/
│   │   │   │   ├── reports.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── query_analyzer.py
│   │   │   │   └── performance_monitor.py
│   │   │   ├── repositories/
│   │   │   │   ├── report_repository.py
│   │   │   │   └── dashboard_repository.py
│   │   │   ├── services/
│   │   │   │   ├── report_service.py
│   │   │   │   ├── dashboard_service.py
│   │   │   │   ├── query_analyzer_service.py
│   │   │   │   └── performance_monitor_service.py
│   │   │   └── monitoring/
│   │   │       ├── metrics.py
│   │   │       ├── middleware.py
│   │   │       └── health_check.py
│   │   └── tests/
│   │       ├── test_reports.py
│   │       ├── test_dashboard.py
│   │       ├── test_query_analyzer.py
│   │       └── test_performance_monitor.py
│   ├── frontend/src/
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── query-analyzer/
│   │   │   │   └── QueryAnalyzer.jsx
│   │   │   └── performance-monitor/
│   │   │       └── PerformanceMonitor.jsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── SummaryCards.jsx
│   │   │   │   ├── SalesChart.jsx
│   │   │   │   ├── InventoryChart.jsx
│   │   │   │   └── RecentTransactions.jsx
│   │   │   ├── query-analyzer/
│   │   │   │   ├── ExplainViewer.jsx
│   │   │   │   └── PlanComparison.jsx
│   │   │   ├── performance-monitor/
│   │   │   │   ├── ConnectionStats.jsx
│   │   │   │   └── SlowQueryTable.jsx
│   │   │   └── reports/
│   │   │       ├── ReportTable.jsx
│   │   │       └── ReportFilters.jsx
│   │   ├── services/
│   │   │   ├── reportService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── queryAnalyzerService.js
│   │   │   └── performanceMonitorService.js
│   │   └── tests/
│   │       ├── dashboard.test.jsx
│   │       └── performance.test.jsx
│   ├── database/
│   │   ├── modules/reports/
│   │   │   ├── 01_create_query_performance_logs_table.sql
│   │   │   ├── sales_report_queries.sql
│   │   │   ├── purchase_report_queries.sql
│   │   │   ├── inventory_report_queries.sql
│   │   │   └── business_summary_queries.sql
│   │   └── adbms/
│   │       ├── views/
│   │       │   └── business_summary_view.sql
│   │       ├── query_optimization/
│   │       │   ├── 01_explain_queries.sql
│   │       │   ├── 02_explain_analyze.sql
│   │       │   ├── 03_slow_queries.sql
│   │       │   ├── 04_optimized_queries.sql
│   │       │   └── performance_comparison.md
│   │       └── performance_monitoring/
│   │           ├── 01_mysql_performance_queries.sql
│   │           ├── 02_connection_monitoring.sql
│   │           ├── 03_table_statistics.sql
│   │           └── monitoring_documentation.md
│   ├── tests/performance/
│   │   └── README.md
│   ├── monitoring/
│   │   ├── prometheus/
│   │   │   ├── prometheus.yml
│   │   │   └── alert_rules.yml
│   │   ├── grafana/
│   │   │   ├── provisioning/
│   │   │   │   ├── datasources/
│   │   │   │   │   └── prometheus.yml
│   │   │   │   └── dashboards/
│   │   │   │       └── dashboard.yml
│   │   │   └── dashboards/
│   │   │       ├── application_dashboard.json
│   │   │       ├── mysql_dashboard.json
│   │   │       └── infrastructure_dashboard.json
│   │   └── exporters/
│   │       └── mysqld_exporter.cnf.example
│   └── docs/
│       ├── adbms/
│       │   ├── query_optimization.md
│       │   └── performance_monitoring.md
│       └── monitoring/
│           └── monitoring_setup.md
│
└── member-10_audit-logs_admin-settings_backup-recovery_docker_ci-cd/
    ├── docker-compose.yml
    ├── .env.example
    ├── .github/workflows/
    │   ├── backend-ci.yml
    │   ├── frontend-ci.yml
    │   ├── database-ci.yml
    │   └── cd.yml                                  (optional)
    ├── scripts/
    │   ├── start.sh
    │   ├── stop.sh
    │   └── health_check.sh
    ├── backend/
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   ├── app/
    │   │   ├── api/v1/endpoints/
    │   │   │   ├── audit_logs.py
    │   │   │   ├── backups.py
    │   │   │   ├── recovery_tests.py
    │   │   │   └── admin.py
    │   │   ├── models/
    │   │   │   ├── audit_log.py
    │   │   │   ├── backup_record.py
    │   │   │   └── recovery_test.py
    │   │   ├── schemas/
    │   │   │   ├── audit_log.py
    │   │   │   ├── backup.py
    │   │   │   ├── recovery_test.py
    │   │   │   └── admin.py
    │   │   ├── repositories/
    │   │   │   ├── audit_repository.py
    │   │   │   ├── backup_repository.py
    │   │   │   └── recovery_repository.py
    │   │   └── services/
    │   │       ├── audit_service.py
    │   │       ├── backup_service.py
    │   │       ├── recovery_service.py
    │   │       └── admin_service.py
    │   └── tests/
    │       ├── test_audit_logs.py
    │       ├── test_backups.py
    │       ├── test_recovery_tests.py
    │       └── test_admin.py
    ├── frontend/
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   └── src/
    │       ├── pages/
    │       │   ├── audit-logs/
    │       │   │   ├── AuditLogList.jsx
    │       │   │   └── AuditLogDetails.jsx
    │       │   ├── database-admin/
    │       │   │   ├── DatabaseAdmin.jsx
    │       │   │   ├── BackupManagement.jsx
    │       │   │   └── RecoveryTest.jsx
    │       │   └── settings/
    │       │       └── SystemSettings.jsx
    │       ├── components/
    │       │   ├── audit/
    │       │   │   ├── AuditLogTable.jsx
    │       │   │   └── AuditLogFilters.jsx
    │       │   └── database/
    │       │       ├── BackupStatus.jsx
    │       │       └── RecoveryStatus.jsx
    │       ├── services/
    │       │   ├── auditService.js
    │       │   ├── backupService.js
    │       │   ├── recoveryService.js
    │       │   └── adminService.js
    │       └── tests/
    │           └── audit-backup.test.jsx
    ├── database/
    │   ├── modules/auditing/
    │   │   ├── 01_create_audit_logs_table.sql
    │   │   ├── 02_create_backup_records_table.sql
    │   │   ├── 03_create_recovery_tests_table.sql
    │   │   └── 04_audit_constraints.sql
    │   ├── adbms/
    │   │   ├── auditing/
    │   │   │   ├── 01_audit_insert_triggers.sql
    │   │   │   ├── 02_audit_update_triggers.sql
    │   │   │   ├── 03_audit_delete_triggers.sql
    │   │   │   └── 04_audit_testing.sql
    │   │   └── backup_recovery/
    │   │       ├── backup_database.sh
    │   │       ├── restore_database.sh
    │   │       ├── verify_backup.sql
    │   │       ├── recovery_testing.sql
    │   │       └── recovery_documentation.md
    │   └── testing/
    │       └── test_backup_recovery.sql
    └── docs/
        ├── adbms/
        │   ├── auditing.md
        │   └── backup_recovery.md
        └── devops/
            ├── docker_setup.md
            ├── deployment.md
            └── ci_cd_pipeline.md
```
