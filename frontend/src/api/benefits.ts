import { apiClient } from './client';

const USE_MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === 'true';

export interface ServiceBenefitResponse {
    benefitType: string | null;
    benefitItem: string | null;
    effectSummary: string | null;
}

export interface BenefitSummaryResponse {
    totalBenefitAmount: number;
    benefitPeriodText: string;
    serviceBenefits: ServiceBenefitResponse[];
}

export interface TotalBenefitRequest {
    userId: string;
}

export async function getBenefitSummary(userId: string): Promise<BenefitSummaryResponse> {
    if (USE_MOCK_AUTH) {
        return {
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
    }

    return apiClient.get<BenefitSummaryResponse>(`/v1/users/${userId}/benefits/summary`);
}

export async function triggerTotalBenefit(request: TotalBenefitRequest): Promise<void> {
    if (USE_MOCK_AUTH) {
        return;
    }

    return apiClient.post<void>('/orchestrator/total-benefit', request);
}