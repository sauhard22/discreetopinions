import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Execute raw SQL via Supabase Management API (uses the service_role key)
async function runSQL(sql) {
  // Supabase exposes a /rest/v1/rpc endpoint, but for raw DDL we use the
  // postgres connection through supabase-js .rpc() with a custom function,
  // OR we can use the Supabase SQL API directly.
  // The simplest approach: use the built-in pg_query via supabase's REST.

  const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    // If exec_sql doesn't exist yet, throw a specific error
    if (body.includes('Could not find the function') || body.includes('42883')) {
      throw new Error('EXEC_SQL_NOT_FOUND');
    }
    throw new Error(`SQL failed: ${body}`);
  }
}

async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from('_migrations')
    .select('name')
    .order('id');

  // Table doesn't exist yet — no migrations have run
  if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
    return [];
  }
  if (error) throw error;
  return (data || []).map((r) => r.name);
}

async function recordMigration(name) {
  const { error } = await supabase.from('_migrations').insert({ name });
  if (error) throw error;
}

async function bootstrap() {
  // Create the exec_sql function and _migrations table using Supabase's
  // built-in SQL execution via the management API.
  // We use supabase-js's underlying postgres connection through a raw query workaround.

  console.log('Bootstrapping: creating exec_sql function and _migrations table...');
  console.log('');
  console.log('  You need to run this SQL once in the Supabase SQL Editor:');
  console.log('');
  console.log('  -------------------------------------------------------');
  console.log(`
  CREATE OR REPLACE FUNCTION exec_sql(query text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    EXECUTE query;
  END;
  $$;

  CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT now()
  );
  `);
  console.log('  -------------------------------------------------------');
  console.log('');
  console.log('  After running that, come back and run: npm run migrate');
}

async function migrate() {
  const command = process.argv[2] || 'up';

  // --- CREATE ---
  if (command === 'create') {
    const name = process.argv[3];
    if (!name) {
      console.error('Usage: npm run migrate:create <migration_name>');
      process.exit(1);
    }
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const nextNum = String(files.length + 1).padStart(3, '0');
    const filename = `${nextNum}_${name}.sql`;
    fs.writeFileSync(path.join(migrationsDir, filename), '-- Write your SQL here\n');
    console.log(`Created: migrations/${filename}`);
    return;
  }

  // --- STATUS ---
  if (command === 'status') {
    const executed = await getExecutedMigrations();
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log('Migration status:\n');
    for (const file of files) {
      const status = executed.includes(file) ? 'DONE' : 'PENDING';
      console.log(`  [${status}]  ${file}`);
    }
    return;
  }

  // --- UP ---
  if (command === 'up') {
    console.log('Running migrations...\n');

    // Check if exec_sql function exists
    try {
      await runSQL('SELECT 1;');
    } catch (err) {
      if (err.message === 'EXEC_SQL_NOT_FOUND') {
        await bootstrap();
        process.exit(1);
      }
      throw err;
    }

    // Ensure _migrations table exists
    await runSQL(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const executed = await getExecutedMigrations();
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !executed.includes(f));

    if (pending.length === 0) {
      console.log('All migrations are up to date.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      process.stdout.write(`  Running: ${file} ... `);
      try {
        await runSQL(sql);
        await recordMigration(file);
        console.log('OK');
      } catch (err) {
        console.log('FAILED');
        console.error(`  Error: ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`\n${pending.length} migration(s) applied.`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.log('\nUsage:');
  console.log('  npm run migrate          Run all pending migrations');
  console.log('  npm run migrate:status   Show migration status');
  console.log('  npm run migrate:create   Create a new migration file');
  process.exit(1);
}

migrate().catch((err) => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
