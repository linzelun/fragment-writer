import { getFragments, saveFragments, json, error } from '../_kv.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return error(res, 'Method not allowed', 405);
    const fragment = req.body;
    const fragments = await getFragments(fragment.projectId);
    fragments.push(fragment);
    await saveFragments(fragment.projectId, fragments);
    json(res, fragment);
  } catch (err) {
    error(res, err.message, 500);
  }
}