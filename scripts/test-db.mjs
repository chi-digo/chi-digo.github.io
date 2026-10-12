#!/usr/bin/env node
/**
 * Database tests against the linked (production) project, inside transactions that always roll back
 * (spec 34 technical §11, owner decision: production with guards).
 *
 *   npm run test:db                          every supabase/tests/*.sql against the current schema
 *   npm run test:db -- --migration <version> up → checks → every test → down → checks, all rolled back
 *   npm run test:db -- rls_contributions     only files whose name contains the filter
 *
 * Guards:
 * - each run is one batch: begin; lock_timeout 2s; statement_timeout 30s; …; rollback;
 * - files with commit, end; rollback to, vacuum or concurrently outside function bodies are refused;
 * - migration runs take short table locks (lock_timeout 2s); the owner allows them at any time
 *   (2026-10-12: "we barely have any users").
 * Checks are `do $$ … assert … $$` blocks: a failed assert aborts the batch and exits non-zero.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const TESTS = join(ROOT, 'supabase/tests');
const args = process.argv.slice(2);
const migIdx = args.indexOf('--migration');
const migration = migIdx >= 0 ? args[migIdx + 1] : null;
const filter = args.find((a, i) => !a.startsWith('--') && i !== migIdx + 1);

/** Strip comments and dollar-quoted bodies, so function bodies' `end;` doesn't trip the guard. */
function outsideBodies(sql) {
  return sql
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

const FORBIDDEN = /\bcommit\b|\bend\s*;|\brollback\s+to\b|\bvacuum\b|\bconcurrently\b|\bbegin\s*;|\brollback\s*;/i;

function guard(name, sql) {
  const hit = outsideBodies(sql).match(FORBIDDEN);
  if (hit) {
    console.error(`refused: ${name} contains "${hit[0]}" outside a function body`);
    process.exit(2);
  }
}

function read(path) {
  const sql = readFileSync(path, 'utf-8');
  guard(path.replace(ROOT + '/', ''), sql);
  return `-- ${path.replace(ROOT + '/', '')}\n${sql}\n`;
}

// The CLI's Management API behaviour (one batch, exit code on error) was verified on 2.120.
const version = execFileSync('supabase', ['--version'], { encoding: 'utf-8' }).trim();
const [maj, min] = version.split('.').map(Number);
if (maj < 2 || (maj === 2 && min < 120)) {
  console.error(`refused: Supabase CLI ${version} is older than 2.120; run brew upgrade supabase`);
  process.exit(2);
}

const fixtures = read(join(TESTS, '_fixtures.sql'));
const testFiles = readdirSync(TESTS)
  .filter((f) => f.endsWith('.sql') && !f.startsWith('_'))
  .filter((f) => !filter || f.includes(filter))
  .sort();

let body = '';
if (migration) {
  const up = readdirSync(join(ROOT, 'supabase/migrations')).find((f) => f.startsWith(migration));
  const down = join(ROOT, 'supabase/rollbacks', `${up?.replace(/\.sql$/, '')}.down.sql`);
  if (!up || !existsSync(down)) {
    console.error(`missing migration or rollback for ${migration}`);
    process.exit(2);
  }
  body += read(join(ROOT, 'supabase/migrations', up));
  body += read(join(TESTS, 'migration', `${migration}_after_up.sql`));
  body += fixtures;
  for (const f of testFiles) body += read(join(TESTS, f));
  body += 'reset role;\n';
  body += read(down);
  body += read(join(TESTS, 'migration', `${migration}_after_down.sql`));
} else {
  body += fixtures;
  for (const f of testFiles) body += read(join(TESTS, f));
}

const batch = `begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';
${body}
reset role;
rollback;
select 'ok' as result;
`;

const dir = mkdtempSync(join(tmpdir(), 'test-db-'));
const file = join(dir, 'batch.sql');
writeFileSync(file, batch);
console.log(`${migration ? `migration ${migration} + ` : ''}${testFiles.length} test file(s): ${testFiles.join(', ')}`);
try {
  const out = execFileSync('supabase', ['db', 'query', '--linked', '-f', file, '--output-format', 'json'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 300_000,
  });
  if (!out.includes('"ok"')) {
    console.error('unexpected output:\n' + out.slice(0, 2000));
    process.exit(1);
  }
  console.log('PASS: all checks passed (rolled back)');
} catch (err) {
  const msg = [err.stdout, err.stderr, err.message].filter(Boolean).map(String).join('\n');
  console.error('FAIL:\n' + msg.slice(0, 4000));
  process.exit(1);
}
