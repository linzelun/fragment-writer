import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const versions = (await kv.get(`project:${projectId}:versions`)) || [];
  return res.json(versions);
}