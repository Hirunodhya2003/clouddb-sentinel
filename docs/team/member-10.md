# Member 10: Audit Logs + Admin/Settings + Backup & Recovery + Docker + CI/CD (DevOps)

Branch: `feature/m10-...` -> PR into `develop`

Files: **69**. Tick when done.

## (root)
- [ ] `.env.example`
- [ ] `docker-compose.yml`

## .github
- [ ] `.github/workflows/backend-ci.yml`
- [ ] `.github/workflows/cd.yml`
- [ ] `.github/workflows/database-ci.yml`
- [ ] `.github/workflows/frontend-ci.yml`

## backend
- [ ] `backend/.dockerignore`
- [ ] `backend/Dockerfile`
- [ ] `backend/app/api/v1/endpoints/admin.py`
- [ ] `backend/app/api/v1/endpoints/audit_logs.py`
- [ ] `backend/app/api/v1/endpoints/backups.py`
- [ ] `backend/app/api/v1/endpoints/recovery_tests.py`
- [ ] `backend/app/models/audit_log.py`
- [ ] `backend/app/models/backup_record.py`
- [ ] `backend/app/models/recovery_test.py`
- [ ] `backend/app/repositories/audit_repository.py`
- [ ] `backend/app/repositories/backup_repository.py`
- [ ] `backend/app/repositories/recovery_repository.py`
- [ ] `backend/app/schemas/admin.py`
- [ ] `backend/app/schemas/audit_log.py`
- [ ] `backend/app/schemas/backup.py`
- [ ] `backend/app/schemas/recovery_test.py`
- [ ] `backend/app/services/admin_service.py`
- [ ] `backend/app/services/audit_service.py`
- [ ] `backend/app/services/backup_service.py`
- [ ] `backend/app/services/recovery_service.py`
- [ ] `backend/tests/test_admin.py`
- [ ] `backend/tests/test_audit_logs.py`
- [ ] `backend/tests/test_backups.py`
- [ ] `backend/tests/test_recovery_tests.py`

## database
- [ ] `database/adbms/auditing/01_audit_insert_triggers.sql`
- [ ] `database/adbms/auditing/02_audit_update_triggers.sql`
- [ ] `database/adbms/auditing/03_audit_delete_triggers.sql`
- [ ] `database/adbms/auditing/04_audit_testing.sql`
- [ ] `database/adbms/backup_recovery/backup_database.sh`
- [ ] `database/adbms/backup_recovery/recovery_documentation.md`
- [ ] `database/adbms/backup_recovery/recovery_testing.sql`
- [ ] `database/adbms/backup_recovery/restore_database.sh`
- [ ] `database/adbms/backup_recovery/verify_backup.sql`
- [ ] `database/modules/auditing/01_create_audit_logs_table.sql`
- [ ] `database/modules/auditing/02_create_backup_records_table.sql`
- [ ] `database/modules/auditing/03_create_recovery_tests_table.sql`
- [ ] `database/modules/auditing/04_audit_constraints.sql`
- [ ] `database/testing/test_backup_recovery.sql`

## docs
- [ ] `docs/adbms/auditing.md`
- [ ] `docs/adbms/backup_recovery.md`
- [ ] `docs/devops/ci_cd_pipeline.md`
- [ ] `docs/devops/deployment.md`
- [ ] `docs/devops/docker_setup.md`

## frontend
- [ ] `frontend/.dockerignore`
- [ ] `frontend/Dockerfile`
- [ ] `frontend/src/components/audit/AuditLogFilters.jsx`
- [ ] `frontend/src/components/audit/AuditLogTable.jsx`
- [ ] `frontend/src/components/database/BackupStatus.jsx`
- [ ] `frontend/src/components/database/RecoveryStatus.jsx`
- [ ] `frontend/src/pages/audit-logs/AuditLogDetails.jsx`
- [ ] `frontend/src/pages/audit-logs/AuditLogList.jsx`
- [ ] `frontend/src/pages/database-admin/BackupManagement.jsx`
- [ ] `frontend/src/pages/database-admin/DatabaseAdmin.jsx`
- [ ] `frontend/src/pages/database-admin/RecoveryTest.jsx`
- [ ] `frontend/src/pages/settings/SystemSettings.jsx`
- [ ] `frontend/src/services/adminService.js`
- [ ] `frontend/src/services/auditService.js`
- [ ] `frontend/src/services/backupService.js`
- [ ] `frontend/src/services/recoveryService.js`
- [ ] `frontend/src/tests/audit-backup.test.jsx`

## scripts
- [ ] `scripts/health_check.sh`
- [ ] `scripts/start.sh`
- [ ] `scripts/stop.sh`

