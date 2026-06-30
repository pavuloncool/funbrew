---
name: database-backup-safety
description: Enforce safe backup lifecycle control around any database-affecting work in this project. Use whenever Codex is about to run Supabase, PostgreSQL, Docker, migration, seed, schema, restore, reset, import, update, SQL script, or other database-changing operations. Apply it when there is any doubt whether the task touches the database; default to treating the task as database-affecting.
---

# Database Backup Safety

Protect the active project database before and after every database-affecting task.

Treat this skill as mandatory process control for backup discovery, post-change backup creation, backup validation, and safe retirement of the previous backup copy. Apply it to backup lifecycle only. Do not interpret it as permission to delete, reset, prune, truncate, or otherwise modify the active database beyond the user-requested database operation.

## Required Start Message

Before any Docker/Supabase/PostgreSQL work, send a short status update in this shape:

> Wchodzę w Docker/Supabase: ustalę aktualny wolumen źródłowy i poprzednią kopię, wykonam zleconą operację na bazie danych, utworzę nowy backup, zwaliduję go przez start tymczasowego Postgresa z kopii, a dopiero po pozytywnej walidacji usunę starszy backup volume. Instrukcja dotyczy kopii bazy danych, nie usuwania samej bazy.

Keep the same meaning even if wording changes slightly.

## Workflow

Follow these steps in order. Do not skip steps silently.

### 1. Identify the active database source

Inspect the actual project configuration before touching the database.

Use the local project setup to determine:
- active Docker volume or database source;
- container/service using it;
- previous backup copy, if any;
- planned new backup target.

Typical inspection commands:

```bash
docker ps -a
docker volume ls
docker volume inspect <volume-name>
docker compose ps
docker compose config
pnpm exec supabase status --workdir product
```

Do not guess from naming alone if multiple candidate volumes exist. Resolve ambiguity from mounts, compose config, or Supabase local config.

Record in working notes:
- active database volume/source;
- previous backup volume/file;
- planned new backup target;
- explicit confirmation that the workflow concerns backup copies, not deletion of the active database.

If the active database source is ambiguous, stop and inspect more. Do not continue to destructive or backup-removal steps.

### 2. Identify the previous valid backup

Determine the latest valid backup copy currently held for this project.

Supported backup forms:
- Docker volumes;
- SQL dump files;
- compressed dump files;
- project-specific backup directories.

If no previous backup exists, state that explicitly and continue. The absence of an old backup never authorizes broad cleanup.

### 3. Perform only the requested database operation

Run only the DB change required by the task.

Do not add unrelated:
- resets;
- pruning;
- cleanup;
- schema rewrites;
- deletion of containers or volumes;
- removal of old backups beyond the single previous backup after validation.

### 4. Create a new backup after the DB operation

Create a fresh timestamped backup of the resulting database state.

Preferred naming:

```text
<project-name>_db_backup_YYYYMMDD_HHMMSS
```

If the project already uses a different naming convention, keep it consistent but retain uniqueness and timestamping.

### 5. Validate the new backup functionally

Do not treat backup existence as validation.

Prove that the backup can be restored or started independently from the active database. Prefer:
- starting a temporary PostgreSQL container from the backup volume;
- restoring a dump into a temporary PostgreSQL instance;
- connecting normally and running sanity checks.

Minimum validation queries:

```sql
SELECT current_database();
SELECT schema_name FROM information_schema.schemata;
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
```

Also query representative project tables when known, for example:

```sql
SELECT COUNT(*) FROM public.<critical_table>;
```

When the task changed a specific table or set of rows, prefer validating those exact objects or representative row counts from the restored copy.

Do not validate only against the active database. The validation must exercise the backup copy itself.

### 6. Remove the previous backup only after positive validation

Delete only the previous backup copy and only after the new backup passes validation.

Before removal, re-check the exact target name/path.

Never delete:
- the active database volume;
- the active database container;
- the newly validated backup;
- unrelated Docker volumes;
- unrelated dump files;
- another project's backups.

If validation fails or remains inconclusive, keep both the previous backup and the new untrusted backup for inspection unless the new one is clearly empty or corrupt.

### 7. Handle failure conservatively

If any step fails:
- stop database-affecting work;
- preserve the active database;
- preserve the previous backup;
- preserve any unvalidated new backup unless it is clearly safe to discard;
- report exactly what failed and what was preserved.

Do not delete the previous backup when:
- the new backup was not created;
- the new backup was not validated;
- validation was partial or inconclusive;
- the temporary restore/start failed;
- the active volume is ambiguous;
- the previous backup is ambiguous.

## Safe patterns

Adapt commands to the actual project setup instead of copying blindly.

### Docker volume backup pattern

```bash
docker run --rm \
  -v <active_db_volume>:/source:ro \
  -v <new_backup_volume>:/backup \
  alpine \
  sh -c "cd /source && tar cf /backup/db-backup.tar ."
```

Basic archive presence check:

```bash
docker run --rm \
  -v <new_backup_volume>:/backup:ro \
  alpine \
  sh -c "test -s /backup/db-backup.tar && tar tf /backup/db-backup.tar >/dev/null"
```

Prefer functional PostgreSQL validation after this archive-level check.

### SQL dump pattern

```bash
pg_dump "$DATABASE_URL" > backups/<project-name>_db_backup_YYYYMMDD_HHMMSS.sql
```

Compressed variant:

```bash
pg_dump "$DATABASE_URL" | gzip > backups/<project-name>_db_backup_YYYYMMDD_HHMMSS.sql.gz
```

Validation pattern:

```bash
createdb <temporary_validation_db>
psql <temporary_validation_db> < backups/<backup-file>.sql
psql <temporary_validation_db> -c "SELECT current_database();"
psql <temporary_validation_db> -c "\\dt *.*"
```

For compressed dumps:

```bash
gunzip -c backups/<backup-file>.sql.gz | psql <temporary_validation_db>
```

Remove the temporary validation database/container after successful validation.

## Prohibited actions

Do not:
- delete the active database volume;
- delete the active database container as a substitute for deleting a backup;
- run `docker volume prune` in this workflow;
- remove multiple backups with broad wildcards;
- remove old backups before validating the new one;
- claim validation success without independent restore/start/read testing;
- continue when active-volume identification is ambiguous;
- silently skip backup creation;
- silently skip backup validation.

## Final report

Always end with a concise report containing:
- active database volume/source used;
- previous backup found;
- new backup created;
- validation method;
- validation result;
- whether the previous backup was removed;
- confirmation that the active database was not deleted and that only the previous backup copy was removed.

Use this shape:

```text
Operacja zakończona.

Aktywny wolumen bazy: <active_db_volume>
Poprzednia kopia zapasowa: <old_backup_volume_or_file>
Nowa kopia zapasowa: <new_backup_volume_or_file>

Walidacja:
- <method 1>
- <method 2>

Wynik walidacji: <pozytywny|negatywny|niejednoznaczny>.

Po pozytywnej walidacji usunięto wyłącznie poprzednią kopię zapasową:
<old_backup_volume_or_file>

Aktywna baza danych nie została usunięta. Nowa kopia zapasowa pozostaje jako aktualna kopia projektu.
```

If anything is uncertain, preserve data and say so explicitly.
