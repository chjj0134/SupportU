// Auth
export interface AuthUser {
  message: string;
  name: string;
  email: string;
  attributes: Record<string, unknown>;
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

export interface ProfileResponse {
  uid: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  scity: string | null;
  education: string | null;
  employment: string | null;
  disability: boolean | null;
  incomeInteger: number | null;
  asset: string | null;
  preferredCategories: string[] | null;
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
  region: string;
  bookmarked: boolean;
  detailUrl?: string | null;
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
  detailUrl?: string | null;
}

export interface PolicyDocument {
  id: number | null;
  name: string | null;
  required: boolean | null;
  description: string | null;
  url: string | null;
}

export interface ExtractPolicyDocumentsResponse {
  policyId: string;
  documentCount: number;
  documents: PolicyDocument[];
}

// Checklist
export interface ChecklistItem {
  id: number;
  policyId?: string;
  policyName?: string;
  documentName?: string;
  label: string;
  deadline: string;
  deadlineText?: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  deadlineColor: string;
  deadlineBg: string;
  checked?: boolean;
  done: boolean;
}
