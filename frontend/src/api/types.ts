// Auth
export interface AuthUser {
  message: string;
  name: string;
  email: string;
  attributes: Record<string, string>;
}

// Profile
export interface ProfileRequest {
  age: number;
  gender: string;
  city: string;
  scity: string;
  education: string;
  employment: string;
  disability: boolean;
  incomeInteger: number;
  asset: string;
  preferredCategories: string[];
}

export interface ProfileResponse extends ProfileRequest {
  uid: string;
  createdAt: string;
}

// Policy eligibility check item (정책 적합도 항목)
export interface EligibilityItem {
  label: string;
  value: string;
}

// Policy
export interface Policy {
  id: string;
  title: string;
  org: string;
  category: string;
  categoryKr: string;
  deadline: string;
  support: string;
  desc: string;
  match: number;
  region: string;
  bookmarked: boolean;
}

export interface PolicyDetail {
  fullDesc: string;
  benefits: string[];
  amount: string;
  scope: string;
  duration: string;
  target: string;
  method: string;
  eligibility?: EligibilityItem[];
}

// Checklist
export interface ChecklistItem {
  id: number;
  label: string;
  deadline: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  deadlineColor: string;
  deadlineBg: string;
  done: boolean;
}

// --- Orchestrator Types ---

export interface PrecomputeEligibilityRequest {
  uid: string;
}

export interface DocumentExtractRequest {
  policy_id: string;
}

export interface BenefitRequest {
  uid: string;
}

export interface SyncPolicyRequest {
  policy_id: string;
}

// 응답 타입 (FastAPI 리턴값 기준)
export interface OrchestratorBaseResponse {
  status: 'success' | 'error';
  workflow: string;
  message?: string;
}

export interface PrecomputeEligibilityResponse extends OrchestratorBaseResponse {
  uid?: string;
  eligible_count?: number;
  result?: any[]; // 필요에 따라 세부 타입으로 변경
}

export interface DocumentExtractResponse extends OrchestratorBaseResponse {
  policy_id?: string;
  document_count?: number;
  documents?: any[];
}

export interface BenefitResponse extends OrchestratorBaseResponse {
  uid?: string;
  total_cash_benefit?: string | number;
  total_service_benefit?: string | number;
  final_summary?: string;
  db_saved?: boolean;
}

export interface SyncPolicyResponse extends OrchestratorBaseResponse {
  policy_id?: string;
  matched_count?: number;
}