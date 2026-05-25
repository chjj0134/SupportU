import type { ProfileResponse } from '../types';

export const MOCK_PROFILE: ProfileResponse = {
  uid: 'mock-google-id-12345',
  createdAt: '2024-01-15T09:00:00.000Z',
  age: 26,
  gender: '남성',
  city: '서울특별시',
  scity: '강남구',
  education: '대졸',
  employment: '구직중',
  disability: false,
  incomeInteger: 2500000,
  asset: '5000만원 미만',
  preferredCategories: ['Housing', 'Jobs'],
};
