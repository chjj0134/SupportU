import { useEffect, useState, useCallback, useRef } from 'react';

export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 비동기 데이터 페칭을 표준화한 훅.
 * useState + useEffect 보일러플레이트를 한 곳에서 관리하고
 * 일관된 로딩/에러/리페치 상태를 제공한다.
 *
 * @param fetcher 데이터 페칭 함수. deps가 바뀔 때마다 호출된다.
 * @param deps   useEffect 의존성. fetcher 내부에서 참조하는 외부 값을 포함시킬 것.
 *
 * 컴포넌트 언마운트 후 setState 호출을 막기 위해 ref로 mount 상태를 추적한다.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
    // fetcher는 deps가 동일하면 동일한 동작이라고 가정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refetch: run };
}
