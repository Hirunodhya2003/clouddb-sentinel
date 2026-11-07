# Member 01: Auth & Employees + DB Roles page + Backend core

Branch: `feature/m01-...` -> PR into `develop`

Files: **63**. Tick when done.

## (root)
- [ ] `.gitignore`
- [ ] `README.md`

## .github
- [ ] `.github/CODEOWNERS`
- [ ] `.github/pull_request_template.md`

## backend
- [ ] `backend/app/api/v1/endpoints/auth.py`
- [ ] `backend/app/api/v1/endpoints/db_roles.py`
- [ ] `backend/app/api/v1/endpoints/users.py`
- [ ] `backend/app/api/v1/router.py`
- [ ] `backend/app/core/config.py`
- [ ] `backend/app/core/exceptions.py`
- [ ] `backend/app/core/logging_config.py`
- [ ] `backend/app/core/permissions.py`
- [ ] `backend/app/core/security.py`
- [ ] `backend/app/database/base.py`
- [ ] `backend/app/database/connection.py`
- [ ] `backend/app/database/session.py`
- [ ] `backend/app/main.py`
- [ ] `backend/app/models/permission.py`
- [ ] `backend/app/models/role.py`
- [ ] `backend/app/models/user.py`
- [ ] `backend/app/repositories/user_repository.py`
- [ ] `backend/app/schemas/auth.py`
- [ ] `backend/app/schemas/db_roles.py`
- [ ] `backend/app/schemas/user.py`
- [ ] `backend/app/services/auth_service.py`
- [ ] `backend/app/services/db_roles_service.py`
- [ ] `backend/app/services/user_service.py`
- [ ] `backend/app/utils/pagination.py`
- [ ] `backend/app/utils/response.py`
- [ ] `backend/app/utils/validators.py`
- [ ] `backend/requirements.txt`
- [ ] `backend/tests/test_auth.py`
- [ ] `backend/tests/test_db_roles.py`
- [ ] `backend/tests/test_users.py`

## database
- [ ] `database/adbms/security/01_create_database_users.sql`
- [ ] `database/adbms/security/02_create_database_roles.sql`
- [ ] `database/adbms/security/03_grant_permissions.sql`
- [ ] `database/adbms/security/04_revoke_permissions.sql`
- [ ] `database/adbms/security/05_security_testing.sql`
- [ ] `database/modules/users/01_create_roles_table.sql`
- [ ] `database/modules/users/02_create_permissions_table.sql`
- [ ] `database/modules/users/03_create_users_table.sql`
- [ ] `database/modules/users/04_insert_default_roles.sql`
- [ ] `database/modules/users/05_user_constraints.sql`
- [ ] `database/testing/test_security.sql`

## docs
- [ ] `docs/adbms/database_security.md`

## frontend
- [ ] `frontend/src/components/auth/LoginForm.jsx`
- [ ] `frontend/src/components/db-roles/RolePrivilegeTable.jsx`
- [ ] `frontend/src/components/users/UserForm.jsx`
- [ ] `frontend/src/components/users/UserTable.jsx`
- [ ] `frontend/src/context/AuthContext.jsx`
- [ ] `frontend/src/hooks/useAuth.js`
- [ ] `frontend/src/pages/auth/Login.jsx`
- [ ] `frontend/src/pages/db-roles/DbRolesAccess.jsx`
- [ ] `frontend/src/pages/users/CreateUser.jsx`
- [ ] `frontend/src/pages/users/EditUser.jsx`
- [ ] `frontend/src/pages/users/UserList.jsx`
- [ ] `frontend/src/pages/users/UserProfile.jsx`
- [ ] `frontend/src/routes/ProtectedRoute.jsx`
- [ ] `frontend/src/services/authService.js`
- [ ] `frontend/src/services/dbRolesService.js`
- [ ] `frontend/src/services/userService.js`
- [ ] `frontend/src/tests/auth.test.jsx`

