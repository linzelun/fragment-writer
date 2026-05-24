import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, title, content, summary, generatedAt, fragmentCount } = req.body;
  if (!projectId || !title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const versionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();

  const versionsKey = `project:${projectId}:versions`;
  const versions = (await kv.get(versionsKey)) || [];
  const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

  const version = {
    id: versionId,
    projectId,
    version: nextVersion,
    title,
    summary: summary || '',
    generatedAt: generatedAt || now,
    fragmentCount: fragmentCount || 0,
    createdAt: now,
  };

  versions.unshift(version);
  if (versions.length > 20) versions.length = 20;

  await Promise.all([
    kv.set(versionsKey, versions),
    kv.set(`version:${versionId}`, { ...version, content }),
    kv.set(`article:${projectId}`, { projectId, title, content, summary: summary || '', generatedAt: generatedAt || now, fragmentCount: fragmentCount || 0 }),
  ]);

  return res.json({ projectId, title, content, summary, generatedAt, fragmentCount, versionId });
}