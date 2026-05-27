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
