import { nanoid } from "nanoid";
import { getDb } from "./client";
import { runMigrations } from "./migrations";
import type { MessageRecord, SaveMessageInput } from "@/types/message";
import type { AgentAnalysis } from "@/types/agent";

function toRecord(row: Record<string, unknown>): MessageRecord {
  return {
    id: row.id as string,
    request_id: row.request_id as string,
    created_at: row.created_at as number,
    phase: row.phase as 1 | 2 | 3 | 4,
    round: row.round as number | null,
    agent_id: row.agent_id as string,
    agent_name: row.agent_name as string,
    content: row.content as string,
    structured_data: row.structured_data
      ? (JSON.parse(row.structured_data as string) as AgentAnalysis)
      : null,
    token_count: row.token_count as number | null,
    model_used: row.model_used as string | null,
    input_tokens: row.input_tokens as number | null,
    output_tokens: row.output_tokens as number | null,
  };
}

export function saveMessage(input: SaveMessageInput): MessageRecord {
  runMigrations();
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO messages (
      id, request_id, created_at, phase, round,
      agent_id, agent_name, content, structured_data, token_count, model_used,
      input_tokens, output_tokens
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.request_id,
    now,
    input.phase,
    input.round ?? null,
    input.agent_id,
    input.agent_name,
    input.content,
    input.structured_data ? JSON.stringify(input.structured_data) : null,
    input.token_count ?? null,
    input.model_used ?? null,
    input.input_tokens ?? null,
    input.output_tokens ?? null
  );

  return getMessagesByRequest(input.request_id).find((m) => m.id === id)!;
}

export function getMessagesByRequest(requestId: string): MessageRecord[] {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC"
    )
    .all(requestId) as Record<string, unknown>[];
  return rows.map(toRecord);
}
