import { BetterRecallData, CURRENT_SCHEMA_VERSION } from 'src/settings/data';
import { migrateToV2 } from './v2-migration';

type Migration = (data: BetterRecallData) => void;

const migrations: Record<number, Migration> = {
  2: migrateToV2,
};

export function runMigrations(data: BetterRecallData): boolean {
  // Default to schemaVersion = 1 for data created before v0.1.0, when the
  // `schemaVersion` field was introduced. Data from plugin versions prior to
  // v0.1.0 implicitly has schemaVersion = 1.
  const prevVersion = data.schemaVersion ?? 1;
  let migrated = false;

  for (
    let target = prevVersion + 1;
    target <= CURRENT_SCHEMA_VERSION;
    target++
  ) {
    const migration = migrations[target];
    if (!migration) {
      continue;
    }

    console.log(`BetterRecall: migrating schema ${target - 1} -> ${target}`);
    migration(data);
    data.schemaVersion = target;
    migrated = true;
  }

  return migrated;
}
