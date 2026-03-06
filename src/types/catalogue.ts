export interface ApprovedTool {
  id: string;
  name: string;
  description: string;
  category: string;
  vendor_url: string | null;
  training_url: string | null;
  training_notes: string | null;
  added_by: string;
  added_at: number;
  active: boolean;
}

export interface CreateApprovedToolInput {
  name: string;
  description: string;
  category: string;
  vendor_url?: string;
  training_url?: string;
  training_notes?: string;
  added_by: string;
}

export interface UpdateApprovedToolInput {
  name?: string;
  description?: string;
  category?: string;
  vendor_url?: string | null;
  training_url?: string | null;
  training_notes?: string | null;
}

export type CatalogueRequestStatus = "pending" | "approved" | "denied";

export interface CatalogueRequest {
  id: string;
  tool_id: string;
  tool_name: string;
  requester_name: string;
  requester_team: string;
  requester_role: string | null;
  business_reason: string;
  user_count: number;
  status: CatalogueRequestStatus;
  reviewer_note: string | null;
  created_at: number;
  resolved_at: number | null;
}

export interface CreateCatalogueRequestInput {
  tool_id: string;
  tool_name: string;
  requester_name: string;
  requester_team: string;
  requester_role?: string;
  business_reason: string;
  user_count: number;
}
