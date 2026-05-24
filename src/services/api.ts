import type { WritingProject, Fragment, ArticleOutput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const projectsApi = {
  list: () => api<WritingProject[]>('/api/projects'),
  create: (data: Omit<WritingProject, 'id' | 'createdAt' | 'updatedAt'>) =>
    api<WritingProject>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, updates: Partial<WritingProject>) =>
    api<WritingProject>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id: string) => api<{ ok: true }>(`/api/projects/${id}`, { method: 'DELETE' }),
};

export const fragmentsApi = {
  listByProject: (projectId: string) => api<Fragment[]>(`/api/projects/${projectId}/fragments`),
  create: (data: Omit<Fragment, 'id' | 'createdAt' | 'updatedAt'>) =>
    api<Fragment>('/api/fragments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, updates: Partial<Fragment>) =>
    api<Fragment>(`/api/fragments/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id: string) => api<{ ok: true }>(`/api/fragments/${id}`, { method: 'DELETE' }),
};

export const articlesApi = {
  get: (projectId: string) => api<ArticleOutput | null>(`/api/articles/${projectId}`),
  save: (data: ArticleOutput & { projectId: string }) =>
    api<ArticleOutput>('/api/articles', { method: 'POST', body: JSON.stringify(data) }),
};
