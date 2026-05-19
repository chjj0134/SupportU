import type { ChecklistItem } from '../types';

export const MOCK_CHECKLIST: ChecklistItem[] = [
  {
    id: 1,
    label: '청년 월세 지원 신청',
    deadline: 'D-1',
    category: '주거',
    categoryColor: '#2563eb',
    categoryBg: '#eff6ff',
    deadlineColor: '#ba1a1a',
    deadlineBg: 'rgba(186,26,26,0.1)',
    done: false,
  },
  {
    id: 2,
    label: '국민취업지원제도 서류 제출',
    deadline: 'D-day',
    category: '일자리',
    categoryColor: '#16a34a',
    categoryBg: '#f0fdf4',
    deadlineColor: '#fff',
    deadlineBg: '#ba1a1a',
    done: true,
  },
  {
    id: 3,
    label: '청년 내일저축계좌',
    deadline: 'D-3',
    category: '복지',
    categoryColor: '#9333ea',
    categoryBg: '#faf5ff',
    deadlineColor: '#f97316',
    deadlineBg: '#fff7ed',
    done: false,
  },
];
