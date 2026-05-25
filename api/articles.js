import { getVersions, saveVersions, getArticle, saveArticle, json, error } from './_kv.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return error(res, 'Method not allowed', 405);

    const article = req.body;
    const { projectId } = article;

    // 保存当前文章为新版本
    const existing = await getArticle(projectId);
    const versions = await getVersions(projectId);

    if (existing) {
      const versionEntry = {
        ...existing,
        id: generateId(),
        version: versions.length + 1,
        createdAt: new Date().toISOString(),
      };
      versions.push(versionEntry);
      await saveVersions(projectId, versions);
    }

    // 保存当前文章
    await saveArticle(projectId, article);
    json(res, article);
  } catch (err) {
    error(res, err.message, 500);
  }
}