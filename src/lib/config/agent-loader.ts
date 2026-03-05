import { getDb } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";
import { AgentConfigSchema, AgentsConfigSchema } from "@/config/agents.schema";
import type { AgentConfig } from "@/config/agents.schema";
import defaultAgents from "@/config/agents.json";

export function loadAgents(): AgentConfig[] {
  runMigrations();
  const db = getDb();

  // Parse default agents (validates at startup)
  const defaults = AgentsConfigSchema.parse(defaultAgents);

  // Merge in any DB overrides
  const dbRows = db
    .prepare("SELECT id, config FROM agent_configs")
    .all() as { id: string; config: string }[];

  const overrides = new Map(
    dbRows.map((row) => [row.id, JSON.parse(row.config) as unknown])
  );

  return defaults.map((agent) => {
    if (overrides.has(agent.id)) {
      const parsed = AgentConfigSchema.safeParse(overrides.get(agent.id));
      if (parsed.success) return parsed.data;
    }
    return agent;
  });
}

export function loadEnabledAgents(): AgentConfig[] {
  return loadAgents().filter((a) => a.enabled);
}

export function saveAgentConfig(config: AgentConfig): void {
  runMigrations();
  const validated = AgentConfigSchema.parse(config);
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT INTO agent_configs (id, config, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`
  ).run(validated.id, JSON.stringify(validated), now);
}
