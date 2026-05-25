import type { AuthUser } from '../types';

export const MOCK_USER: AuthUser = {
  message: '로그인 성공 (mock)',
  name: '김지원',
  email: 'mock@supportu.dev',
  attributes: {
    sub: 'mock-google-id-12345',
    name: '김지원',
    email: 'mock@supportu.dev',
    picture: '',
  },
};
