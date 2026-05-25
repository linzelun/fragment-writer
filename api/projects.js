import { getProjects, saveProjects, getFragments, json, error } from './_kv.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const projects = await getProjects();
      // 动态计算每个项目的 fragmentCount 和 lastFragmentAt
      const enriched = await Promise.all(projects.map(async (p) => {
        const fragments = await getFragments(p.id);
        const sorted = fragments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
          ...p,
          fragmentCount: fragments.length,
          lastFragmentAt: sorted.length > 0 ? sorted[0].createdAt : null,
        };
      }));
      json(res, enriched);
    } else if (req.method === 'POST') {
      const project = req.body;
      const projects = await getProjects();
      projects.push(project);
      await saveProjects(projects);
      const fragments = await getFragments(project.id);
      json(res, { ...project, fragmentCount: fragments.length });
    } else {
      error(res, 'Method not allowed', 405);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
}