import { getArticle, saveArticle, json, error } from '../../_kv.js';

export default async function handler(req, res) {
  try {
    const { projectId } = req.query;

    if (req.method === 'GET') {
      const article = await getArticle(projectId);
      if (!article) return error(res, 'Article not found', 404);
      json(res, article);
    } else if (req.method === 'POST') {
      const article = { ...req.body, projectId };
      await saveArticle(projectId, article);
      json(res, article);
    } else {
      error(res, 'Method not allowed', 405);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
}