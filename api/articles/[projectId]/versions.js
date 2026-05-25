import { getVersions, json, error } from '../../../_kv.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return error(res, 'Method not allowed', 405);
    const versions = await getVersions(req.query.projectId);
    json(res, versions);
  } catch (err) {
    error(res, err.message, 500);
  }
}