import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 마이페이지 정책 비교 기능에 사용되는 client-only 상태.
 * 서버 상태가 아니므로 React Query가 아닌 Zustand로 관리한다.
 * persist로 새로고침 후에도 선택 상태가 유지되도록 한다.
 */
interface CompareState {
  selectedIds: string[];
  toggle: (id: string, categoryGuard?: (currentSelected: string[]) => boolean) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      toggle: (id, categoryGuard) => {
        const current = get().selectedIds;
        if (current.includes(id)) {
          set({ selectedIds: current.filter((x) => x !== id) });
          return;
        }
        // 같은 카테고리만 비교 가능 같은 외부 규칙을 컴포넌트가 주입할 수 있게 함
        if (categoryGuard && !categoryGuard(current)) return;
        set({ selectedIds: [...current, id] });
      },
      clear: () => set({ selectedIds: [] }),
      isSelected: (id) => get().selectedIds.includes(id),
    }),
    {
      name: 'supportu-compare',
      // 페이지 이탈 후 돌아왔을 때만 유지, 브라우저 닫으면 초기화하려면 sessionStorage
      // 여기서는 localStorage 기본값 사용
    },
  ),
);
