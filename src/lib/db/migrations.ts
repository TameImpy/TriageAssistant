import { getDb } from "./client";
import {
  CREATE_REQUESTS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_AGENT_CONFIGS_TABLE,
} from "./schema";

let migrated = false;

export function runMigrations(): void {
  if (migrated) return;
  const db = getDb();
  db.exec(CREATE_REQUESTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
  db.exec(CREATE_AGENT_CONFIGS_TABLE);
  migrated = true;
}
