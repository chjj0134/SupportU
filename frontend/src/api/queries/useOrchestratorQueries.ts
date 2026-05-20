import { useMutation } from '@tanstack/react-query';
import {
  precomputeEligibility,
  extractPolicyDocuments,
  calculateTotalBenefit,
  syncNewPolicy,
} from '../orchestrator';

// 1. 자격 검증 실행 훅
export function usePrecomputeEligibility() {
  return useMutation({
    mutationFn: precomputeEligibility,
  });
}

// 2. 서류 추출 실행 훅
export function useExtractPolicyDocuments() {
  return useMutation({
    mutationFn: extractPolicyDocuments,
  });
}

// 3. 혜택 요약 계산 실행 훅
export function useCalculateTotalBenefit() {
  return useMutation({
    mutationFn: calculateTotalBenefit,
  });
}

// 4. 정책 동기화 실행 훅
export function useSyncNewPolicy() {
  return useMutation({
    mutationFn: syncNewPolicy,
  });
}