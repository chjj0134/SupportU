import type { CSSProperties, ReactNode } from 'react';

/**
 * 프로젝트 전반에서 사용하는 단락 컴포넌트.
 * Pretendard 폰트 + margin:0 기본값을 적용해
 * 각 페이지에서 중복 정의하던 P를 통합한다.
 */
export function P({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={className} style={{ fontFamily: 'Pretendard, sans-serif', margin: 0, ...style }}>
      {children}
    </p>
  );
}
