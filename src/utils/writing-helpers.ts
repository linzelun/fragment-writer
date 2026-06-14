import type { Fragment } from '../types';

/** 写作台使用的素材：优先用手动选择，否则取最近 N 条 */
export function getWorkingFragments(
  sorted: Fragment[],
  selectedIds: Set<string>,
  limit = 5,
): { fragments: Fragment[]; source: 'selected' | 'recent' | 'all' } {
  if (selectedIds.size > 0) {
    return {
      fragments: sorted.filter((f) => selectedIds.has(f.id)),
      source: 'selected',
    };
  }
  if (sorted.length <= limit) {
    return { fragments: sorted, source: 'all' };
  }
  return { fragments: sorted.slice(0, limit), source: 'recent' };
}

export function selectRecentIds(sorted: Fragment[], count = 5): Set<string> {
  return new Set(sorted.slice(0, count).map((f) => f.id));
}

const SCAFFOLD_KEY = (projectId: string) => `fw-scaffold-${projectId}`;

export function loadScaffoldDraft(projectId: string): string {
  try {
    return localStorage.getItem(SCAFFOLD_KEY(projectId)) || '';
  } catch {
    return '';
  }
}

export function saveScaffoldDraft(projectId: string, content: string): void {
  if (content.trim()) {
    localStorage.setItem(SCAFFOLD_KEY(projectId), content);
  } else {
    localStorage.removeItem(SCAFFOLD_KEY(projectId));
  }
}
