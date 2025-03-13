# Supabase Environment Guide

## Local Development Setup

This project uses Supabase running in Docker for local development.

### Connection Details

- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **API URL**: `http://127.0.0.1:54321`
- **Studio URL**: `http://127.0.0.1:54323`
- **Inbucket URL**: `http://127.0.0.1:54324`

### Common Commands

Start Supabase:
```bash
npx supabase start
```

Stop Supabase:
```bash
npx supabase stop
```

Reset the database to current migrations:
```bash
npx supabase db reset
```

Apply new migrations:
```bash
npx supabase db push
```

Connect to database directly:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Querying the Database

For SQL queries using psql:
```bash
psql -c "YOUR QUERY HERE" postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

For quick checks of table structure:
```bash
psql -c "\d table_name" postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Working with Migrations

Migrations are stored in `supabase/migrations/` and are applied in timestamp order.

To create a new migration:
1. Create a new SQL file in `supabase/migrations/` with the naming pattern `YYYYMMDDHHMMSS_descriptive_name.sql`
2. Add your SQL statements to the file
3. Apply the migration with `npx supabase db push`

### Troubleshooting

If you encounter connection issues:
1. Check if containers are running: `docker ps`
2. Restart Supabase: `npx supabase stop && npx supabase start`
3. Verify the port mappings match the expected values
   
For audit log issues:
1. Check the raw data in the `audit_logs` table
2. Verify trigger functions are working as expected
3. Look for type casting issues in the `handle_audit_log` function 