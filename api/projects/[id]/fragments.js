import { getFragments, json, error } from '../../../_kv.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return error(res, 'Method not allowed', 405);
    const fragments = await getFragments(req.query.id);
    json(res, fragments);
  } catch (err) {
    error(res, err.message, 500);
  }
}