import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LEDGER_PATH = path.join(ROOT, '.nocodb-migrations.json');

function defaultLedger() {
  return {
    version: 1,
    applied: [],
  };
}

export async function readLedger() {
  try {
    const raw = await fs.readFile(LEDGER_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.applied)) {
      return defaultLedger();
    }

    return parsed;
  } catch {
    return defaultLedger();
  }
}

export async function writeLedger(ledger) {
  await fs.writeFile(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

export async function markApplied(migrationId) {
  const ledger = await readLedger();
  const existing = ledger.applied.find((entry) => entry.id === migrationId);

  if (existing) {
    existing.appliedAt = new Date().toISOString();
  } else {
    ledger.applied.push({
      id: migrationId,
      appliedAt: new Date().toISOString(),
    });
  }

  await writeLedger(ledger);
}

export { LEDGER_PATH };
