// 정책 카테고리는 백엔드 영문 키(Housing/Jobs/Welfare)와
// 화면 표시용 한글 라벨(주거/일자리/복지)을 함께 관리한다.
// 색상 토큰까지 한 곳에 모아 컴포넌트 간 일관성을 보장한다.

export type CategoryKey = 'Housing' | 'Jobs' | 'Welfare';
export type CategoryLabel = '주거' | '일자리' | '복지';

export interface CategoryStyle {
  /** 본문/뱃지에서 사용하는 텍스트 색 */
  text: string;
  /** 카테고리 뱃지 배경 */
  bg: string;
  /** 카테고리 카드/박스 테두리 */
  border: string;
}

export const CATEGORIES: Record<CategoryKey, { label: CategoryLabel; style: CategoryStyle }> = {
  Housing: {
    label: '주거',
    style: { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  },
  Jobs: {
    label: '일자리',
    style: { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  },
  Welfare: {
    label: '복지',
    style: { text: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  },
};

export const FALLBACK_CATEGORY_STYLE: CategoryStyle = {
  text: '#475569',
  bg: '#f1f5f9',
  border: '#e2e8f0',
};

/** 백엔드 영문 키 또는 화면 한글 라벨 둘 다 받아서 스타일 반환 */
export function getCategoryStyle(category: string): CategoryStyle {
  if (category in CATEGORIES) return CATEGORIES[category as CategoryKey].style;
  const match = Object.values(CATEGORIES).find((c) => c.label === category);
  return match ? match.style : FALLBACK_CATEGORY_STYLE;
}

export function getCategoryLabel(category: string): string {
  if (category in CATEGORIES) return CATEGORIES[category as CategoryKey].label;
  return category;
}

/** 마감일 임박 정도에 따라 색상을 반환 ("D-3" → 빨강, "D-30" → 회색, "상시" → 회색) */
export function getDeadlineColor(deadline: string): string {
  if (deadline === '상시') return '#475569';
  const days = parseInt(deadline.replace('D-', ''), 10);
  if (Number.isNaN(days)) return '#475569';
  if (days <= 3) return '#ba1a1a';
  if (days <= 7) return '#f97316';
  return '#475569';
}
