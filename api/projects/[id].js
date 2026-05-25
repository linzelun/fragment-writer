import { getProjects, saveProjects, json, error } from '../../_kv.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) {
      return error(res, 'Project not found', 404);
    }

    if (req.method === 'PUT') {
      projects[index] = { ...projects[index], ...req.body, id, updatedAt: new Date().toISOString() };
      await saveProjects(projects);
      json(res, projects[index]);
    } else if (req.method === 'DELETE') {
      projects.splice(index, 1);
      await saveProjects(projects);
      json(res, { success: true });
    } else {
      error(res, 'Method not allowed', 405);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
}