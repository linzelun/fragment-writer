import { getProjects, getFragments, json, error } from '../_kv.js';

function matchesQuery(fragment, query) {
  const q = query.toLowerCase();
  const fields = [
    fragment.content,
    fragment.source,
    fragment.note,
    ...(fragment.tags || []),
  ];
  return fields.some((f) => f && String(f).toLowerCase().includes(q));
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return error(res, 'Method not allowed', 405);

    const { q, projectId, limit } = req.query;
    if (!q || !String(q).trim()) {
      return error(res, '请提供搜索关键词', 400);
    }

    const searchQuery = String(q).trim();
    const resultLimit = Math.min(parseInt(limit, 10) || 50, 100);

    let fragments = [];

    if (projectId) {
      fragments = await getFragments(projectId);
    } else {
      const projects = await getProjects();
      const all = await Promise.all(projects.map((p) => getFragments(p.id)));
      fragments = all.flat();
    }

    const results = fragments
      .filter((f) => matchesQuery(f, searchQuery))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, resultLimit);

    json(res, {
      query: searchQuery,
      total: results.length,
      results,
      fallback: true,
    });
  } catch (err) {
    error(res, err.message, 500);
  }
}
