import type { BenefitSummaryResponse } from '../benefits';

export const MOCK_BENEFIT_SUMMARY: BenefitSummaryResponse = {
  totalBenefitAmount: 3270000,
  benefitPeriodText: '2024.03 ~ 현재',
  serviceBenefits: [
    {
      benefitType: '서비스',
      benefitItem: '면접 정장 대여',
      effectSummary: '면접 정장 대여 10회 제공',
    },
    {
      benefitType: '상담',
      benefitItem: '심리상담',
      effectSummary: '심리상담 8회 제공',
    },
  ],
};
