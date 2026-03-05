import { nanoid } from "nanoid";
import { getDb } from "./client";
import { runMigrations } from "./migrations";
import type {
  RequestRecord,
  CreateRequestInput,
  RequestStatus,
  Recommendation,
  RiskLevel,
} from "@/types/request";
import type { IntakeQuestion, IntakeAnswer } from "@/types/agent";
import type { FinalReport } from "@/types/report";

function toRecord(row: Record<string, unknown>): RequestRecord {
  return {
    id: row.id as string,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    status: row.status as RequestStatus,
    tool_name: row.tool_name as string,
    tool_url: row.tool_url as string | null,
    requester_name: row.requester_name as string,
    requester_team: row.requester_team as string,
    requester_role: row.requester_role as string | null,
    business_justification: row.business_justification as string,
    data_types: JSON.parse(row.data_types as string) as string[],
    user_count: row.user_count as string,
    data_leaves_company:
      row.data_leaves_company === null
        ? null
        : (row.data_leaves_company as number) === 1,
    estimated_cost: row.estimated_cost as string | null,
    replaces_tool: row.replaces_tool as string | null,
    existing_docs_url: row.existing_docs_url as string | null,
    intake_questions: row.intake_questions
      ? (JSON.parse(row.intake_questions as string) as IntakeQuestion[])
      : null,
    intake_answers: row.intake_answers
      ? (JSON.parse(row.intake_answers as string) as IntakeAnswer[])
      : null,
    intake_ready: (row.intake_ready as number) === 1,
    final_report: row.final_report as string | null,
    recommendation: row.recommendation as Recommendation | null,
    risk_level: row.risk_level as RiskLevel | null,
    agents_config_snapshot: row.agents_config_snapshot as string | null,
  };
}

export function createRequest(input: CreateRequestInput): RequestRecord {
  runMigrations();
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO requests (
      id, created_at, updated_at, status,
      tool_name, tool_url, requester_name, requester_team, requester_role,
      business_justification, data_types, user_count, data_leaves_company,
      estimated_cost, replaces_tool, existing_docs_url
    ) VALUES (
      ?, ?, ?, 'draft',
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )`
  ).run(
    id,
    now,
    now,
    input.tool_name,
    input.tool_url ?? null,
    input.requester_name,
    input.requester_team,
    input.requester_role ?? null,
    input.business_justification,
    JSON.stringify(input.data_types),
    input.user_count,
    input.data_leaves_company === undefined || input.data_leaves_company === null
      ? null
      : input.data_leaves_company
      ? 1
      : 0,
    input.estimated_cost ?? null,
    input.replaces_tool ?? null,
    input.existing_docs_url ?? null
  );

  return getRequest(id)!;
}

export function getRequest(id: string): RequestRecord | null {
  runMigrations();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM requests WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return toRecord(row);
}

export function listRequests(): RequestRecord[] {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM requests ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(toRecord);
}

export interface UpdateRequestInput {
  status?: RequestStatus;
  intake_questions?: IntakeQuestion[] | null;
  intake_answers?: IntakeAnswer[] | null;
  intake_ready?: boolean;
  final_report?: FinalReport | null;
  recommendation?: Recommendation | null;
  risk_level?: RiskLevel | null;
  agents_config_snapshot?: string | null;
}

export function updateRequest(
  id: string,
  updates: UpdateRequestInput
): RequestRecord | null {
  runMigrations();
  const db = getDb();
  const now = Date.now();

  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.intake_questions !== undefined) {
    fields.push("intake_questions = ?");
    values.push(
      updates.intake_questions ? JSON.stringify(updates.intake_questions) : null
    );
  }
  if (updates.intake_answers !== undefined) {
    fields.push("intake_answers = ?");
    values.push(
      updates.intake_answers ? JSON.stringify(updates.intake_answers) : null
    );
  }
  if (updates.intake_ready !== undefined) {
    fields.push("intake_ready = ?");
    values.push(updates.intake_ready ? 1 : 0);
  }
  if (updates.final_report !== undefined) {
    fields.push("final_report = ?");
    values.push(
      updates.final_report ? JSON.stringify(updates.final_report) : null
    );
  }
  if (updates.recommendation !== undefined) {
    fields.push("recommendation = ?");
    values.push(updates.recommendation);
  }
  if (updates.risk_level !== undefined) {
    fields.push("risk_level = ?");
    values.push(updates.risk_level);
  }
  if (updates.agents_config_snapshot !== undefined) {
    fields.push("agents_config_snapshot = ?");
    values.push(updates.agents_config_snapshot);
  }

  values.push(id);
  db.prepare(
    `UPDATE requests SET ${fields.join(", ")} WHERE id = ?`
  ).run(...values);

  return getRequest(id);
}
