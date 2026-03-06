export const CREATE_REQUESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    tool_name TEXT NOT NULL,
    tool_url TEXT,
    requester_name TEXT NOT NULL,
    requester_team TEXT NOT NULL,
    requester_role TEXT,
    business_justification TEXT NOT NULL,
    data_types TEXT NOT NULL,
    user_count TEXT NOT NULL,
    data_leaves_company INTEGER,
    estimated_cost TEXT,
    replaces_tool TEXT,
    existing_docs_url TEXT,
    intake_questions TEXT,
    intake_answers TEXT,
    intake_ready INTEGER DEFAULT 0,
    final_report TEXT,
    recommendation TEXT,
    risk_level TEXT,
    agents_config_snapshot TEXT
  )
`;

export const CREATE_MESSAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id),
    created_at INTEGER NOT NULL,
    phase INTEGER NOT NULL,
    round INTEGER,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    content TEXT NOT NULL,
    structured_data TEXT,
    token_count INTEGER,
    model_used TEXT
  )
`;

export const CREATE_AGENT_CONFIGS_TABLE = `
  CREATE TABLE IF NOT EXISTS agent_configs (
    id TEXT PRIMARY KEY,
    config TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`;

export const CREATE_APPROVED_TOOLS_TABLE = `
  CREATE TABLE IF NOT EXISTS approved_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    vendor_url TEXT,
    training_url TEXT,
    training_notes TEXT,
    added_by TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  )
`;

export const CREATE_CATALOGUE_REQUESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS catalogue_requests (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL REFERENCES approved_tools(id),
    tool_name TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_team TEXT NOT NULL,
    requester_role TEXT,
    business_reason TEXT NOT NULL,
    user_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_note TEXT,
    created_at INTEGER NOT NULL,
    resolved_at INTEGER
  )
`;

export const ADD_REQUIRES_SYSTEM_ACCESS_COLUMN =
  "ALTER TABLE requests ADD COLUMN requires_system_access INTEGER";

export const ADD_MESSAGES_INPUT_TOKENS_COLUMN =
  "ALTER TABLE messages ADD COLUMN input_tokens INTEGER";
export const ADD_MESSAGES_OUTPUT_TOKENS_COLUMN =
  "ALTER TABLE messages ADD COLUMN output_tokens INTEGER";
export const ADD_REQUESTS_TOTAL_COST_COLUMN =
  "ALTER TABLE requests ADD COLUMN total_cost_usd REAL";
