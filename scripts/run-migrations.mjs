import { spawn } from 'node:child_process';

import { LEDGER_PATH, markApplied, readLedger } from './lib/migration-ledger.mjs';
import { migrations } from './migrations/index.mjs';

const APPLY = process.argv.includes('--apply');
const STATUS = process.argv.includes('--status');
const REAPPLY = process.argv.includes('--reapply');
const BACKUP_FIRST = process.argv.includes('--backup-first');

function getPendingMigrations(appliedIds) {
  return migrations.filter((migration) => REAPPLY || !appliedIds.has(migration.id));
}

function runCommand(commandParts) {
  return new Promise((resolve, reject) => {
    let [command, ...args] = commandParts;
    if (command === 'node') {
      command = process.execPath;
    }

    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${commandParts.join(' ')}`));
    });
  });
}

async function printStatus() {
  const ledger = await readLedger();
  const appliedIds = new Set(ledger.applied.map((entry) => entry.id));

  console.log(`Migration ledger: ${LEDGER_PATH}`);
  for (const migration of migrations) {
    const applied = ledger.applied.find((entry) => entry.id === migration.id);
    if (applied) {
      console.log(`[applied] ${migration.id} - ${migration.description} (${applied.appliedAt})`);
      continue;
    }

    console.log(`[pending] ${migration.id} - ${migration.description}`);
  }
}

async function main() {
  if (!APPLY || STATUS) {
    await printStatus();

    if (!APPLY) {
      const ledger = await readLedger();
      const appliedIds = new Set(ledger.applied.map((entry) => entry.id));
      const pending = getPendingMigrations(appliedIds);
      console.log(`Pending migrations: ${pending.length}`);
      return;
    }
  }

  const ledger = await readLedger();
  const appliedIds = new Set(ledger.applied.map((entry) => entry.id));
  const pending = getPendingMigrations(appliedIds);

  if (!pending.length) {
    console.log(REAPPLY ? 'No migrations available to reapply.' : 'All migrations are already applied.');
    return;
  }

  if (BACKUP_FIRST) {
    console.log('Running backup before migrations...');
    await runCommand(['node', 'scripts/nocodb-backup.mjs']);
  }

  for (const migration of pending) {
    console.log(`Applying ${migration.id}: ${migration.description}`);
    await runCommand(migration.command);
    await markApplied(migration.id);
  }

  console.log(`Applied ${pending.length} migration(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
