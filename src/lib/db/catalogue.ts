import { nanoid } from "nanoid";
import { getDb } from "./client";
import { runMigrations } from "./migrations";
import type {
  ApprovedTool,
  CatalogueRequest,
  CatalogueRequestStatus,
  CreateApprovedToolInput,
  UpdateApprovedToolInput,
  CreateCatalogueRequestInput,
} from "@/types/catalogue";

function toToolRecord(row: Record<string, unknown>): ApprovedTool {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    category: row.category as string,
    vendor_url: row.vendor_url as string | null,
    training_url: row.training_url as string | null,
    training_notes: row.training_notes as string | null,
    added_by: row.added_by as string,
    added_at: row.added_at as number,
    active: (row.active as number) === 1,
  };
}

function toCatalogueRequestRecord(row: Record<string, unknown>): CatalogueRequest {
  return {
    id: row.id as string,
    tool_id: row.tool_id as string,
    tool_name: row.tool_name as string,
    requester_name: row.requester_name as string,
    requester_team: row.requester_team as string,
    requester_role: row.requester_role as string | null,
    business_reason: row.business_reason as string,
    user_count: row.user_count as number,
    status: row.status as CatalogueRequestStatus,
    reviewer_note: row.reviewer_note as string | null,
    created_at: row.created_at as number,
    resolved_at: row.resolved_at as number | null,
  };
}

// ── Approved Tools ──────────────────────────────────────────────────────────

export function listActiveTools(): ApprovedTool[] {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM approved_tools WHERE active = 1 ORDER BY name ASC")
    .all() as Record<string, unknown>[];
  return rows.map(toToolRecord);
}

export function listAllTools(): ApprovedTool[] {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM approved_tools ORDER BY added_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(toToolRecord);
}

export function getTool(id: string): ApprovedTool | null {
  runMigrations();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM approved_tools WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return toToolRecord(row);
}

export function createTool(input: CreateApprovedToolInput): ApprovedTool {
  runMigrations();
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO approved_tools (id, name, description, category, vendor_url, training_url, training_notes, added_by, added_at, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(
    id,
    input.name,
    input.description,
    input.category,
    input.vendor_url ?? null,
    input.training_url ?? null,
    input.training_notes ?? null,
    input.added_by,
    now
  );

  return getTool(id)!;
}

export function updateTool(id: string, updates: UpdateApprovedToolInput): ApprovedTool | null {
  runMigrations();
  const db = getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
  if (updates.vendor_url !== undefined) { fields.push("vendor_url = ?"); values.push(updates.vendor_url); }
  if (updates.training_url !== undefined) { fields.push("training_url = ?"); values.push(updates.training_url); }
  if (updates.training_notes !== undefined) { fields.push("training_notes = ?"); values.push(updates.training_notes); }

  if (fields.length === 0) return getTool(id);

  values.push(id);
  db.prepare(`UPDATE approved_tools SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return getTool(id);
}

export function deactivateTool(id: string): void {
  runMigrations();
  const db = getDb();
  db.prepare("UPDATE approved_tools SET active = 0 WHERE id = ?").run(id);
}

// ── Catalogue Requests ──────────────────────────────────────────────────────

export function createCatalogueRequest(input: CreateCatalogueRequestInput): CatalogueRequest {
  runMigrations();
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO catalogue_requests (id, tool_id, tool_name, requester_name, requester_team, requester_role, business_reason, user_count, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id,
    input.tool_id,
    input.tool_name,
    input.requester_name,
    input.requester_team,
    input.requester_role ?? null,
    input.business_reason,
    input.user_count,
    now
  );

  return getCatalogueRequest(id)!;
}

export function getCatalogueRequest(id: string): CatalogueRequest | null {
  runMigrations();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM catalogue_requests WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return toCatalogueRequestRecord(row);
}

export function listCatalogueRequests(): CatalogueRequest[] {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM catalogue_requests ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(toCatalogueRequestRecord);
}

export function resolveCatalogueRequest(
  id: string,
  status: "approved" | "denied",
  reviewer_note?: string
): CatalogueRequest | null {
  runMigrations();
  const db = getDb();
  db.prepare(
    "UPDATE catalogue_requests SET status = ?, reviewer_note = ?, resolved_at = ? WHERE id = ?"
  ).run(status, reviewer_note ?? null, Date.now(), id);
  return getCatalogueRequest(id);
}
