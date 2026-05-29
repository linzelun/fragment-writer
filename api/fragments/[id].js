import { getProjects, getFragments, saveFragments, json, error } from '../../_kv.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    // 需要遍历所有项目找到该 fragment 所属的项目
    const projects = await getProjects();
    let targetProjectId = null;
    let fragments = [];
    let fragIndex = -1;

    for (const project of projects) {
      const fgs = await getFragments(project.id);
      const idx = fgs.findIndex(f => f.id === id);
      if (idx !== -1) {
        targetProjectId = project.id;
        fragments = fgs;
        fragIndex = idx;
        break;
      }
    }

    if (fragIndex === -1) return error(res, 'Fragment not found', 404);

    if (req.method === 'PUT') {
      fragments[fragIndex] = { ...fragments[fragIndex], ...req.body, id, updatedAt: new Date().toISOString() };
      await saveFragments(targetProjectId, fragments);
      json(res, fragments[fragIndex]);
    } else if (req.method === 'DELETE') {
      fragments.splice(fragIndex, 1);
      await saveFragments(targetProjectId, fragments);
      json(res, { ok: true });
    } else {
      error(res, 'Method not allowed', 405);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
}