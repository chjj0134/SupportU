/**
 * API 환경 설정 단일 진입점.
 *
 * 모든 env 변수는 이 파일에서만 읽는다. 다른 모듈에서 import.meta.env를 직접 참조하지 않는다.
 *
 * mock ↔ 실제 전환: .env 에서 VITE_USE_MOCK 한 줄만 바꾸면 전체 API가 전환된다.
 *   VITE_USE_MOCK=true   → 모든 API가 __mocks__/ 데이터를 반환
 *   VITE_USE_MOCK=false  → 모든 API가 VITE_API_BASE_URL 백엔드를 호출
 */

const parseBoolean = (value: string | undefined, defaultValue = false): boolean =>
  value === undefined ? defaultValue : value === 'true';

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMock: parseBoolean(import.meta.env.VITE_USE_MOCK),
} as const;

const MOCK_LATENCY_MS = 150;

/**
 * mock/실제 API 분기 헬퍼.
 *
 * useMock=true 일 때 mockFn 결과를 MOCK_LATENCY_MS 지연 후 resolve.
 * useMock=false 일 때 realFn Promise를 그대로 반환.
 *
 * @example
 * export function fetchPolicies(): Promise<Policy[]> {
 *   return withMock(
 *     () => MOCK_POLICIES,
 *     () => apiClient.get<Policy[]>('/policies'),
 *   );
 * }
 */
export function withMock<T>(
  mockFn: () => T | Promise<T>,
  realFn: () => Promise<T>,
): Promise<T> {
  if (apiConfig.useMock) {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          Promise.resolve(mockFn()).then(resolve, reject);
        } catch (err) {
          reject(err);
        }
      }, MOCK_LATENCY_MS),
    );
  }
  return realFn();
}
