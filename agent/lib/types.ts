// ─── Session Stages ──────────────────────────────────────────────────────────

export type Stage =
  | 'welcome'           // Initial state — no idea given yet
  | 'business_intent'   // Gate 1: collecting the 3 intent questions
  | 'intake'            // Step 1–5: idea intake protocol
  | 'backlog_generated' // Backlog fully generated and saved
  | 'export'            // Exported to GitHub

// ─── Backlog Data Models ─────────────────────────────────────────────────────

export interface AcceptanceCriteria {
  given: string;
  when: string;
  then: string;
}

export interface UserStory {
  id: string;
  title: string;
  actor: string;
  action: string;
  outcome: string;
  acceptance_criteria: AcceptanceCriteria[];
  priority: 'Must Have' | 'Should Have' | 'Could Have' | "Won't Have";
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  phase: 'MVP' | 'Stabilization' | 'Enhancement' | 'Growth';
  business_value: number; // 1–5
  user_impact: number;    // 1–5
  feasibility: number;    // 1–5
  value_score: number;    // computed: (BV×0.4)+(UI×0.35)+(F×0.25)
}

export interface Epic {
  id: string;
  name: string;
  summary: string;
  business_value: string;
  target_users: string;
  priority: 'Must Have' | 'Should Have' | 'Could Have';
  phase: 'MVP' | 'Stabilization' | 'Enhancement' | 'Growth';
  stories: UserStory[];
}

export interface ProjectMeta {
  name: string;
  problem_statement: string;
  target_user: string;
  success_metrics: string;
  out_of_scope: string;
  tech_stack?: string;
  repository?: string; // owner/repo format for GitHub export
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GitHubExportRecord {
  exported_at: string;
  repo: string;
  issue_urls: string[];
}

export interface AgentSession {
  id: string;
  created_at: string;
  updated_at: string;
  stage: Stage;
  project?: ProjectMeta;
  epics: Epic[];
  messages: StoredMessage[];
  github_export?: GitHubExportRecord;
  tokens_used?: number; // cumulative token usage — enforced cap prevents runaway billing
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface ChatRequestBody {
  messages: { role: string; content: string }[];
  sessionId: string;
}

export interface ExportRequestBody {
  sessionId: string;
  owner: string;
  repo: string;
  token: string;
}

export interface ExportResponse {
  success: boolean;
  issues_created?: number;
  issue_urls?: string[];
  error?: string;
}
