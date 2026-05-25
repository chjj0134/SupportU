import { apiClient } from './client';
import { withMock } from './config';
import type { ChecklistItem } from './types';
import { MOCK_CHECKLIST } from './__mocks__/checklist.mock';

export function fetchChecklist(): Promise<ChecklistItem[]> {
  return withMock(
    () => MOCK_CHECKLIST,
    () => apiClient.get<ChecklistItem[]>('/checklist'),
  );
}

export function updateChecklistItem(id: number, done: boolean): Promise<void> {
  return withMock(
    () => { console.info('[mock] update checklist', id, done); },
    () => apiClient.put(`/checklist/${id}`, { done }),
  );
}
