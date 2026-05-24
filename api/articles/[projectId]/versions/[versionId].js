import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { versionId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const version = await kv.get(`version:${versionId}`);
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }

  return res.json(version);
}